import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChatMessage, Conversations, Conversation, newsPrompts, Insight, insightTabsConfig, InsightStatus, PendingInsightModification, ChatMessageFeedback } from '../services/types';
import { 
    getGameNews, 
    sendMessageWithImages, 
    sendMessage as sendTextToGemini, 
    isChatActive, 
    resetChat as resetGeminiChat, 
    renameChatSession,
    getUpcomingReleases,
    getLatestReviews,
    getGameTrailers,
    generateInitialProHint,
    generateUnifiedInsights,
    generateInsightStream,
    generateInsightWithSearch
} from '../services/geminiService';
import { ttsService } from '../services/ttsService';
import { unifiedUsageService } from '../services/unifiedUsageService';

const COOLDOWN_KEY = 'geminiCooldownEnd';
const COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hour

const EVERYTHING_ELSE_ID = 'everything-else';
const CONVERSATIONS_STORAGE_KEY = 'otakonConversations';

type ImageFile = { base64: string; mimeType: string; dataUrl: string };

const generateGameId = (gameName: string) => {
    return gameName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const allOtakonTags = [
    'GAME_ID', 'CONFIDENCE', 'GAME_PROGRESS', 'GENRE',
    'GAME_IS_UNRELEASED', 'TRIUMPH', 'INVENTORY_ANALYSIS',
    'INSIGHT_UPDATE', 'SUGGESTIONS',
    'INSIGHT_MODIFY_PENDING', 'INSIGHT_DELETE_REQUEST',
    'OBJECTIVE_SET', 'OBJECTIVE_COMPLETE'
];
const tagCleanupRegex = new RegExp(`\\[OTAKON_(${allOtakonTags.join('|')}):.*?\\]`, 'gs');


const sortConversations = (conversations: Conversations) => (aId: string, bId: string): number => {
    const a = conversations[aId];
    const b = conversations[bId];

    if (!a || !b) return 0;

    if (a.id === EVERYTHING_ELSE_ID) return -1;
    if (b.id === EVERYTHING_ELSE_ID) return 1;

    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    const aTimestamp = a.lastInteractionTimestamp || a.createdAt;
    const bTimestamp = b.lastInteractionTimestamp || b.createdAt;
    return bTimestamp - aTimestamp;
};


export const useChat = (isHandsFreeMode: boolean) => {
    const [chatState, setChatState] = useState<{ 
        conversations: Conversations, 
        order: string[],
        activeId: string,
    }>({
        conversations: {},
        order: [],
        activeId: EVERYTHING_ELSE_ID,
    });
    const { conversations, order: conversationsOrder, activeId: activeConversationId } = chatState;
    
    const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
    const [isCooldownActive, setIsCooldownActive] = useState(false);
    const [pendingModification, setPendingModification] = useState<PendingInsightModification | null>(null);
    const abortControllersRef = useRef<Record<string, AbortController>>({});
    
    const conversationsRef = useRef(conversations);
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);
    
    const conversationsOrderRef = useRef(conversationsOrder);
    useEffect(() => {
        conversationsOrderRef.current = conversationsOrder;
    }, [conversationsOrder]);
    
    const saveConversationsToLocalStorage = useCallback(() => {
        try {
            if (Object.keys(conversationsRef.current).length > 0) {
                const serialized = JSON.stringify({
                    conversations: conversationsRef.current,
                    order: conversationsOrderRef.current,
                    activeId: activeConversationId
                });
                 const size = new Blob([serialized]).size;
                if (size > 4 * 1024 * 1024) { // Warn if > 4MB
                     console.warn(`LocalStorage size is getting large: ${(size / 1024 / 1024).toFixed(2)} MB. Consider backend solution.`);
                }
                localStorage.setItem(CONVERSATIONS_STORAGE_KEY, serialized);
            }
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [activeConversationId]);

    useEffect(() => {
        let loadedState: { conversations: Conversations; order: string[]; activeId: string; } | null = null;
        try {
            const storedState = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
            if (storedState) loadedState = JSON.parse(storedState);
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        }

        if (loadedState && loadedState.conversations && loadedState.order) {
            setChatState(loadedState);
        } else {
             setChatState({
                conversations: {
                    [EVERYTHING_ELSE_ID]: {
                        id: EVERYTHING_ELSE_ID,
                        title: 'Everything else',
                        messages: [],
                        createdAt: Date.now(),
                    }
                },
                order: [EVERYTHING_ELSE_ID],
                activeId: EVERYTHING_ELSE_ID
            });
        }

    }, []);


    useEffect(() => {
        const handler = setTimeout(saveConversationsToLocalStorage, 500);
        return () => clearTimeout(handler);
    }, [chatState, saveConversationsToLocalStorage]);

    useEffect(() => {
        const cooldownEnd = localStorage.getItem(COOLDOWN_KEY);
        if (cooldownEnd && Date.now() < parseInt(cooldownEnd, 10)) {
            setIsCooldownActive(true);
            const timeRemaining = parseInt(cooldownEnd, 10) - Date.now();
            const timer = setTimeout(() => setIsCooldownActive(false), timeRemaining > 0 ? timeRemaining : 0);
            return () => clearTimeout(timer);
        }
    }, []);

    const activeConversation = useMemo(() => conversations[activeConversationId], [conversations, activeConversationId]);
    
    const updateConversation = useCallback((convoId: string, updateFn: (convo: Conversation) => Conversation, skipTimestamp?: boolean) => {
        setChatState(prev => {
            const newConversations = { ...prev.conversations };
            const convo = newConversations[convoId];
            if (convo) {
                const updatedConvo = updateFn(convo);
                if (!skipTimestamp) {
                    updatedConvo.lastInteractionTimestamp = Date.now();
                }
                newConversations[convoId] = updatedConvo;
                const newOrder = [...prev.order].sort(sortConversations(newConversations));
                return { ...prev, conversations: newConversations, order: newOrder };
            }
            return prev;
        });
    }, []);

    const updateMessageInConversation = useCallback((convoId: string, messageId: string, updateFn: (msg: ChatMessage) => ChatMessage) => {
        updateConversation(convoId, convo => ({
            ...convo,
            messages: convo.messages.map(m => m.id === messageId ? updateFn(m) : m)
        }));
    }, [updateConversation]);
    
    const addSystemMessage = useCallback((text: string, convoId?: string, showUpgradeButton?: boolean) => {
        const targetConvoId = convoId || activeConversationId;
        const message: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'model',
            text,
            showUpgradeButton: showUpgradeButton || false,
        };
        updateConversation(targetConvoId, convo => ({
            ...convo,
            messages: [...convo.messages, message]
        }));
    }, [activeConversationId, updateConversation]);

    const handleQuotaError = useCallback((failedMessageId: string) => {
        setIsCooldownActive(true);
        setTimeout(() => setIsCooldownActive(false), COOLDOWN_DURATION);
        const errorText = "The AI is currently resting due to high traffic. Service will resume in about an hour.";
        updateMessageInConversation(activeConversationId, failedMessageId, msg => ({ ...msg, text: `Error: ${errorText}` }));
        setLoadingMessages(prev => prev.filter(id => id !== failedMessageId));
    }, [activeConversationId, updateMessageInConversation]);

    const deleteInsight = useCallback((convoId: string, insightId: string) => {
        updateConversation(convoId, convo => {
            if (!convo.insights || !convo.insightsOrder) return convo;
            const newInsights = { ...convo.insights };
            delete newInsights[insightId];
            const newOrder = convo.insightsOrder.filter(id => id !== insightId);
            return { ...convo, insights: newInsights, insightsOrder: newOrder };
        });
    }, [updateConversation]);

    const reorderConversations = useCallback((sourceIndex: number, destIndex: number) => {
        setChatState(prev => {
            const newOrder = [...prev.order];
            const [removed] = newOrder.splice(sourceIndex, 1);
            newOrder.splice(destIndex, 0, removed);
            return { ...prev, order: newOrder };
        });
    }, []);

    const markInsightAsRead = useCallback((convoId: string, insightId: string) => {
        updateConversation(convoId, convo => {
            if (convo.insights?.[insightId]?.isNew) {
                const newInsights = { ...convo.insights };
                newInsights[insightId] = { ...newInsights[insightId], isNew: false };
                return { ...convo, insights: newInsights };
            }
            return convo;
        }, true); // skip timestamp update
    }, [updateConversation]);

    const pinConversation = useCallback((convoId: string, isPinned: boolean) => {
        updateConversation(convoId, convo => ({
            ...convo,
            isPinned,
        }));
    }, [updateConversation]);

    const deleteConversation = useCallback((convoId: string) => {
        if (convoId === EVERYTHING_ELSE_ID) return;
        setChatState(prev => {
            const newConversations = { ...prev.conversations };
            delete newConversations[convoId];
            const newOrder = prev.order.filter(id => id !== convoId);
            let newActiveId = prev.activeId;
            if (prev.activeId === convoId) {
                newActiveId = EVERYTHING_ELSE_ID;
            }
            return { conversations: newConversations, order: newOrder, activeId: newActiveId };
        });
    }, []);

    const reorderInsights = useCallback((convoId: string, sourceIndex: number, destIndex: number) => {
        updateConversation(convoId, convo => {
            if (!convo.insightsOrder) return convo;
            const newOrder = [...convo.insightsOrder];
            const [removed] = newOrder.splice(sourceIndex, 1);
            newOrder.splice(destIndex, 0, removed);
            return { ...convo, insightsOrder: newOrder };
        });
    }, [updateConversation]);

    const overwriteInsight = useCallback((convoId: string, insightId: string, newTitle: string, newContent: string) => {
        updateConversation(convoId, convo => {
            if (!convo.insights || !convo.insights[insightId]) return convo;
            const newInsights = { ...convo.insights };
            newInsights[insightId] = {
                ...newInsights[insightId],
                title: newTitle,
                content: newContent,
                status: 'loaded',
                isNew: true,
            };
            return { ...convo, insights: newInsights };
        });
    }, [updateConversation]);

    const createNewInsight = useCallback((convoId: string, title: string, content: string) => {
        updateConversation(convoId, convo => {
            const newId = generateGameId(title);
            if (convo.insights?.[newId]) {
                addSystemMessage(`An insight with a similar title already exists. Please choose a different title.`);
                return convo;
            }
            const newInsight: Insight = {
                id: newId,
                title,
                content,
                status: 'loaded',
                isNew: true,
            };
            const newInsights = { ...(convo.insights || {}), [newId]: newInsight };
            const newOrder = [...(convo.insightsOrder || []), newId];
            return { ...convo, insights: newInsights, insightsOrder: newOrder };
        });
    }, [updateConversation, addSystemMessage]);

    const updateMessageFeedback = useCallback((convoId: string, messageId: string, vote: ChatMessageFeedback) => {
        updateMessageInConversation(convoId, messageId, msg => ({ ...msg, feedback: vote }));
    }, [updateMessageInConversation]);

    const updateInsightFeedback = useCallback((convoId: string, insightId: string, vote: ChatMessageFeedback) => {
        updateConversation(convoId, convo => {
            if (!convo.insights?.[insightId]) return convo;
            const newInsights = { ...convo.insights };
            newInsights[insightId] = { ...newInsights[insightId], feedback: vote };
            return { ...convo, insights: newInsights };
        });
    }, [updateConversation]);
    
    const sendMessage = useCallback(async (text: string, images?: ImageFile[], isFromPC?: boolean): Promise<{ success: boolean; reason?: string }> => {
        const textQueries = text.trim().length > 0 ? 1 : 0;
        const imageQueries = images ? images.length : 0;

        if (textQueries === 0 && imageQueries === 0) return { success: true };
        
        ttsService.cancel();

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            text,
            images: images?.map(img => img.dataUrl),
            isFromPC
        };

        const sourceConvoId = activeConversationId;
        
        const modelMessageId = crypto.randomUUID();
        const placeholderMessage: ChatMessage = { id: modelMessageId, role: 'model', text: '' };

        // Add user and placeholder messages to the source conversation immediately for UI responsiveness
        updateConversation(sourceConvoId, convo => ({
            ...convo,
            messages: [...convo.messages, userMessage, placeholderMessage]
        }));
        setLoadingMessages(prev => [...prev, modelMessageId]);
        
        const usage = unifiedUsageService.getUsage();
        const { tier, textCount, textLimit, imageCount, imageLimit } = usage;
        
        if (tier === 'free') {
            if ((textQueries > 0 && textCount >= textLimit) || (imageQueries > 0 && imageCount >= imageLimit)) {
                 addSystemMessage(`You've used all your free queries for this month. Upgrade to Pro for more.`, sourceConvoId, true);
                 setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
                 updateMessageInConversation(sourceConvoId, modelMessageId, msg => ({...msg, text: ""}));
                return { success: false, reason: 'limit_reached' };
            }
        }
        
        await unifiedUsageService.incrementQueryCount('text', textQueries);
        await unifiedUsageService.incrementQueryCount('image', imageQueries);

        const controller = new AbortController();
        abortControllersRef.current[modelMessageId] = controller;
        
        const sourceConversation = conversationsRef.current[sourceConvoId];
        if (!sourceConversation) return { success: false, reason: 'conversation_not_found' };

        const history = sourceConversation.messages || [];
        const isProUser = unifiedUsageService.getTier() !== 'free';
        
        const onError = (error: string) => {
            setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
            updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: `Error: ${error}`}));
        };

        try {
            let metaNotes = '';
            // --- Context Injection for Companion AI ---
            if(sourceConversation.id !== EVERYTHING_ELSE_ID) {
                if (sourceConversation.insights?.story_so_far?.content) {
                    metaNotes += `[META_STORY_SO_FAR: ${sourceConversation.insights.story_so_far.content}]\n`;
                }
                if (sourceConversation.activeObjective) {
                    metaNotes += `[META_ACTIVE_OBJECTIVE: ${JSON.stringify(sourceConversation.activeObjective)}]\n`;
                }
                 if (sourceConversation.inventory?.length) {
                    metaNotes += `[META_INVENTORY: ${sourceConversation.inventory.join(', ')}]\n`;
                }
            }
            // --- End Context Injection ---

            const promptText = metaNotes + (text.trim() || "A player needs help. First, identify the game from this screenshot. Then, provide a spoiler-free hint and some interesting lore about what's happening in the image.");
            
            let rawTextResponse = "";
            let hasError = false;

            const onChunk = (chunk: string) => {
                if (isCooldownActive) setIsCooldownActive(false);
                rawTextResponse += chunk;
                const displayText = rawTextResponse.replace(tagCleanupRegex, '').replace(/^[\s`"\]\}]*/, '').trim();
                updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: displayText }));
            };

            const onStreamingError = (error: string) => {
                hasError = true;
                if (error === 'QUOTA_EXCEEDED') {
                    handleQuotaError(modelMessageId);
                } else {
                    updateMessageInConversation(activeConversationId, modelMessageId, msg => ({ ...msg, text: error }));
                    if (isHandsFreeMode) ttsService.speak(error).catch(() => {});
                }
                setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
            };

            if (isProUser) {
                const imageParts = images ? images.map(img => ({ base64: img.base64, mimeType: img.mimeType })) : null;
                rawTextResponse = await generateInitialProHint(promptText, imageParts, sourceConversation, history, onError, controller.signal) || "";
            } else {
                if (images && images.length > 0) {
                    const imageParts = images.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
                    await sendMessageWithImages(promptText, imageParts, sourceConversation, controller.signal, onChunk, onStreamingError, history);
                } else {
                    await sendTextToGemini(promptText, sourceConversation, controller.signal, onChunk, onStreamingError, history);
                }
            }
            
            if (controller.signal.aborted || hasError || !rawTextResponse) {
                if (!hasError) setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));
                return { success: false, reason: 'cancelled' };
            }
            
            console.log("Raw model response:", rawTextResponse);
            setLoadingMessages(prev => prev.filter(id => id !== modelMessageId));

            // --- TTS EXTRACTION ---
            // Extract hint for TTS *before* stripping any tags
            const hintMatch = rawTextResponse.match(/\[OTAKON_HINT_START\]([\s\S]*?)\[OTAKON_HINT_END\]/);

            // --- Step 1: Extract all data from the raw response before cleaning ---
            let identifiedGameName: string | null = null;
            let gameGenre: string | null = null;
            let gameProgress: number | null = null;
            let suggestions: string[] = [];
            let triumphPayload: ChatMessage['triumph'] | undefined;
            let parsedInventory: { items: string[] } | null = null;
            let insightUpdate: { id: string; content: string } | null = null;
            let insightModifyPending: PendingInsightModification | null = null;
            let insightDeleteRequest: { id: string } | null = null;
            let isGameUnreleased = false;
            let objectiveSet: { description: string } | null = null;
            let objectiveComplete = false;

            const gameIdMatch = rawTextResponse.match(/\[OTAKON_GAME_ID:\s*(.*?)\]/);
            if (gameIdMatch) identifiedGameName = gameIdMatch[1].trim();

            const genreMatch = rawTextResponse.match(/\[OTAKON_GENRE:\s*(.*?)\]/);
            if (genreMatch) gameGenre = genreMatch[1].trim();

            const confidenceMatch = rawTextResponse.match(/\[OTAKON_CONFIDENCE:\s*(high|low)\]/);
            if (confidenceMatch?.[1] === 'high' || (identifiedGameName && !images)) {
                const progressMatch = rawTextResponse.match(/\[OTAKON_GAME_PROGRESS:\s*(\d+)\]/);
                if (progressMatch) gameProgress = parseInt(progressMatch[1], 10);
            }

            if (rawTextResponse.includes('[OTAKON_GAME_IS_UNRELEASED: true]')) {
                isGameUnreleased = true;
            }

            const triumphMatch = rawTextResponse.match(/\[OTAKON_TRIUMPH:\s*({.*?})\]/s);
            if (triumphMatch?.[1]) try { triumphPayload = JSON.parse(triumphMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_TRIUMPH:', e, 'Raw:', triumphMatch[1]); }

            const inventoryMatch = rawTextResponse.match(/\[OTAKON_INVENTORY_ANALYSIS:\s*({.*?})\]/s);
            if (inventoryMatch?.[1]) try { parsedInventory = JSON.parse(inventoryMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_INVENTORY_ANALYSIS:', e, 'Raw:', inventoryMatch[1]); }

            const suggestionsMatch = rawTextResponse.match(/\[OTAKON_SUGGESTIONS:\s*(\[.*?\])\]/s);
            if (suggestionsMatch?.[1]) try { suggestions = JSON.parse(suggestionsMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_SUGGESTIONS:', e, 'Raw:', suggestionsMatch[1]); }

            const insightUpdateMatch = rawTextResponse.match(/\[OTAKON_INSIGHT_UPDATE:\s*({.*?})\]/s);
            if (insightUpdateMatch?.[1]) try { insightUpdate = JSON.parse(insightUpdateMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_INSIGHT_UPDATE:', e, 'Raw:', insightUpdateMatch[1]); }

            const insightModifyPendingMatch = rawTextResponse.match(/\[OTAKON_INSIGHT_MODIFY_PENDING:\s*({.*?})\]/s);
            if (insightModifyPendingMatch?.[1]) try { insightModifyPending = JSON.parse(insightModifyPendingMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_INSIGHT_MODIFY_PENDING:', e, 'Raw:', insightModifyPendingMatch[1]); }

            const insightDeleteRequestMatch = rawTextResponse.match(/\[OTAKON_INSIGHT_DELETE_REQUEST:\s*({.*?})\]/s);
            if (insightDeleteRequestMatch?.[1]) try { insightDeleteRequest = JSON.parse(insightDeleteRequestMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_INSIGHT_DELETE_REQUEST:', e, 'Raw:', insightDeleteRequestMatch[1]); }
            
            const objectiveSetMatch = rawTextResponse.match(/\[OTAKON_OBJECTIVE_SET:\s*({.*?})\]/s);
            if (objectiveSetMatch?.[1]) try { objectiveSet = JSON.parse(objectiveSetMatch[1]); } catch(e){ console.warn('Failed to parse OTAKON_OBJECTIVE_SET:', e, 'Raw:', objectiveSetMatch[1]); }

            if (rawTextResponse.includes('[OTAKON_OBJECTIVE_COMPLETE: true]')) {
                objectiveComplete = true;
            }

            // --- Step 2: Clean the text and update conversation state ---
            const hintTagsRegex = /\[OTAKON_HINT_START\]|\[OTAKON_HINT_END\]/g;
            let finalCleanedText = rawTextResponse
                .replace(hintTagsRegex, '') // Remove hint tags for display
                .replace(tagCleanupRegex, '')
                .replace(/^Game Progress: \d+%\s*$/m, '')
                .replace(/^[\s`"\]\}]*/, '')
                .replace(/[\s`"\]\}]*$/, '')
                .trim();
            
            let finalTargetConvoId = sourceConvoId;
            const identifiedGameId = identifiedGameName ? generateGameId(identifiedGameName) : null;
            
            if (identifiedGameId && (sourceConvoId === EVERYTHING_ELSE_ID || identifiedGameId !== sourceConvoId)) {
                console.log(`New game detected: "${identifiedGameName}". Creating/switching to new conversation tab.`);
                finalTargetConvoId = identifiedGameId;
            }
            
            setChatState(prev => {
                let newConversations = { ...prev.conversations };
                let newOrder = [...prev.order];
                let newActiveId = prev.activeId;
                const sourceConvo = newConversations[sourceConvoId];
                if (!sourceConvo) return prev;
            
                const finalModelMessage: ChatMessage = {
                    id: modelMessageId, role: 'model', text: finalCleanedText,
                    suggestions: suggestions.length > 0 ? suggestions : undefined,
                    triumph: triumphPayload,
                };
                
                const isNewConversation = finalTargetConvoId !== sourceConvoId;
                if (isNewConversation) {
                    const doesTargetExist = !!newConversations[finalTargetConvoId];
                    const targetConvo = newConversations[finalTargetConvoId] || { id: finalTargetConvoId, title: identifiedGameName!, messages: [], createdAt: Date.now() };
                    targetConvo.messages = [...targetConvo.messages, userMessage, finalModelMessage];
                    newConversations[finalTargetConvoId] = targetConvo;
                    sourceConvo.messages = sourceConvo.messages.filter(m => m.id !== userMessage.id && m.id !== modelMessageId);
                    
                    if (!doesTargetExist) {
                        const newOrderSet = new Set([EVERYTHING_ELSE_ID, finalTargetConvoId, ...prev.order]);
                        newOrder = Array.from(newOrderSet);
                    }
                    if (isChatActive(sourceConvoId)) {
                        renameChatSession(sourceConvoId, finalTargetConvoId);
                    }
                } else {
                    sourceConvo.messages = sourceConvo.messages.map(m => m.id === modelMessageId ? finalModelMessage : m);
                }
                
                const targetConvoForUpdate = newConversations[finalTargetConvoId];
                if (targetConvoForUpdate) {
                     if (isProUser && identifiedGameName && gameGenre && !targetConvoForUpdate.insights) {
                        const tabs = insightTabsConfig[gameGenre] || insightTabsConfig.default;
                        const insightsOrder = tabs.map(t => t.id);
                        const loadingInsights: Record<string, Insight> = {};
                        tabs.forEach(tab => {
                            loadingInsights[tab.id] = { id: tab.id, title: tab.title, content: 'Loading...', status: 'loading' };
                        });
                        targetConvoForUpdate.insights = loadingInsights;
                        targetConvoForUpdate.insightsOrder = insightsOrder;
                    }
                    if (gameProgress !== null) targetConvoForUpdate.progress = gameProgress;
                    if (parsedInventory?.items) targetConvoForUpdate.inventory = parsedInventory.items;
                    if (gameGenre) targetConvoForUpdate.genre = gameGenre;
                    if (insightUpdate && targetConvoForUpdate.insights?.[insightUpdate.id]) {
                        const oldContent = targetConvoForUpdate.insights[insightUpdate.id].content;
                        const separator = oldContent && oldContent !== 'Loading...' ? '\n\n' : '';
                        const newContent = (oldContent === 'Loading...' ? '' : oldContent) + separator + insightUpdate.content;
                        targetConvoForUpdate.insights[insightUpdate.id].content = newContent;
                        targetConvoForUpdate.insights[insightUpdate.id].status = 'loaded';
                        targetConvoForUpdate.insights[insightUpdate.id].isNew = true;
                    }
                    if(isGameUnreleased) targetConvoForUpdate.lastTrailerTimestamp = Date.now();
                     if (objectiveSet) {
                        targetConvoForUpdate.activeObjective = { description: objectiveSet.description, isCompleted: false };
                    }
                    if (objectiveComplete && targetConvoForUpdate.activeObjective) {
                        targetConvoForUpdate.activeObjective.isCompleted = true;
                    }
                    targetConvoForUpdate.lastInteractionTimestamp = Date.now();
                }

                newActiveId = finalTargetConvoId;
                newOrder = newOrder.sort(sortConversations(newConversations));

                return { conversations: newConversations, order: newOrder, activeId: newActiveId };
            });

            if (isHandsFreeMode) {
                // Use the extracted hint text. Fallback to the fully cleaned text if tags are missing.
                const textToSpeak = hintMatch ? hintMatch[1].trim() : finalCleanedText;
                if (textToSpeak) {
                    ttsService.speak(textToSpeak).catch(error => addSystemMessage(`Could not play audio hint: ${error.message}`));
                }
            }

            if (isProUser && identifiedGameName && gameGenre && gameProgress !== null && !isGameUnreleased) {
                 generateUnifiedInsights(identifiedGameName, gameGenre, gameProgress, text, onError, controller.signal)
                    .then(result => {
                        if (result?.insights) {
                            updateConversation(finalTargetConvoId, convo => {
                                const updatedInsights = { ...convo.insights! };
                                for(const key in result.insights){
                                    if(updatedInsights[key]){
                                        updatedInsights[key] = { ...updatedInsights[key], ...result.insights[key], status: 'loaded', isNew: true };
                                    }
                                }
                                return { ...convo, insights: updatedInsights };
                            });
                        }
                    });
            }

            if (insightModifyPending) setPendingModification(insightModifyPending);
            if (insightDeleteRequest) deleteInsight(finalTargetConvoId, insightDeleteRequest.id);

            return { success: true };

        } catch(e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            onError(message);
            return { success: false, reason: 'error' };
        } finally {
            delete abortControllersRef.current[modelMessageId];
        }
    }, [activeConversationId, isHandsFreeMode, addSystemMessage, handleQuotaError, updateConversation, updateMessageInConversation, deleteInsight]);
    
    const stopMessage = useCallback((messageId: string) => {
        ttsService.cancel();
        abortControllersRef.current[messageId]?.abort();
        delete abortControllersRef.current[messageId];
        setLoadingMessages(prev => prev.filter(id => id !== messageId));
        updateMessageInConversation(activeConversationId, messageId, msg => ({ ...msg, text: '*Request cancelled by user.*' }));
    }, [activeConversationId, updateMessageInConversation]);
    
    const resetConversations = useCallback(() => {
        ttsService.cancel();
        resetGeminiChat();
        localStorage.removeItem(CONVERSATIONS_STORAGE_KEY);
        setChatState({
            conversations: { [EVERYTHING_ELSE_ID]: { id: EVERYTHING_ELSE_ID, title: 'Everything else', messages: [], createdAt: Date.now() } },
            order: [EVERYTHING_ELSE_ID],
            activeId: EVERYTHING_ELSE_ID
        });
        setLoadingMessages([]);
        Object.values(abortControllersRef.current).forEach(c => c.abort());
        abortControllersRef.current = {};
    }, []);
    
    const switchConversation = useCallback((id: string) => {
        ttsService.cancel();
        if (conversations[id]) {
            setChatState(prev => ({...prev, activeId: id}));
        }
    }, [conversations]);
    
    const restoreHistory = useCallback((history: Conversations) => {
        if (!history || Object.keys(history).length === 0 || !history[EVERYTHING_ELSE_ID]) {
            resetConversations();
            return;
        }
        const newOrder = Object.keys(history).sort(sortConversations(history));
        setChatState({ conversations: history, order: newOrder, activeId: EVERYTHING_ELSE_ID });
    }, [resetConversations]);

    const fetchInsightContent = useCallback(async (conversationId: string, insightId: string) => {
        const conversation = conversations[conversationId];
        if (!conversation || !conversation.insights || !conversation.genre || typeof conversation.progress !== 'number') return;
    
        const insightTabConfig = (insightTabsConfig[conversation.genre] || insightTabsConfig.default).find(tab => tab.id === insightId);
        if (!insightTabConfig) return;
    
        updateConversation(conversationId, convo => ({
            ...convo,
            insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], status: 'streaming' } }
        }));
    
        const controller = new AbortController();
        // You might want to store this controller in a ref if you need to abort it from elsewhere
    
        try {
            if (insightTabConfig.webSearch) {
                // Use the non-streaming function for web search
                const fullContent = await generateInsightWithSearch(
                    conversation.title,
                    conversation.genre,
                    conversation.progress,
                    insightTabConfig.instruction,
                    insightTabConfig.title,
                    controller.signal
                );
                if (controller.signal.aborted) return;
                updateConversation(conversationId, convo => ({
                    ...convo,
                    insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: fullContent, status: 'loaded', isNew: true } }
                }));
            } else {
                // Use the streaming function for non-search insights
                let fullContent = '';
                await generateInsightStream(
                    conversation.title,
                    conversation.genre,
                    conversation.progress,
                    insightTabConfig.instruction,
                    insightTabConfig.title,
                    (chunk) => {
                        if (controller.signal.aborted) return;
                        fullContent += chunk;
                        updateConversation(conversationId, convo => ({
                            ...convo,
                            insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: fullContent, status: 'streaming' } }
                        }), true);
                    },
                    (error) => {
                        console.error(`Error streaming insight ${insightId}:`, error);
                        updateConversation(conversationId, convo => ({
                            ...convo,
                            insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: `Error: ${error}`, status: 'error' } }
                        }));
                    },
                    controller.signal
                );

                if (controller.signal.aborted) return;

                updateConversation(conversationId, convo => ({
                    ...convo,
                    insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], status: 'loaded', isNew: true } }
                }));
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log(`Fetch for insight ${insightId} was aborted.`);
            } else {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                console.error(`Error fetching content for insight ${insightId}:`, error);
                updateConversation(conversationId, convo => ({
                    ...convo,
                    insights: { ...convo.insights!, [insightId]: { ...convo.insights![insightId], content: `Error: ${errorMessage}`, status: 'error' } }
                }));
            }
        }
    }, [conversations, updateConversation]);

    return {
        conversations,
        conversationsOrder,
        reorderConversations,
        activeConversationId,
        activeConversation,
        loadingMessages,
        isCooldownActive,
        sendMessage,
        stopMessage,
        resetConversations,
        addSystemMessage,
        restoreHistory,
        switchConversation,
        fetchInsightContent,
        markInsightAsRead,
        saveConversationsToLocalStorage,
        pinConversation,
        deleteConversation,
        deleteInsight,
        reorderInsights,
        pendingModification,
        setPendingModification,
        overwriteInsight,
        createNewInsight,
        updateMessageFeedback,
        updateInsightFeedback,
    };
};
