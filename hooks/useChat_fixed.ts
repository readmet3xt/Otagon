    // Load conversations using atomic service - FIXED VERSION
    useEffect(() => {
        let isMounted = true;
        
        const loadConversations = async () => {
            try {
                console.log('🔧 [useChat] Starting conversation loading...');
                
                // Wait for auth service to be properly initialized
                let authState = authService.getCurrentState();
                let attempts = 0;
                const maxAttempts = 30; // Wait up to 3 seconds
                
                // If auth is still loading, wait for it to complete
                while (authState.loading && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    authState = authService.getCurrentState();
                    attempts++;
                }
                
                console.log('🔧 [useChat] Auth state after waiting:', {
                    loading: authState.loading,
                    hasUser: !!authState.user,
                    userId: authState.user?.id
                });

                // Handle developer mode
                const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';
                if (isDevMode) {
                    console.log('🔧 [useChat] Developer mode detected, loading from localStorage...');
                    try {
                        const devData = localStorage.getItem('otakon_dev_data');
                        if (devData) {
                            const parsedData = JSON.parse(devData);
                            if (parsedData.conversations && Object.keys(parsedData.conversations).length > 0) {
                                const conversations = parsedData.conversations;
                                const order = parsedData.conversationsOrder || Object.keys(conversations);
                                const activeId = parsedData.activeConversation || EVERYTHING_ELSE_ID;
                                
                                if (isMounted) {
                                    setChatState({
                                        conversations,
                                        order,
                                        activeId
                                    });
                                    console.log('✅ [useChat] Developer conversations loaded from localStorage');
                                }
                                return;
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to load developer conversations from localStorage:', error);
                    }
                }

                // For unauthenticated users, create default conversation
                if (!authState.user) {
                    console.log('🔐 [useChat] User not authenticated, creating default conversation');
                    if (!hasLoggedUnauthenticatedRef.current) {
                        console.log('🔐 User not authenticated, using default conversation');
                        hasLoggedUnauthenticatedRef.current = true;
                    }
                    return;
                }

                // For authenticated users, load conversations from database
                console.log('🔐 [useChat] User authenticated, loading conversations from database...');
                
                // Add delay to ensure auth state is fully ready
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    const result = await secureConversationService.loadConversations();

                    console.log('🔐 [useChat] Conversation loading result:', {
                        success: result.success,
                        hasConversations: !!result.conversations,
                        conversationCount: result.conversations ? Object.keys(result.conversations).length : 0,
                        error: result.error
                    });

                    if (!result.success) {
                        console.error('❌ [useChat] Conversation loading failed:', result.error);
                        return;
                    }

                    if (isMounted && result.success && result.conversations) {
                        const conversations = result.conversations as any;

                        console.log('🔧 [useChat] Processing loaded conversations:', {
                            conversationCount: Object.keys(conversations).length,
                            conversationIds: Object.keys(conversations)
                        });

                        // Convert database format to local format and sort
                        const processedConversations: Record<string, Conversation> = {};
                        const order: string[] = [];

                        Object.values(conversations).forEach((conv: any) => {
                            processedConversations[conv.id] = {
                                id: conv.id,
                                title: conv.title,
                                messages: conv.messages || [],
                                insights: conv.insights || {},
                                insightsOrder: Object.keys(conv.insights || {}),
                                context: conv.context || {},
                                gameId: conv.game_id,
                                isPinned: conv.is_pinned || false,
                                createdAt: conv.created_at ? new Date(conv.created_at).getTime() : Date.now(),
                                lastInteractionTimestamp: conv.lastInteractionTimestamp || conv.created_at ? new Date(conv.created_at).getTime() : Date.now(),
                                progress: conv.progress,
                                genre: conv.genre,
                                inventory: conv.inventory,
                                activeObjective: conv.activeObjective,
                                lastTrailerTimestamp: conv.lastTrailerTimestamp
                            };
                            order.push(conv.id);
                        });

                        // Sort conversations by creation date (newest first)
                        order.sort((a, b) => {
                            const aConv = processedConversations[a];
                            const bConv = processedConversations[b];
                            if (!aConv || !bConv) return 0;
                            
                            if (aConv.isPinned && !bConv.isPinned) return -1;
                            if (!aConv.isPinned && bConv.isPinned) return 1;
                            
                            const aTimestamp = aConv.lastInteractionTimestamp || aConv.createdAt;
                            const bTimestamp = bConv.lastInteractionTimestamp || bConv.createdAt;
                            return bTimestamp - aTimestamp;
                        });

                        // Determine active conversation ID
                        const currentActiveId = activeId || EVERYTHING_ELSE_ID;
                        const finalActiveId = processedConversations[currentActiveId] ? currentActiveId : EVERYTHING_ELSE_ID;

                        console.log('🔧 [useChat] Setting chat state with processed conversations:', {
                            conversationCount: Object.keys(processedConversations).length,
                            conversationIds: Object.keys(processedConversations),
                            order,
                            finalActiveId
                        });

                        setChatState({
                            conversations: processedConversations,
                            order,
                            activeId: finalActiveId
                        });
                        
                        console.log('✅ [useChat] Conversations loaded from Supabase:', Object.keys(processedConversations).length);
                    } else if (isMounted && result.success && (!result.conversations || Object.keys(result.conversations).length === 0)) {
                        // No conversations found in Supabase, create default with welcome message
                        console.log('🔧 [useChat] No conversations found in Supabase, creating default with welcome message...');

                        const welcomeMessage: ChatMessage = {
                            id: crypto.randomUUID(),
                            role: 'model' as const,
                            text: 'Welcome to Otagon! I\'m your AI gaming assistant, here to help you get unstuck in games with hints, not spoilers. Upload screenshots, ask questions, or connect your PC for instant help while playing!',
                            metadata: { type: 'welcome' }
                        };

                        const defaultConversations = {
                            [EVERYTHING_ELSE_ID]: {
                                id: EVERYTHING_ELSE_ID,
                                title: 'Everything else',
                                messages: [welcomeMessage],
                                insights: {},
                                insightsOrder: [],
                                context: {},
                                createdAt: Date.now(),
                                isPinned: false
                            }
                        };

                        setChatState({
                            conversations: defaultConversations,
                            order: [EVERYTHING_ELSE_ID],
                            activeId: EVERYTHING_ELSE_ID
                        });

                        sessionStorage.setItem('otakon_welcome_added_session', 'true');
                        console.log('✅ [useChat] Created default conversation with welcome message for authenticated user');
                    }
                } catch (error) {
                    console.error('❌ [useChat] Failed to load conversations:', error);
                }
            } catch (error) {
                console.error('❌ [useChat] Failed to load conversations:', error);
            } finally {
                if (isMounted) {
                    console.log('✅ [useChat] Conversation loading completed');
                }
            }
        };

        loadConversations();

        return () => {
            isMounted = false;
        };
    }, []);
