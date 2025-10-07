import React, { useState, useEffect } from 'react';
import { User, Conversation } from '../types';
import { ConversationService } from '../services/conversationService';
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
import { connect, disconnect } from '../services/websocketService';
import { aiService } from '../services/aiService';
import { useActiveSession } from '../hooks/useActiveSession';
import { gameTabService } from '../services/gameTabService';
import { errorRecoveryService } from '../services/errorRecoveryService';

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
  const [user] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('everything-else');
  const { session, toggleSession } = useActiveSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Computed values
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const [isManualUploadMode, setIsManualUploadMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<Date | null>(null);
  
  // Settings context menu state
  const [settingsContextMenu, setSettingsContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });
  
  // Use props for connection state, fallback to local state if not provided
  const connectionStatus = propConnectionStatus ?? ConnectionStatus.DISCONNECTED;
  const connectionError = propConnectionError ?? null;
  
  // Debug connection state
  console.log('🔍 [MainApp] Connection state:', {
    propConnectionStatus,
    connectionStatus,
    propConnectionError,
    connectionError
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

  // Load conversations on initial load
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const conversationsObject = await ConversationService.getConversations();
        const fetchedConversations = Object.values(conversationsObject);
        // Ensure 'Everything Else' always exists
        if (!fetchedConversations.find(c => c.id === 'everything-else')) {
          const everythingElseConversation: Conversation = {
            id: 'everything-else',
            title: 'Everything Else',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true,
          };
          fetchedConversations.unshift(everythingElseConversation);
        }
        setConversations(fetchedConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    if (user) {
      loadConversations();
    }
  }, [user]);

  // WebSocket message handling (only if using local websocket)
  useEffect(() => {
    if (propOnConnect) {
      // Using App.tsx connection state, no local websocket needed
      return;
    }


    const handleWebSocketError = (error: string) => {
      console.error('WebSocket error:', error);
    };

    const handleWebSocketOpen = () => {
      console.log('🔌 WebSocket connected');
    };

    const handleWebSocketClose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    // Check if we have a stored connection code and try to reconnect
    const storedCode = localStorage.getItem('otakon_connection_code');
    if (storedCode) {
      setConnectionCode(storedCode);
      connect(storedCode, handleWebSocketOpen, handleWebSocketMessage, handleWebSocketError, handleWebSocketClose);
    }

    // Note: Removed automatic disconnect on unmount to maintain persistent connection
    // WebSocket should only disconnect when user explicitly disconnects or logs out
  }, [activeConversation, propOnConnect]);



  const handleDeleteConversation = async (id: string) => {
    await ConversationService.deleteConversation(id);
    const conversationsObject = await ConversationService.getConversations();
    const updatedConversations = Object.values(conversationsObject);
    setConversations(updatedConversations);
    
    if (activeConversationId === id) {
      setActiveConversationId('everything-else');
    }
  };

  const handlePinConversation = async (id: string) => {
    // Check if we can pin (max 3 pinned conversations)
    const pinnedCount = conversations.filter((conv: Conversation) => conv.isPinned).length;
    if (pinnedCount >= 3) {
      alert('You can only pin up to 3 conversations. Please unpin another conversation first.');
      return;
    }

    await ConversationService.updateConversation(id, { 
      isPinned: true, 
      pinnedAt: Date.now() 
    });
    const conversationsObject = await ConversationService.getConversations();
    const updatedConversations = Object.values(conversationsObject);
    setConversations(updatedConversations);
  };

  const handleUnpinConversation = async (id: string) => {
    await ConversationService.updateConversation(id, { 
      isPinned: false, 
      pinnedAt: undefined 
    });
    const conversationsObject = await ConversationService.getConversations();
    const updatedConversations = Object.values(conversationsObject);
    setConversations(updatedConversations);
  };

  const handleClearConversation = async (id: string) => {
    await ConversationService.clearConversation(id);
    const conversationsObject = await ConversationService.getConversations();
    const updatedConversations = Object.values(conversationsObject);
    setConversations(updatedConversations);
    
    // If this was the active conversation, update it
    if (activeConversationId === id) {
      setActiveConversationId('everything-else');
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
    
    // Use prop handler if available, otherwise use local websocket
    if (propOnConnect) {
      propOnConnect(code);
    } else {
      // Fallback to local websocket connection
      connect(
        code,
        () => {
          setLastSuccessfulConnection(new Date());
          localStorage.setItem('otakonHasConnectedBefore', 'true');
        },
        (data: any) => {
          console.log('Connection message:', data);
        },
        (error: string) => {
          console.error('Connection error:', error);
        },
        () => {
          console.log('Connection closed');
        }
      );
    }
  };

  const handleDisconnect = () => {
    if (propOnDisconnect) {
      propOnDisconnect();
    } else {
      disconnect();
    }
    setConnectionCode(null);
    setLastSuccessfulConnection(null);
    localStorage.removeItem('otakon_connection_code');
    localStorage.removeItem('otakon_last_connection');
  };

  const handleCreateGameTab = async (gameInfo: { gameTitle: string; genre?: string; }) => {
    if (!user) return;
    
    // 1. Check if a tab for this game already exists to prevent duplicates
    const existingConv = conversations.find(c => c.gameTitle?.toLowerCase() === gameInfo.gameTitle.toLowerCase());
    if (existingConv) {
      setActiveConversationId(existingConv.id); // Just switch to it
      return;
    }

    try {
      // 2. Create the new tab structure using the service
      const newConversation = await gameTabService.createGameTab(gameInfo, user.id);
      
      // 3. Add the new conversation to the state and make it active
      const updatedConversations = [...conversations, newConversation];
      setConversations(updatedConversations);
      setActiveConversationId(newConversation.id);

      // 4. (Async) Post-creation enrichment: Use Gemini 2.5 Pro to fill in sub-tabs
      // This happens in the background and updates the state once complete.
      const initialInsights = await aiService.generateInitialInsights(newConversation.gameTitle!, newConversation.genre!);
      
      setConversations(prevConvs => prevConvs.map(conv => {
          if (conv.id === newConversation.id) {
              const enrichedSubtabs = conv.subtabs?.map(subtab => {
                  if (initialInsights[subtab.id]) {
                      return { ...subtab, content: initialInsights[subtab.id], status: 'loaded' as 'loaded' };
                  }
              return subtab;
              });
              const updatedConv = { ...conv, subtabs: enrichedSubtabs };
              // Persist this final update to Supabase
              ConversationService.updateConversation(updatedConv.id, updatedConv);
              return updatedConv;
          }
          return conv;
      }));
    } catch (error) {
      console.error('Error creating game tab:', error);
    }
  };

  const handleSendMessage = async (message: string, imageUrl?: string) => {
    if (!activeConversation || !user) return;

    const newMessage = {
      id: `msg_${Date.now()}`,
      content: message,
      role: 'user' as const,
      timestamp: Date.now(),
      imageUrl,
    };

    await ConversationService.addMessage(activeConversation.id, newMessage);
    const conversationsObject = await ConversationService.getConversations();
    const updatedConversations = Object.values(conversationsObject);
    setConversations(updatedConversations);

    // Get real AI response
    setIsLoading(true);
    try {
      const isActiveSession = session.isActive && session.currentGameId === activeConversation.id;
      const response = await errorRecoveryService.retryWithBackoff(
        () => aiService.getChatResponse(activeConversation, user, message, isActiveSession, !!imageUrl)
      );

      const aiMessage = {
        id: `msg_${Date.now() + 1}`,
        content: response.content,
        role: 'assistant' as const,
        timestamp: Date.now(),
      };

      await ConversationService.addMessage(activeConversation.id, aiMessage);
      const conversationsObject = await ConversationService.getConversations();
      const updatedConversations = Object.values(conversationsObject);
      setConversations(updatedConversations);

      // Check for game tab creation signal
      if (response.otakonTags.has('GAME_ID')) {
        const gameInfo = {
          gameTitle: response.otakonTags.get('GAME_ID'),
          genre: response.otakonTags.get('GENRE') || 'Default',
        };
        console.log('Game detected:', gameInfo);
        handleCreateGameTab(gameInfo);
      }

      // Check for insight updates
      if (response.otakonTags.has('INSIGHT_UPDATE')) {
        const insightData = response.otakonTags.get('INSIGHT_UPDATE');
        if (insightData && typeof insightData === 'object') {
          try {
            await ConversationService.updateSubTabContent(activeConversation.id, insightData.id, insightData.content);
            console.log(`Updated sub-tab ${insightData.id} with new content`);
          } catch (error) {
            console.error('Error updating sub-tab content:', error);
            errorRecoveryService.handleConversationError(error);
          }
        }
      }

    } catch (error) {
      console.error("Failed to get AI response:", error);
      errorRecoveryService.handleAIServiceError(error);
      
      // Fallback to error message
      const errorMessage = {
        id: `msg_${Date.now() + 1}`,
        content: "Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.",
        role: 'assistant' as const,
        timestamp: Date.now(),
      };

      await ConversationService.addMessage(activeConversation.id, errorMessage);
      const conversationsObject = await ConversationService.getConversations();
      const updatedConversations = Object.values(conversationsObject);
      setConversations(updatedConversations);
    } finally {
      setIsLoading(false);
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
          activeConversationId={activeConversationId}
          onConversationSelect={setActiveConversationId}
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
                conversation={activeConversation || null}
                user={user}
                session={session}
                onToggleSession={() => activeConversation && toggleSession(activeConversation.id)}
                onCreateGameTab={handleCreateGameTab}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                isPCConnected={connectionStatus === ConnectionStatus.CONNECTED}
                onRequestConnect={handleConnectionModalOpen}
                userTier={user.tier}
                onStop={() => {
                  // TODO: Implement stop functionality
                  console.log('Stop button clicked');
                }}
                isManualUploadMode={isManualUploadMode}
                onToggleManualUploadMode={() => setIsManualUploadMode(!isManualUploadMode)}
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
