import React, { useState, useEffect } from 'react';
import { User, Conversation, Conversations, newsPrompts } from '../types';
import { ConversationService } from '../services/conversationService';
import { authService } from '../services/authService';
import { aiService } from '../services/aiService';
import { useActiveSession } from '../hooks/useActiveSession';
import { suggestedPromptsService } from '../services/suggestedPromptsService';
import { sessionSummaryService } from '../services/sessionSummaryService';
import { gameTabService } from '../services/gameTabService';
import { errorRecoveryService } from '../services/errorRecoveryService';
import { UserService } from '../services/userService';
import { SupabaseService } from '../services/supabaseService';
import { tabManagementService } from '../services/tabManagementService';
import Sidebar from './layout/Sidebar';
import ChatInterface from './features/ChatInterface';
import SettingsModal from './modals/SettingsModal';
import CreditModal from './modals/CreditModal';
import ConnectionModal from './modals/ConnectionModal';
import Logo from './ui/Logo';
import CreditIndicator from './ui/CreditIndicator';
import { LoadingSpinner } from './ui/LoadingSpinner';
import SettingsContextMenu from './ui/SettingsContextMenu';
import { ConnectionStatus } from '../types';
import HandsFreeModal from './modals/HandsFreeModal';
import HandsFreeToggle from './ui/HandsFreeToggle';
import { ttsService } from '../services/ttsService';

interface MainAppProps {
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenAbout?: () => void;
  onOpenPrivacy?: () => void;
  onOpenRefund?: () => void;
  onOpenContact?: () => void;
  onOpenTerms?: () => void;
  connectionStatus?: ConnectionStatus;
  connectionError?: string | null;
  onConnect?: (code: string) => void;
  onDisconnect?: () => void;
  onWebSocketMessage?: (data: any) => void;
}

const MainApp: React.FC<MainAppProps> = ({
  onLogout,
  onOpenSettings: _onOpenSettings,
  onOpenAbout: _onOpenAbout,
  onOpenPrivacy: _onOpenPrivacy,
  onOpenRefund: _onOpenRefund,
  onOpenContact: _onOpenContact,
  onOpenTerms: _onOpenTerms,
  connectionStatus: propConnectionStatus,
  connectionError: propConnectionError,
  onConnect: propOnConnect,
  onDisconnect: propOnDisconnect,
  onWebSocketMessage: propOnWebSocketMessage,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversations>({});
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Active session management
  const { session, toggleSession, setActiveSession } = useActiveSession();
  const [isManualUploadMode, setIsManualUploadMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<Date | null>(null);
  
  // Input preservation for tab switching
  const [currentInputMessage, setCurrentInputMessage] = useState<string>('');
  
  // Settings context menu state
  const [settingsContextMenu, setSettingsContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });
  
  // Handsfree mode state
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(false);
  const [handsFreeModalOpen, setHandsFreeModalOpen] = useState(false);
  
  // Use props for connection state (centralized in App.tsx)
  // No fallback to prevent state inconsistencies
  const connectionStatus = propConnectionStatus || ConnectionStatus.DISCONNECTED;
  const connectionError = propConnectionError || null;
  
  // Debug connection state
  console.log('🔍 [MainApp] Connection state (from props):', {
    connectionStatus,
    connectionError,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED
  });

  // Restore connection state from localStorage on mount
  useEffect(() => {
    const savedConnectionCode = localStorage.getItem('otakon_connection_code');
    if (savedConnectionCode) {
      setConnectionCode(savedConnectionCode);
      const lastConnection = localStorage.getItem('otakon_last_connection');
      if (lastConnection) {
        setLastSuccessfulConnection(new Date(lastConnection));
      }
    }
  }, []);

  // Initialize TTS service on mount
  useEffect(() => {
    ttsService.init().catch(err => {
      console.warn('Failed to initialize TTS service:', err);
    });
  }, []);

  // Handle WebSocket messages for screenshot processing
  const handleWebSocketMessage = (data: any) => {
    console.log('🔗 [MainApp] Received WebSocket message:', data);
    
    if (data.type === 'screenshot' && data.dataUrl) {
      console.log('📸 Processing screenshot in MainApp:', data);
      
      if (isManualUploadMode) {
        // In manual mode, queue the image for review instead of auto-sending
        console.log('📸 Manual mode: Screenshot queued for review');
        // TODO: Implement image queue for manual review
        // For now, we'll still send it but this is where the queue logic would go
      }
      
      // Send the screenshot to the active conversation
      if (activeConversation) {
        handleSendMessage("", data.dataUrl);
      } else {
        console.warn('📸 No active conversation to send screenshot to');
      }
    }
  };

  // Expose the message handler to parent
  useEffect(() => {
    if (propOnWebSocketMessage) {
      propOnWebSocketMessage(handleWebSocketMessage);
    }
  }, [propOnWebSocketMessage, activeConversation]);

  useEffect(() => {
    const loadData = async (retryCount = 0) => {
      try {
        // Get user from AuthService instead of UserService
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Also sync to UserService for compatibility
          UserService.setCurrentUser(currentUser);
        }

        console.log('🔍 [MainApp] Loading conversations (attempt', retryCount + 1, ')');
        let userConversations = await ConversationService.getConversations();
        console.log('🔍 [MainApp] Loaded conversations:', userConversations);
        
        // Migration: Fix "Everything else" conversation ID if needed
        const everythingElseConv = Object.values(userConversations).find(
          conv => conv.title === 'Everything else' && conv.id !== 'everything-else'
        );
        
        if (everythingElseConv) {
          console.log('🔍 [MainApp] Migrating "Everything else" conversation from ID', everythingElseConv.id, 'to everything-else');
          const migratedConv = { ...everythingElseConv, id: 'everything-else' };
          
          // Remove old conversation
          await ConversationService.deleteConversation(everythingElseConv.id);
          
          // Add with new ID
          await ConversationService.addConversation(migratedConv);
          
          // Reload conversations
          userConversations = await ConversationService.getConversations();
          console.log('🔍 [MainApp] Migration complete, reloaded conversations');
        }
        
        setConversations(userConversations);

        const active = await ConversationService.getActiveConversation();
        console.log('🔍 [MainApp] Active conversation:', active);
        setActiveConversation(active);

        // Auto-create a conversation if none exists
        if (!active && Object.keys(userConversations).length === 0) {
          console.log('🔍 [MainApp] No conversations found, creating new one...');
          
          // Check if there's already an "Everything else" conversation
          const existingEverythingElse = Object.values(userConversations).find(
            conv => conv.title === 'Everything else' || conv.id === 'everything-else'
          );
          
          if (existingEverythingElse) {
            // Use the existing "Everything else" conversation
            console.log('🔍 [MainApp] Using existing "Everything else" conversation with ID:', existingEverythingElse.id);
            await ConversationService.setActiveConversation(existingEverythingElse.id);
            setActiveConversation(existingEverythingElse);
          } else {
            // Create a new "Everything else" conversation with correct ID
            console.log('🔍 [MainApp] Creating new "Everything else" conversation with ID: everything-else');
            const newConversation = ConversationService.createConversation('Everything else', 'everything-else');
            await ConversationService.addConversation(newConversation);
            await ConversationService.setActiveConversation(newConversation.id);
            
            const updatedConversations = await ConversationService.getConversations();
            setConversations(updatedConversations);
            setActiveConversation(newConversation);
            console.log('🔍 [MainApp] New "Everything else" conversation created and set as active with ID:', newConversation.id);
          }
        } else if (active) {
          console.log('🔍 [MainApp] Found active conversation:', active.title, 'with ID:', active.id);
          
          // Set initial suggested prompts for the active conversation
          if (active.id === 'everything-else') {
            // For Everything Else tab, show news prompts if no messages
            if (!active.messages || active.messages.length === 0) {
              setSuggestedPrompts(newsPrompts);
            } else {
              const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(active.id);
              setSuggestedPrompts(fallbackPrompts);
            }
          } else {
            // For game tabs, show fallback prompts
            const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(active.id);
            setSuggestedPrompts(fallbackPrompts);
          }
        }
        
        // Mark initialization as complete
        setIsInitializing(false);
      } catch (error) {
        console.error('🔍 [MainApp] Error loading data:', error);
        
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`🔍 [MainApp] Retrying in ${delay}ms...`);
          setTimeout(() => loadData(retryCount + 1), delay);
        } else {
          console.error('🔍 [MainApp] Failed to load data after 3 attempts');
          // Set a fallback state to prevent infinite loading
          setActiveConversation(null);
          setIsInitializing(false);
        }
      }
    };

    loadData();
  }, []);

  // Poll for conversation updates when subtabs are loading (optimized)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isActive = true;
    
    const pollForSubtabUpdates = async () => {
      if (!isActive) return;
      
      // Check if any conversation has loading subtabs
      const hasLoadingSubtabs = Object.values(conversations).some(conv => 
        conv.subtabs?.some(tab => tab.status === 'loading')
      );

      if (hasLoadingSubtabs) {
        console.log('🔄 [MainApp] Polling for subtab updates...');
        try {
          const updatedConversations = await ConversationService.getConversations();
          
          if (!isActive) return; // Component unmounted, don't update state
          
          // Force new object reference to trigger React re-render
          const freshConversations = { ...updatedConversations };
          setConversations(freshConversations);
          
          // Update active conversation if it changed
          if (activeConversation && updatedConversations[activeConversation.id]) {
            setActiveConversation(updatedConversations[activeConversation.id]);
          }
        } catch (error) {
          console.error('🔄 [MainApp] Error polling for subtab updates:', error);
        }
      } else if (intervalId) {
        // No more loading subtabs, stop polling
        console.log('🔄 [MainApp] All subtabs loaded, stopping poll');
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Only start polling if there are loading subtabs
    const hasLoadingSubtabs = Object.values(conversations).some(conv => 
      conv.subtabs?.some(tab => tab.status === 'loading')
    );
    
    if (hasLoadingSubtabs && !intervalId) {
      console.log('🔄 [MainApp] Starting subtab poll (5s interval)');
      // Increased to 5 seconds to reduce load, run immediately then poll
      pollForSubtabUpdates();
      intervalId = setInterval(pollForSubtabUpdates, 5000);
    }
    
    // Cleanup on unmount
    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [conversations, activeConversation]);

  // Function to refresh user data (for credit updates)
  const refreshUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        UserService.setCurrentUser(currentUser);
        console.log('📊 [MainApp] User data refreshed for credit update');
      }
    } catch (error) {
      console.warn('Failed to refresh user data:', error);
    }
  };

  // WebSocket connection is fully managed by App.tsx
  // No local WebSocket management to prevent state duplication
  useEffect(() => {
    console.log('🔌 [MainApp] Using centralized WebSocket from App.tsx');
    // All connection logic is handled in App.tsx and passed via props
    // This component only receives and displays the connection state
  }, []);


  const handleConversationSelect = async (id: string) => {
    await ConversationService.setActiveConversation(id);
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
    setActiveConversation(updatedConversations[id]);
    setSidebarOpen(false);

    // Set initial suggested prompts for Everything Else tab
    if (id === 'everything-else') {
      const conversation = updatedConversations[id];
      // If no messages yet, show news prompts (they will be displayed by SuggestedPrompts component)
      if (!conversation.messages || conversation.messages.length === 0) {
        // SuggestedPrompts component will handle showing newsPrompts for everything-else
        // We just need to ensure prompts array is not empty
        setSuggestedPrompts(newsPrompts);
      } else {
        // If there are messages, show contextual fallback prompts
        const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(id);
        setSuggestedPrompts(fallbackPrompts);
      }
    } else {
      // For game tabs, set appropriate fallback prompts
      const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(id);
      setSuggestedPrompts(fallbackPrompts);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const wasActive = activeConversation?.id === id;
    
    // Delete the conversation
    await ConversationService.deleteConversation(id);
    
    // Get fresh conversations from service
    const updatedConversations = await ConversationService.getConversations();
    
    // Force a new object reference to ensure React detects the change
    const freshConversations = { ...updatedConversations };
    
    // Update conversations state immediately
    setConversations(freshConversations);
    
    if (wasActive) {
      // If we're deleting the current active conversation, switch to "Everything Else" tab
      const everythingElseTab = freshConversations['everything-else'];
      if (everythingElseTab) {
        // Persist the active conversation change
        await ConversationService.setActiveConversation('everything-else');
        setActiveConversation(everythingElseTab);
        // Also clear any active session since we're switching away from a game tab
        setActiveSession('', false);
      } else {
        // Fallback to first available conversation
        const firstConversation = Object.values(freshConversations)[0] || null;
        if (firstConversation) {
          await ConversationService.setActiveConversation(firstConversation.id);
          setActiveConversation(firstConversation);
        } else {
          setActiveConversation(null);
        }
      }
      // Close sidebar on mobile after switching
      setSidebarOpen(false);
    }
  };

  const handlePinConversation = async (id: string) => {
    // Check if we can pin (max 3 pinned conversations)
    const pinnedCount = Object.values(conversations).filter((conv: Conversation) => conv.isPinned).length;
    if (pinnedCount >= 3) {
      alert('You can only pin up to 3 conversations. Please unpin another conversation first.');
      return;
    }

    await ConversationService.updateConversation(id, { 
      isPinned: true, 
      pinnedAt: Date.now() 
    });
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
  };

  const handleUnpinConversation = async (id: string) => {
    await ConversationService.updateConversation(id, { 
      isPinned: false, 
      pinnedAt: undefined 
    });
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
  };

  const handleClearConversation = async (id: string) => {
    await ConversationService.clearConversation(id);
    const updatedConversations = await ConversationService.getConversations();
    setConversations(updatedConversations);
    
    // If this was the active conversation, update it
    if (activeConversation?.id === id) {
      setActiveConversation(updatedConversations[id]);
    }
  };



  const handleCreditModalOpen = () => {
    setCreditModalOpen(true);
  };

  const handleCreditModalClose = () => {
    setCreditModalOpen(false);
  };

  const handleUpgrade = () => {
    // TODO: Implement upgrade functionality
    console.log('Upgrade clicked');
  };

  const handleConnectionModalOpen = () => {
    setConnectionModalOpen(true);
  };

  const handleConnectionModalClose = () => {
    setConnectionModalOpen(false);
  };

  const handleHandsFreeToggle = () => {
    const newHandsFreeMode = !isHandsFreeMode;
    setIsHandsFreeMode(newHandsFreeMode);
    // Open modal when enabling hands-free mode for configuration
    if (newHandsFreeMode) {
      setHandsFreeModalOpen(true);
    }
  };

  const handleHandsFreeModalClose = () => {
    setHandsFreeModalOpen(false);
  };

  const handleToggleHandsFreeFromModal = () => {
    setIsHandsFreeMode(!isHandsFreeMode);
  };

  // Settings context menu handlers
  const handleSettingsContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSettingsContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const closeSettingsContextMenu = () => {
    setSettingsContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
    });
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleLogout = () => {
    onLogout();
  };

  const handleConnect = (code: string) => {
    setConnectionCode(code);
    
    // Store connection code for persistence
    localStorage.setItem('otakon_connection_code', code);
    localStorage.setItem('otakon_last_connection', new Date().toISOString());
    
    // Always use the centralized handler from App.tsx
    if (propOnConnect) {
      propOnConnect(code);
    } else {
      console.warn('🔌 [MainApp] No connection handler provided from App.tsx');
    }
  };

  const handleDisconnect = () => {
    // Always use the centralized handler from App.tsx
    if (propOnDisconnect) {
      propOnDisconnect();
    } else {
      console.warn('🔌 [MainApp] No disconnect handler provided from App.tsx');
    }
    
    // Clear local connection state
    setConnectionCode(null);
    setLastSuccessfulConnection(null);
    localStorage.removeItem('otakon_connection_code');
    localStorage.removeItem('otakon_last_connection');
  };

  // Handle suggested prompt clicks
  const handleSuggestedPromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // Handle input message change
  const handleInputMessageChange = (message: string) => {
    setCurrentInputMessage(message);
  };

  // Helper function to extract the most relevant game help content for hands-free mode
  const extractGameHelpFromResponse = (response: string, userQuery: string): string => {
    // First, try to find the most relevant section based on the user's query
    const queryLower = userQuery.toLowerCase();
    
    // Look for direct answers to common game help queries
    if (queryLower.includes('how') || queryLower.includes('what') || queryLower.includes('where') || queryLower.includes('why')) {
      // Try to find the first complete sentence that seems to answer the question
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        if (sentenceLower.includes('you can') || sentenceLower.includes('try') || sentenceLower.includes('look for') || 
            sentenceLower.includes('check') || sentenceLower.includes('find') || sentenceLower.includes('go to')) {
          return sentence.trim() + '.';
        }
      }
    }
    
    // Look for hint-like content
    const hintPatterns = [
      /(?:hint|tip|suggestion|advice)[:\s]*([^.!?]+[.!?])/i,
      /(?:you should|try to|look for|check|find|go to)[^.!?]*[.!?]/i,
      /(?:the key is|the solution is|you need to)[^.!?]*[.!?]/i
    ];
    
    for (const pattern of hintPatterns) {
      const match = response.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    
    // Fallback: return the first meaningful paragraph (first 2-3 sentences)
    const paragraphs = response.split('\n\n').filter(p => p.trim().length > 20);
    if (paragraphs.length > 0) {
      const firstParagraph = paragraphs[0];
      if (firstParagraph) {
        const sentences = firstParagraph.split(/[.!?]+/).filter(s => s.trim().length > 10);
        if (sentences.length >= 2) {
          return sentences.slice(0, 2).join('. ').trim() + '.';
        } else if (sentences.length === 1) {
          return sentences[0]?.trim() + '.';
        }
      }
    }
    
    // Last resort: return the first 200 characters of the response
    return response.substring(0, 200).trim() + (response.length > 200 ? '...' : '');
  };

  // Handle active session toggle with session summaries
  const handleToggleActiveSession = async () => {
    if (!activeConversation) return;

    const wasPlaying = session.isActive && session.currentGameId === activeConversation.id;
    const willBePlaying = !wasPlaying;

    // Create summary of current session before switching
    if (wasPlaying) {
      // Switching from Playing to Planning - create playing session summary
      console.log('📝 [MainApp] Creating Playing session summary for Planning mode');
      try {
        const playingSummary = await sessionSummaryService.generatePlayingSessionSummary(activeConversation);
        await sessionSummaryService.storeSessionSummary(activeConversation.id, playingSummary);
        
        // Add summary message to conversation
        const summaryMessage = {
          id: `msg_${Date.now()}`,
          content: `**Session Summary - Switching to Planning Mode**\n\n${playingSummary.summary}`,
          role: 'assistant' as const,
          timestamp: Date.now(),
        };
        
        setConversations(prev => {
          const updated = { ...prev };
          if (updated[activeConversation.id]) {
            updated[activeConversation.id] = {
              ...updated[activeConversation.id],
              messages: [...updated[activeConversation.id].messages, summaryMessage],
              updatedAt: Date.now()
            };
          }
          return updated;
        });
        
        await ConversationService.addMessage(activeConversation.id, summaryMessage);
      } catch (error) {
        console.error('Failed to create playing session summary:', error);
      }
    } else if (willBePlaying) {
      // Switching from Planning to Playing - create planning session summary
      console.log('📝 [MainApp] Creating Planning session summary for Playing mode');
      try {
        const planningSummary = await sessionSummaryService.generatePlanningSessionSummary(activeConversation);
        await sessionSummaryService.storeSessionSummary(activeConversation.id, planningSummary);
        
        // Add summary message to conversation
        const summaryMessage = {
          id: `msg_${Date.now()}`,
          content: `**Session Summary - Switching to Playing Mode**\n\n${planningSummary.summary}`,
          role: 'assistant' as const,
          timestamp: Date.now(),
        };
        
        setConversations(prev => {
          const updated = { ...prev };
          if (updated[activeConversation.id]) {
            updated[activeConversation.id] = {
              ...updated[activeConversation.id],
              messages: [...updated[activeConversation.id].messages, summaryMessage],
              updatedAt: Date.now()
            };
          }
          return updated;
        });
        
        await ConversationService.addMessage(activeConversation.id, summaryMessage);
      } catch (error) {
        console.error('Failed to create planning session summary:', error);
      }
    }

    // Toggle the session
    toggleSession(activeConversation.id);
  };

  // Handle stop AI request
  const handleStopAI = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setSuggestedPrompts([]);
    }
  };

  // Poll for subtab updates when background insights are being generated
  const pollForSubtabUpdates = async (conversationId: string, attempts = 0, maxAttempts = 30) => {
    // Stop after 30 attempts (30 seconds)
    if (attempts >= maxAttempts) {
      console.log('🎮 [MainApp] ⏱️ Stopped polling for subtab updates after', attempts, 'attempts');
      return;
    }

    // Wait 1 second before checking
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const updatedConversations = await ConversationService.getConversations();
      const targetConv = updatedConversations[conversationId];

      if (targetConv) {
        const stillLoading = targetConv.subtabs?.some(tab => tab.status === 'loading');
        
        if (!stillLoading) {
          // Subtabs have finished loading!
          console.log('🎮 [MainApp] ✅ Background subtabs loaded successfully');
          setConversations(updatedConversations);
          if (activeConversation?.id === conversationId) {
            setActiveConversation(targetConv);
          }
          return;
        }

        // Still loading, continue polling
        console.log('🎮 [MainApp] 🔄 Subtabs still loading, polling again... (attempt', attempts + 1, ')');
        pollForSubtabUpdates(conversationId, attempts + 1, maxAttempts);
      }
    } catch (error) {
      console.error('Error polling for subtab updates:', error);
    }
  };

  // Placeholder for game tab creation - will be implemented in Week 3
  const handleCreateGameTab = async (gameInfo: { gameTitle: string; genre?: string; aiResponse?: any }): Promise<Conversation | null> => {
    console.log('🎮 [MainApp] Game tab creation requested:', gameInfo);
    
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        console.error('User not authenticated for game tab creation');
        return null;
      }

      // Generate unique conversation ID based on game title (without timestamp for consistency)
      const sanitizedTitle = gameInfo.gameTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      const conversationId = `game-${sanitizedTitle}`;
      
      // Check if game tab already exists
      const existingConversation = conversations[conversationId];
      if (existingConversation) {
        console.log('🎮 [MainApp] Game tab already exists, returning it');
        return existingConversation;
      }

      // Create new game tab with AI response data
      const newGameTab = await gameTabService.createGameTab({
        gameTitle: gameInfo.gameTitle,
        genre: gameInfo.genre || 'Action RPG',
        conversationId,
        userId: user.id,
        aiResponse: gameInfo.aiResponse // Pass AI response for subtab population
      });

      // Add to conversations state
      setConversations(prev => ({
        ...prev,
        [conversationId]: newGameTab
      }));

      console.log('🎮 [MainApp] Game tab created successfully:', newGameTab.title);
      return newGameTab;
    } catch (error) {
      console.error('Failed to create game tab:', error);
      return null;
    }
  };

  const handleSendMessage = async (message: string, imageUrl?: string) => {
    if (!activeConversation || isLoading) return;

    console.log('📸 [MainApp] Sending message with image:', { message, hasImage: !!imageUrl, imageUrl: imageUrl?.substring(0, 50) + '...' });

    // Auto-switch to Playing mode for game help requests
    const isGameHelpRequest = imageUrl || 
      (message && (
        message.toLowerCase().includes('help') ||
        message.toLowerCase().includes('how to') ||
        message.toLowerCase().includes('what should') ||
        message.toLowerCase().includes('stuck') ||
        message.toLowerCase().includes('tutorial') ||
        message.toLowerCase().includes('guide')
      ));

    if (isGameHelpRequest && activeConversation.id !== 'everything-else') {
      // Switch to Playing mode if not already active
      if (!session.isActive || session.currentGameId !== activeConversation.id) {
        console.log('🎮 [MainApp] Auto-switching to Playing mode for game help request');
        setActiveSession(activeConversation.id, true);
      }
    }

    const newMessage = {
      id: `msg_${Date.now()}`,
      content: message,
      role: 'user' as const,
      timestamp: Date.now(),
      imageUrl,
    };

    // Optimized: Update state immediately without re-fetching
    setConversations(prev => {
      const updated = { ...prev };
      if (updated[activeConversation.id]) {
        updated[activeConversation.id] = {
          ...updated[activeConversation.id],
          messages: [...updated[activeConversation.id].messages, newMessage],
          updatedAt: Date.now()
        };
      }
      return updated;
    });

    // Add message to service - MUST await to ensure it's saved before potential migration
    await ConversationService.addMessage(activeConversation.id, newMessage);

    // Clear the input message after sending
    setCurrentInputMessage('');

    // Check if message contains a tab command (for Command Centre)
    if (tabManagementService.hasTabCommand(message)) {
      const command = tabManagementService.parseTabCommand(message, activeConversation);
      if (command) {
        console.log('📝 [MainApp] Tab command detected:', command);
        console.log('📝 [MainApp] Command description:', tabManagementService.describeCommand(command));
      }
    }

    // Track credit usage based on query type
    const hasImage = !!imageUrl;
    
    // Determine query type: image+text or image-only = image query, text-only = text query
    const queryType = hasImage ? 'image' : 'text';
    
    // Check if user can make the request
    if (!UserService.canMakeRequest(queryType)) {
      const errorMessage = {
        id: `msg_${Date.now() + 1}`,
        content: `You've reached your ${queryType} query limit for this month. Upgrade to Pro for more queries.`,
        role: 'assistant' as const,
        timestamp: Date.now(),
      };
      
      // Add error message to conversation
      setConversations(prev => {
        const updated = { ...prev };
        if (updated[activeConversation.id]) {
          updated[activeConversation.id] = {
            ...updated[activeConversation.id],
            messages: [...updated[activeConversation.id].messages, errorMessage],
            updatedAt: Date.now()
          };
        }
        return updated;
      });
      
      // Save error message (non-blocking)
      ConversationService.addMessage(activeConversation.id, errorMessage)
        .catch(error => console.error('Failed to save error message:', error));
      return;
    }

    // Increment usage count
    UserService.incrementUsage(queryType);
    
    // Update in Supabase (non-blocking - fire and forget)
    if (user?.authUserId) {
      const supabaseService = new SupabaseService();
      const updateUsageAsync = async () => {
        try {
          await supabaseService.incrementUsage(user.authUserId, queryType);
          console.log(`📊 [MainApp] Credit usage updated: ${queryType} query`);
          // Refresh user data in background to update credit indicator
          await refreshUserData();
        } catch (error) {
          console.warn('Failed to update usage in Supabase:', error);
          // Silently fail - user can still continue using the app
        }
      };
      
      updateUsageAsync();
    }

    // Clear previous suggestions and start loading
    setSuggestedPrompts([]);
    setIsLoading(true);
    
    // Create abort controller for stop functionality
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const response = await aiService.getChatResponseWithStructure(
        activeConversation,
        user,
        message,
        session.isActive && session.currentGameId === activeConversation.id,
        !!imageUrl,
        imageUrl,
        controller.signal
      );

      // Check if request was aborted before adding response to conversation
      if (controller.signal.aborted) {
        console.log('AI request was aborted, skipping response');
        return;
      }

      const aiMessage = {
        id: `msg_${Date.now() + 1}`,
        content: response.content,
        role: 'assistant' as const,
        timestamp: Date.now(),
      };

      // Optimized: Update state immediately
      setConversations(prev => {
        const updated = { ...prev };
        if (updated[activeConversation.id]) {
          updated[activeConversation.id] = {
            ...updated[activeConversation.id],
            messages: [...updated[activeConversation.id].messages, aiMessage],
            updatedAt: Date.now()
          };
        }
        return updated;
      });

      // Add message to service - MUST await to ensure it's saved before potential migration
      await ConversationService.addMessage(activeConversation.id, aiMessage);

      // Handle hands-free TTS reading
      if (isHandsFreeMode) {
        console.log('🎤 [MainApp] Hands-free mode enabled, extracting content to speak');
        
        // Try to extract game help/hint section from response
        let textToSpeak = '';
        
        // Look for explicit Hint: section
        const hintMatch = response.content.match(/(?:^|\n)Hint:\s*(.+?)(?:\n\n|$)/s);
        
        if (hintMatch?.[1]) {
          // Use the explicitly marked game help section
          textToSpeak = hintMatch[1].trim();
          console.log('🎤 [MainApp] Using explicit Hint section for TTS');
        } else {
          // Fallback: Extract the most relevant part of the response
          textToSpeak = extractGameHelpFromResponse(response.content, message);
          console.log('🎤 [MainApp] Using extracted game help for TTS');
        }
        
        if (textToSpeak) {
          console.log('🎤 [MainApp] Speaking:', textToSpeak.substring(0, 100) + '...');
          ttsService.speak(textToSpeak).catch(error => {
            console.error('🎤 [MainApp] TTS error:', error);
          });
        }
      }

      // Process suggested prompts (prefer followUpPrompts from enhanced response)
      console.log('🔍 [MainApp] Raw suggestions from AI:', response.suggestions);
      const suggestionsToUse = response.followUpPrompts || response.suggestions;
      const processedSuggestions = suggestedPromptsService.processAISuggestions(suggestionsToUse);
      console.log('🔍 [MainApp] Processed suggestions:', processedSuggestions);
      
      if (processedSuggestions.length > 0) {
        setSuggestedPrompts(processedSuggestions);
      } else {
        // Use fallback suggestions if AI doesn't provide any
        const fallbackSuggestions = suggestedPromptsService.getFallbackSuggestions(activeConversation.id);
        console.log('🔍 [MainApp] Using fallback suggestions:', fallbackSuggestions);
        setSuggestedPrompts(fallbackSuggestions);
      }

      // Handle progressive insight updates (if AI provided updates to existing subtabs)
      if (response.progressiveInsightUpdates && response.progressiveInsightUpdates.length > 0) {
        console.log('📝 [MainApp] AI provided progressive insight updates:', response.progressiveInsightUpdates.length);
        
        // Update subtabs in background (non-blocking)
        gameTabService.updateSubTabsFromAIResponse(
          activeConversation.id,
          response.progressiveInsightUpdates
        ).then(() => {
          console.log('📝 [MainApp] Subtabs updated successfully');
          
          // Refresh conversations to show updated subtabs
          ConversationService.getConversations().then(updatedConversations => {
            setConversations(updatedConversations);
            
            // Update active conversation to reflect changes
            const refreshedConversation = updatedConversations[activeConversation.id];
            if (refreshedConversation) {
              setActiveConversation(refreshedConversation);
            }
          });
        }).catch(error => {
          console.error('📝 [MainApp] Failed to update subtabs:', error);
        });
      }

      // Handle tab management commands (Command Centre)
      if (response.otakonTags.has('OTAKON_INSIGHT_UPDATE') || 
          response.otakonTags.has('OTAKON_INSIGHT_MODIFY_PENDING') || 
          response.otakonTags.has('OTAKON_INSIGHT_DELETE_REQUEST')) {
        
        console.log('📝 [MainApp] Processing tab management commands from AI');

        // Handle INSIGHT_UPDATE (update content of existing tab)
        if (response.otakonTags.has('OTAKON_INSIGHT_UPDATE')) {
          const updateData = response.otakonTags.get('OTAKON_INSIGHT_UPDATE');
          console.log('📝 [MainApp] INSIGHT_UPDATE:', updateData);
          
          if (typeof updateData === 'string') {
            try {
              const parsed = JSON.parse(updateData);
              if (parsed.id && parsed.content) {
                gameTabService.updateSubTabsFromAIResponse(
                  activeConversation.id,
                  [{ tabId: parsed.id, title: '', content: parsed.content }]
                ).then(() => {
                  console.log('📝 [MainApp] Tab updated via command:', parsed.id);
                  // Refresh UI
                  ConversationService.getConversations().then(updatedConversations => {
                    setConversations(updatedConversations);
                    const refreshedConversation = updatedConversations[activeConversation.id];
                    if (refreshedConversation) setActiveConversation(refreshedConversation);
                  });
                }).catch(error => console.error('Failed to update tab:', error));
              }
            } catch (error) {
              console.error('Failed to parse INSIGHT_UPDATE:', error);
            }
          }
        }

        // Handle INSIGHT_MODIFY_PENDING (modify/rename tab)
        if (response.otakonTags.has('OTAKON_INSIGHT_MODIFY_PENDING')) {
          const modifyData = response.otakonTags.get('OTAKON_INSIGHT_MODIFY_PENDING');
          console.log('📝 [MainApp] INSIGHT_MODIFY_PENDING:', modifyData);
          
          if (typeof modifyData === 'string') {
            try {
              const parsed = JSON.parse(modifyData);
              if (parsed.id && (parsed.title || parsed.content)) {
                gameTabService.updateSubTabsFromAIResponse(
                  activeConversation.id,
                  [{ tabId: parsed.id, title: parsed.title || '', content: parsed.content || '' }]
                ).then(() => {
                  console.log('📝 [MainApp] Tab modified via command:', parsed.id);
                  // Refresh UI
                  ConversationService.getConversations().then(updatedConversations => {
                    setConversations(updatedConversations);
                    const refreshedConversation = updatedConversations[activeConversation.id];
                    if (refreshedConversation) setActiveConversation(refreshedConversation);
                  });
                }).catch(error => console.error('Failed to modify tab:', error));
              }
            } catch (error) {
              console.error('Failed to parse INSIGHT_MODIFY_PENDING:', error);
            }
          }
        }

        // Handle INSIGHT_DELETE_REQUEST (delete tab)
        if (response.otakonTags.has('OTAKON_INSIGHT_DELETE_REQUEST')) {
          const deleteData = response.otakonTags.get('OTAKON_INSIGHT_DELETE_REQUEST');
          console.log('📝 [MainApp] INSIGHT_DELETE_REQUEST:', deleteData);
          
          if (typeof deleteData === 'string') {
            try {
              const parsed = JSON.parse(deleteData);
              if (parsed.id) {
                // Remove the subtab from conversation
                const updatedSubtabs = activeConversation.subtabs?.filter(tab => tab.id !== parsed.id) || [];
                ConversationService.updateConversation(activeConversation.id, {
                  subtabs: updatedSubtabs
                }).then(() => {
                  console.log('📝 [MainApp] Tab deleted via command:', parsed.id);
                  // Refresh UI
                  ConversationService.getConversations().then(updatedConversations => {
                    setConversations(updatedConversations);
                    const refreshedConversation = updatedConversations[activeConversation.id];
                    if (refreshedConversation) setActiveConversation(refreshedConversation);
                  });
                }).catch(error => console.error('Failed to delete tab:', error));
              }
            } catch (error) {
              console.error('Failed to parse INSIGHT_DELETE_REQUEST:', error);
            }
          }
        }
      }

      // Handle game tab creation if game is identified
      if (response.otakonTags.has('GAME_ID')) {
        const gameTitle = response.otakonTags.get('GAME_ID');
        const confidence = response.otakonTags.get('CONFIDENCE');
        const isUnreleased = response.otakonTags.get('GAME_STATUS') === 'unreleased';
        const genre = response.otakonTags.get('GENRE') || 'Default';

        console.log('🎮 [MainApp] Game detection:', { 
          gameTitle, 
          confidence, 
          isUnreleased, 
          genre,
          currentTab: activeConversation.id,
          messageIds: { user: newMessage.id, ai: aiMessage.id }
        });

        // Only create game tab if:
        // 1. Confidence is high
        // 2. Game is released (not unreleased)
        // Note: Any game screen (menu, gameplay, etc.) means they own the game, so we create a tab
        const shouldCreateTab = 
          confidence === 'high' && 
          !isUnreleased;

        if (shouldCreateTab) {
          // Check if game tab already exists
          const existingGameTab = Object.values(conversations).find(
            conv => conv.gameTitle?.toLowerCase() === gameTitle.toLowerCase()
          );

          let targetConversationId: string;
          
          if (existingGameTab) {
            console.log('🎮 [MainApp] Found existing game tab:', existingGameTab.title);
            targetConversationId = existingGameTab.id;
          } else {
            console.log('🎮 [MainApp] Creating new game tab for:', gameTitle);
            const gameInfo = { gameTitle, genre, aiResponse: response };
            const newGameTab = await handleCreateGameTab(gameInfo);
            targetConversationId = newGameTab?.id || '';
          }

          // Move the user message and AI response to the game tab if we're currently in "Everything Else"
          const shouldMigrateMessages = targetConversationId && activeConversation.id === 'everything-else';
          console.log('🎮 [MainApp] Should migrate messages?', shouldMigrateMessages, {
            hasTargetConversation: !!targetConversationId,
            currentConversationId: activeConversation.id,
            isEverythingElse: activeConversation.id === 'everything-else'
          });
          
          if (shouldMigrateMessages) {
            console.log('🎮 [MainApp] ✅ Starting message migration from Everything Else to game tab');
            console.log('🎮 [MainApp] Message IDs to move:', { userMsgId: newMessage.id, aiMsgId: aiMessage.id });
            
            // Get the messages to move
            const messagesToMove = [newMessage, aiMessage];
            
            // Transaction-like behavior: save state for rollback
            const rollbackState = {
              targetConversationId,
              messagesToMove,
              originalEverythingElse: await ConversationService.getConversation('everything-else')
            };
            
            try {
              // Step 1: Add messages to game tab
              console.log('🎮 [MainApp] Adding messages to game tab:', targetConversationId);
              for (const msg of messagesToMove) {
                const result = await ConversationService.addMessage(targetConversationId, msg);
                if (!result.success) {
                  throw new Error(`Failed to add message to game tab: ${result.reason}`);
                }
              }
              console.log('🎮 [MainApp] ✅ Messages added to game tab');
              
              // Step 2: Get fresh conversation data
              const currentConversations = await ConversationService.getConversations();
              const everythingElseConv = currentConversations['everything-else'];
              
              if (everythingElseConv) {
                console.log('🎮 [MainApp] Everything Else has', everythingElseConv.messages.length, 'messages before removal');
                
                // Remove the messages we just moved
                const updatedMessages = everythingElseConv.messages.filter(
                  msg => msg.id !== newMessage.id && msg.id !== aiMessage.id
                );
                
                console.log('🎮 [MainApp] Everything Else will have', updatedMessages.length, 'messages after removal');
                
                await ConversationService.updateConversation('everything-else', {
                  messages: updatedMessages,
                  updatedAt: Date.now()
                });
                console.log('🎮 [MainApp] ✅ Messages removed from Everything Else');
              }
              
              // Step 3: Update state with fresh data
              const updatedConversations = await ConversationService.getConversations();
              setConversations(updatedConversations);
              
              // Step 4: Switch to the game tab
              const gameTab = updatedConversations[targetConversationId];
              if (gameTab) {
                console.log('🎮 [MainApp] ✅ Switching to game tab:', gameTab.title, 'with', gameTab.messages.length, 'messages');
                await ConversationService.setActiveConversation(targetConversationId);
                setActiveConversation(gameTab);
                // Auto-switch to Playing mode for new/existing game tabs
                setActiveSession(targetConversationId, true);
                // Close sidebar on mobile
                setSidebarOpen(false);
                
                // Poll for subtab updates if they're still loading
                const hasLoadingSubtabs = gameTab.subtabs?.some(tab => tab.status === 'loading');
                if (hasLoadingSubtabs) {
                  console.log('🎮 [MainApp] 🔄 Starting background refresh for loading subtabs');
                  pollForSubtabUpdates(targetConversationId);
                }
              }
            } catch (migrationError) {
              console.error('🎮 [MainApp] ❌ Message migration failed, attempting rollback:', migrationError);
              
              // Rollback: restore original state
              try {
                if (rollbackState.originalEverythingElse) {
                  await ConversationService.updateConversation('everything-else', {
                    messages: rollbackState.originalEverythingElse.messages,
                    updatedAt: Date.now()
                  });
                  console.log('🎮 [MainApp] ✅ Rollback successful - messages restored to Everything Else');
                }
                
                // Refresh UI
                const refreshedConversations = await ConversationService.getConversations();
                setConversations(refreshedConversations);
              } catch (rollbackError) {
                console.error('🎮 [MainApp] ❌ Rollback failed:', rollbackError);
              }
              
              // Show error to user
              errorRecoveryService.displayError(
                'Failed to move messages to game tab. Your messages are safe in "Everything Else".',
                'error'
              );
            }
          } else {
            console.log('🎮 [MainApp] ⚠️ Skipping message migration - not in Everything Else tab or no target');
          }
        } else {
          console.log('🎮 [MainApp] Not creating game tab:', { 
            reason: !confidence ? 'no confidence' : confidence !== 'high' ? 'low confidence' : 'unreleased game'
          });
        }
      }

    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('AI request was aborted by user');
        return;
      }
      
      // Use error recovery service
      const recoveryAction = await errorRecoveryService.handleAIError(
        error as Error,
        {
          operation: 'handleSendMessage',
          conversationId: activeConversation.id,
          userId: user?.id,
          timestamp: Date.now(),
          retryCount: 0
        }
      );
      
      // Add error message to chat
      const errorMessage = {
        id: `msg_${Date.now() + 1}`,
        content: recoveryAction.message || "Sorry, I'm having trouble thinking right now. Please try again.",
        role: 'assistant' as const,
        timestamp: Date.now(),
      };
      
      // Optimized: Update state immediately
      setConversations(prev => {
        const updated = { ...prev };
        if (updated[activeConversation.id]) {
          updated[activeConversation.id] = {
            ...updated[activeConversation.id],
            messages: [...updated[activeConversation.id].messages, errorMessage],
            updatedAt: Date.now()
          };
        }
        return updated;
      });

      await ConversationService.addMessage(activeConversation.id, errorMessage);
      
      // Display user notification if needed
      if (recoveryAction.type === 'user_notification') {
        errorRecoveryService.displayError(recoveryAction.message || 'An error occurred', 'error');
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  if (!user || isInitializing) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-muted">{!user ? 'Loading...' : 'Initializing chat...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          activeConversation={activeConversation}
          onConversationSelect={handleConversationSelect}
          onDeleteConversation={handleDeleteConversation}
          onPinConversation={handlePinConversation}
          onUnpinConversation={handleUnpinConversation}
          onClearConversation={handleClearConversation}
        />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="chat-header-fixed bg-gradient-to-r from-surface/50 to-background/50 backdrop-blur-sm border-b border-surface-light/20 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden btn-icon p-3 text-text-muted hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <Logo size="sm" bounce={false} />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <div className="mr-2 sm:mr-3 lg:mr-4">
              <CreditIndicator 
                user={user} 
                onClick={handleCreditModalOpen}
              />
            </div>

            <HandsFreeToggle
              isHandsFree={isHandsFreeMode}
              onToggle={handleHandsFreeToggle}
            />
            
            <button
              onClick={handleConnectionModalOpen}
              className={`btn-icon p-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                connectionStatus === ConnectionStatus.CONNECTED 
                  ? 'text-green-400 hover:text-green-300' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title={connectionStatus === ConnectionStatus.CONNECTED ? 'PC Connected - Click to manage' : 'Connect to PC'}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
              </svg>
            </button>
            
            <button
              onClick={handleSettingsContextMenu}
              className="btn-icon p-3 text-text-muted hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* AdSense Placeholder Banner - Always show for free users */}
          {user.tier === 'free' && (
            <div className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6 flex-shrink-0">
              <div className="bg-gradient-to-r from-gray-100/10 to-gray-200/10 border border-gray-300/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-center h-16 sm:h-20 lg:h-24 bg-gray-100/20 rounded-lg border-2 border-dashed border-gray-300/40">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs sm:text-sm font-medium mb-1">Advertisement</div>
                    <div className="text-gray-300 text-xs">AdSense Placeholder</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Thread Name - Show on mobile when sidebar is collapsed */}
          {activeConversation && (
            <div className="lg:hidden px-3 sm:px-4 mb-3 sm:mb-4 flex-shrink-0">
              <div className="bg-gradient-to-r from-surface/30 to-background/30 backdrop-blur-sm border border-surface-light/20 rounded-lg px-4 py-3">
                <h2 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] bg-clip-text text-transparent text-center">
                  {activeConversation.title}
                </h2>
              </div>
            </div>
          )}

          
            {/* Chat Interface - Takes remaining space */}
            <div className="flex-1 min-h-0">
              <ChatInterface
                conversation={activeConversation}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                isPCConnected={connectionStatus === ConnectionStatus.CONNECTED}
                onRequestConnect={handleConnectionModalOpen}
                userTier={user.tier}
                onStop={handleStopAI}
                isManualUploadMode={isManualUploadMode}
                onToggleManualUploadMode={() => setIsManualUploadMode(!isManualUploadMode)}
                suggestedPrompts={suggestedPrompts}
                onSuggestedPromptClick={handleSuggestedPromptClick}
                activeSession={session}
                onToggleActiveSession={handleToggleActiveSession}
                initialMessage={currentInputMessage}
                onMessageChange={handleInputMessageChange}
              />
            </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
      />

      {/* Credit Modal */}
      <CreditModal
        isOpen={creditModalOpen}
        onClose={handleCreditModalClose}
        onUpgrade={handleUpgrade}
        user={user}
      />

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={connectionModalOpen}
        onClose={handleConnectionModalClose}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        status={connectionStatus}
        error={connectionError}
        connectionCode={connectionCode}
        lastSuccessfulConnection={lastSuccessfulConnection}
      />

      {/* Hands-Free Modal */}
      <HandsFreeModal
        isOpen={handsFreeModalOpen}
        onClose={handleHandsFreeModalClose}
        isHandsFree={isHandsFreeMode}
        onToggleHandsFree={handleToggleHandsFreeFromModal}
      />

      {/* Settings Context Menu */}
      <SettingsContextMenu
        isOpen={settingsContextMenu.isOpen}
        position={settingsContextMenu.position}
        onClose={closeSettingsContextMenu}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default MainApp;
