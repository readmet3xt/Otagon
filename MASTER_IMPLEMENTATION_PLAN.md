# 🎮 **Otagon Master Implementation Plan**
## **AI Gaming Assistant - Complete Rebuild & Scale Optimization**

---

## **🎯 Executive Summary**

This master plan merges three critical initiatives:
1. **Feature Recreation**: Restore all features from the old build
2. **Architecture Refactoring**: Fix overengineering and scalability issues  
3. **AI Enhancement**: Implement advanced gaming assistant capabilities

**Target**: Production-ready app supporting 10K-50K users with advanced AI gaming assistance.

---

## **📊 Current State Analysis**

### **✅ What's Working (Keep)**
- **Authentication**: Supabase auth with Google/Discord/Email
- **Basic Chat Interface**: Message sending/receiving
- **Onboarding Flow**: Splash screens and user setup
- **User Tiers**: Free/Pro/Vanguard system
- **Basic WebSocket**: Connection framework exists

### **🚨 Critical Issues (Fix Immediately)**
- **Database Write Spam**: App.tsx writes to Supabase on every state change
- **Massive State Objects**: 20+ properties causing unnecessary re-renders
- **Duplicate State Management**: State duplicated across components
- **No Chat Persistence**: Conversations don't persist across sessions
- **Missing Core Features**: 80% of old build features missing

### **❌ Missing Features from Old Build**
- Screenshot gallery with localStorage
- Context menu system
- PC client WebSocket integration
- Hands-free TTS system
- Credit/usage tracking
- Game detection & auto-tab creation
- "Everything Else" default conversation
- Insight tabs for Pro users
- Feedback system (thumbs up/down)
- Connection management
- Download system

---

## **🏗️ Architecture Strategy**

### **Phase 0: Critical Scalability Fixes (Week 1)**
> **Priority: CRITICAL** - Must fix before adding features

#### **0.1 Fix Database Write Spam**
**Problem**: Every state change triggers Supabase write
```tsx
// Current: 🚨 Fires constantly
useEffect(() => {
  updateAppState(); // Writes entire state to DB
}, [8+ dependencies]);
```

**Solution**: Smart batching and debouncing
```tsx
// New: Batch critical changes, debounce UI changes
const useSyncStrategy = () => {
  const debouncedSync = useMemo(
    () => debounce((changes) => syncToSupabase(changes), 3000),
    []
  );
  
  const syncCritical = (data) => {
    // Immediate sync: tier changes, trial status, onboarding completion
    if (data.tier || data.trialStatus || data.onboardingCompleted) {
      syncToSupabase(data);
    } else {
      // Debounce: UI state, preferences, etc.
      debouncedSync(data);
    }
  };
};
```

#### **0.2 Restructure State Management**
**Replace massive App.tsx state with focused stores:**

```tsx
// Core user store (sync to Supabase)
const useUserStore = create<UserState>((set, get) => ({
  user: null,
  tier: 'free',
  trialStatus: null,
  onboardingStatus: 'initial',
  
  // Actions with smart sync
  updateTier: (tier) => {
    set({ tier });
    syncToSupabase({ tier }); // Immediate
  },
  
  updatePreferences: (prefs) => {
    set({ preferences: prefs });
    debouncedSync({ preferences: prefs }); // Debounced
  }
}));

// Conversation store (hybrid sync)
const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: {},
  activeConversationId: 'everything-else',
  
  // Game detection & auto-tab creation
  handleGameDetection: async (gameId, gameName, confidence) => {
    if (confidence === 'high' && !get().conversations[gameId]) {
      const newConversation = createGameConversation(gameId, gameName);
      set(state => ({
        conversations: { ...state.conversations, [gameId]: newConversation },
        activeConversationId: gameId
      }));
      await syncConversationToSupabase(newConversation);
    }
  }
}));

// UI store (local only - no Supabase sync)
const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activeModal: null,
  isLoading: false,
  connectionStatus: 'disconnected'
}));

// WebSocket store (connection management)
const useWebSocketStore = create<WebSocketState>((set, get) => ({
  ws: null,
  connectionCode: null,
  isConnected: false,
  desktopConnected: false,
  
  connect: (code) => {
    const ws = new WebSocket(`wss://otakon-relay.onrender.com/${code}`);
    // Simple connection logic (desktop handles robustness)
    set({ ws, connectionCode: code });
  }
}));
```

#### **0.3 Optimize Conversation Loading**
**Problem**: Loads all conversations on every operation
```tsx
// Current: 🚨 Heavy operation
setConversations(ConversationService.getConversations());
```

**Solution**: Lazy loading with caching
```tsx
const useConversations = () => {
  const [conversations, setConversations] = useState({});
  const [loaded, setLoaded] = useState(false);
  
  const loadConversation = useCallback(async (id: string) => {
    if (conversations[id]) return conversations[id];
    
    const conversation = await ConversationService.getConversation(id);
    setConversations(prev => ({ ...prev, [id]: conversation }));
    return conversation;
  }, [conversations]);
};
```

---

## **🎮 Feature Implementation Plan**

### **Phase 1: Core Chat Persistence (Week 1)**

#### **1.1 Database Schema Enhancement**
**Files**: `supabase/enhanced-schema.sql`

```sql
-- Enhanced conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(auth_user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  game_id TEXT,
  game_name TEXT,
  game_genre TEXT,
  confidence_score FLOAT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_from_pc BOOLEAN DEFAULT false,
  message_type TEXT DEFAULT 'text',
  ai_model TEXT,
  processing_time_ms INTEGER,
  token_count INTEGER,
  feedback TEXT CHECK (feedback IN ('up', 'down', null)),
  feedback_details TEXT,
  game_detected TEXT,
  confidence_score FLOAT
);

-- User usage tracking for credits
CREATE TABLE user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(auth_user_id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  text_queries INTEGER DEFAULT 0,
  image_queries INTEGER DEFAULT 0,
  text_limit INTEGER DEFAULT 10,
  image_limit INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- AI feedback for improvement
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(auth_user_id) ON DELETE CASCADE,
  feedback_type TEXT CHECK (feedback_type IN ('thumbs_up', 'thumbs_down')),
  detailed_feedback TEXT,
  conversation_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Game-specific insights for Pro users
CREATE TABLE game_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(auth_user_id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'story_so_far', 'characters', 'locations', etc.
  title TEXT NOT NULL,
  content TEXT,
  priority INTEGER DEFAULT 0,
  is_pro_only BOOLEAN DEFAULT false,
  progress FLOAT DEFAULT 0,
  status TEXT DEFAULT 'loading', -- 'loading', 'loaded', 'error'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **1.2 Enhanced ConversationService with Auto-Sync**
**Files**: `src/services/conversationService.ts`

```typescript
export class ConversationService {
  // Auto-sync methods
  static async createConversation(
    userId: string, 
    title: string, 
    gameId?: string,
    gameName?: string
  ): Promise<Conversation> {
    const conversation = {
      id: gameId || `conv_${Date.now()}`,
      userId,
      title,
      gameId,
      gameName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: false,
      isDefault: title === 'Everything else',
      metadata: {}
    };

    // Immediate local update
    const conversations = this.getLocalConversations();
    conversations[conversation.id] = conversation;
    StorageService.set(STORAGE_KEYS.CONVERSATIONS, conversations);

    // Background Supabase sync
    this.syncToSupabase(conversation).catch(console.error);

    return conversation;
  }

  static async addMessage(
    message: ChatMessage, 
    userId: string
  ): Promise<void> {
    // Immediate local update
    const conversations = this.getLocalConversations();
    if (conversations[message.conversationId]) {
      conversations[message.conversationId].messages = 
        conversations[message.conversationId].messages || [];
      conversations[message.conversationId].messages.push(message);
      conversations[message.conversationId].updatedAt = new Date().toISOString();
      
      StorageService.set(STORAGE_KEYS.CONVERSATIONS, conversations);
    }

    // Background Supabase sync
    this.syncMessageToSupabase(message, userId).catch(console.error);
    
    // Update usage if user message
    if (message.role === 'user') {
      this.incrementUsage(userId, message.images?.length > 0 ? 'image' : 'text')
        .catch(console.error);
    }
  }

  // Game detection integration
  static async handleGameDetection(
    userId: string,
    gameId: string,
    gameName: string,
    genre: string,
    confidence: number,
    userTier: UserTier
  ): Promise<Conversation> {
    // Create game-specific conversation
    const gameConversation = await this.createConversation(
      userId, 
      gameName, 
      gameId, 
      gameName
    );

    // Create insight tabs for Pro users
    if (userTier !== 'free') {
      await this.createInsightTabs(gameConversation.id, genre, userTier);
    }

    return gameConversation;
  }

  // Fallback methods for offline support
  private static getLocalConversations(): Record<string, Conversation> {
    return StorageService.get(STORAGE_KEYS.CONVERSATIONS, {});
  }

  private static async syncToSupabase(conversation: Conversation): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .upsert({
          id: conversation.id,
          user_id: conversation.userId,
          title: conversation.title,
          game_id: conversation.gameId,
          game_name: conversation.gameName,
          is_active: conversation.isActive,
          is_default: conversation.isDefault,
          metadata: conversation.metadata,
          updated_at: conversation.updatedAt
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to sync conversation to Supabase:', error);
      // Continue working offline
    }
  }
}
```

### **Phase 2: Screenshot Gallery System (Week 1-2)**

#### **2.1 Screenshot Storage Service (localStorage Only)**
**Files**: `src/services/screenshotStorageService.ts`

```typescript
export interface ScreenshotData {
  id: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  name: string;
  size: number;
  timestamp: number;
  source: 'pc_client' | 'manual_upload';
  conversationId?: string;
  messageId?: string;
  isFromPC: boolean;
  originalFilename?: string;
  compressed?: boolean;
  quality?: number;
}

export class ScreenshotStorageService {
  private static readonly STORAGE_KEY = 'otakon_screenshots';
  private static readonly MAX_STORAGE_MB = 50;
  private static readonly MAX_SCREENSHOTS = 1000;

  static async storeScreenshot(screenshot: ScreenshotData): Promise<void> {
    const screenshots = this.getScreenshots();
    
    // Check storage limits
    const currentSize = this.getStorageUsage().used;
    if (currentSize + screenshot.size > this.MAX_STORAGE_MB * 1024 * 1024) {
      await this.cleanupOldScreenshots();
    }

    // Compress if needed
    if (screenshot.size > 2 * 1024 * 1024) { // 2MB
      screenshot = await this.compressScreenshot(screenshot);
    }

    screenshots.push(screenshot);
    
    // Limit total count
    if (screenshots.length > this.MAX_SCREENSHOTS) {
      screenshots.splice(0, screenshots.length - this.MAX_SCREENSHOTS);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(screenshots));
  }

  static getScreenshots(): ScreenshotData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading screenshots:', error);
      return [];
    }
  }

  static getStorageUsage(): { used: number; limit: number; percentage: number } {
    const screenshots = this.getScreenshots();
    const used = screenshots.reduce((total, screenshot) => total + screenshot.size, 0);
    const limit = this.MAX_STORAGE_MB * 1024 * 1024;
    
    return {
      used,
      limit,
      percentage: (used / limit) * 100
    };
  }

  static async compressScreenshot(screenshot: ScreenshotData): Promise<ScreenshotData> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Resize to max 1920x1080
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const compressedBase64 = compressedDataUrl.split(',')[1];

        resolve({
          ...screenshot,
          dataUrl: compressedDataUrl,
          base64: compressedBase64,
          size: compressedBase64.length * 0.75, // Approximate size
          compressed: true,
          quality: 0.8
        });
      };

      img.src = screenshot.dataUrl;
    });
  }
}
```

#### **2.2 Screenshot Gallery Modal**
**Files**: `src/components/modals/ScreenshotGalleryModal.tsx`

```tsx
interface ScreenshotGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScreenshotGalleryModal: React.FC<ScreenshotGalleryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [selectedScreenshots, setSelectedScreenshots] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'source' | 'name'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'pc_client' | 'manual_upload'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewScreenshot, setPreviewScreenshot] = useState<ScreenshotData | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadScreenshots();
    }
  }, [isOpen]);

  const loadScreenshots = () => {
    const allScreenshots = ScreenshotStorageService.getScreenshots();
    setScreenshots(allScreenshots);
  };

  const filteredAndSortedScreenshots = useMemo(() => {
    let filtered = screenshots;

    // Apply filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(s => s.source === filterBy);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.originalFilename?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.timestamp - a.timestamp;
        case 'size':
          return b.size - a.size;
        case 'source':
          return a.source.localeCompare(b.source);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [screenshots, filterBy, searchQuery, sortBy]);

  const handleBulkDownload = async () => {
    const selected = screenshots.filter(s => selectedScreenshots.includes(s.id));
    await DownloadService.downloadMultipleScreenshots(selected);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedScreenshots) {
      await ScreenshotStorageService.deleteScreenshot(id);
    }
    setSelectedScreenshots([]);
    loadScreenshots();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-surface-dark rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-surface-light/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-text-primary">Screenshot Gallery</h2>
            <button
              onClick={onClose}
              className="btn-icon p-2 hover:bg-surface-light/10"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Search screenshots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-enhanced flex-1 min-w-[200px]"
            />
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="input-enhanced"
            >
              <option value="all">All Sources</option>
              <option value="pc_client">PC Client</option>
              <option value="manual_upload">Manual Upload</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-enhanced"
            >
              <option value="date">Sort by Date</option>
              <option value="size">Sort by Size</option>
              <option value="source">Sort by Source</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedScreenshots.length > 0 && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleBulkDownload}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                Download Selected ({selectedScreenshots.length})
              </Button>
              <Button
                onClick={handleBulkDelete}
                variant="danger"
                className="flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAndSortedScreenshots.length === 0 ? (
            <div className="text-center py-12">
              <GalleryIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Screenshots Found</h3>
              <p className="text-text-muted">
                {searchQuery || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Take some screenshots to see them here!'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredAndSortedScreenshots.map((screenshot) => (
                <ScreenshotCard
                  key={screenshot.id}
                  screenshot={screenshot}
                  isSelected={selectedScreenshots.includes(screenshot.id)}
                  onSelect={(selected) => {
                    if (selected) {
                      setSelectedScreenshots(prev => [...prev, screenshot.id]);
                    } else {
                      setSelectedScreenshots(prev => prev.filter(id => id !== screenshot.id));
                    }
                  }}
                  onPreview={() => setPreviewScreenshot(screenshot)}
                  onDelete={async () => {
                    await ScreenshotStorageService.deleteScreenshot(screenshot.id);
                    loadScreenshots();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewScreenshot && (
        <ScreenshotPreview
          screenshot={previewScreenshot}
          screenshots={filteredAndSortedScreenshots}
          onClose={() => setPreviewScreenshot(null)}
          onNavigate={(direction) => {
            const currentIndex = filteredAndSortedScreenshots.findIndex(s => s.id === previewScreenshot.id);
            const newIndex = direction === 'next' 
              ? (currentIndex + 1) % filteredAndSortedScreenshots.length
              : (currentIndex - 1 + filteredAndSortedScreenshots.length) % filteredAndSortedScreenshots.length;
            setPreviewScreenshot(filteredAndSortedScreenshots[newIndex]);
          }}
        />
      )}
    </div>
  );
};
```

### **Phase 3: Game Detection & Auto-Tab Creation (Week 2)**

#### **3.1 Enhanced AI Service with Game Detection**
**Files**: `src/services/enhancedAIService.ts`

```typescript
export class EnhancedAIService {
  static async processMessage(
    conversation: Conversation,
    message: string,
    images: string[],
    userId: string,
    userTier: UserTier
  ): Promise<{
    response: string;
    gameDetection?: {
      gameId: string;
      gameName: string;
      genre: string;
      confidence: number;
      shouldCreateTab: boolean;
    };
    suggestedPrompts?: string[];
  }> {
    
    // Build context for AI
    const context = await this.buildAIContext(conversation, userId, userTier);
    
    // Determine optimal model based on user tier and content
    const model = this.getOptimalModel(userTier, images.length > 0);
    
    // Process with Gemini
    const aiResponse = await this.callGeminiAPI({
      model,
      context,
      message,
      images,
      conversation
    });

    // Parse response for game detection
    const gameDetection = this.parseGameDetection(aiResponse.content);
    
    // Handle game detection
    if (gameDetection && gameDetection.shouldCreateTab && conversation.id === 'everything-else') {
      // Create new game conversation
      const gameConversation = await ConversationService.handleGameDetection(
        userId,
        gameDetection.gameId,
        gameDetection.gameName,
        gameDetection.genre,
        gameDetection.confidence,
        userTier
      );
      
      // Move this conversation to the new game tab
      return {
        ...aiResponse,
        gameDetection: {
          ...gameDetection,
          newConversationId: gameConversation.id
        }
      };
    }

    return aiResponse;
  }

  private static async buildAIContext(
    conversation: Conversation,
    userId: string,
    userTier: UserTier
  ): Promise<string> {
    let context = `You are Otagon, an AI gaming assistant. You help gamers with:
- Game identification from screenshots
- Spoiler-free hints and guidance
- Game lore and world-building information
- Progress tracking and objective management

User Tier: ${userTier}
Current Conversation: ${conversation.title} (${conversation.id})
`;

    // Add game-specific context if not "Everything Else"
    if (conversation.id !== 'everything-else' && conversation.gameId) {
      context += `
Game Context: ${conversation.gameName}
Genre: ${conversation.metadata?.genre || 'Unknown'}
`;

      // Add long-term memory for this game
      const gameMemory = await LongTermMemoryService.getGameContext(conversation.gameId);
      if (gameMemory) {
        context += `\nGame Memory: ${gameMemory}`;
      }
    }

    // Add user profile context
    const profileContext = PlayerProfileService.getProfileContext(userId);
    if (profileContext) {
      context += `\nUser Profile: ${profileContext}`;
    }

    // Add conversation history (last 10 messages)
    const recentMessages = conversation.messages?.slice(-10) || [];
    if (recentMessages.length > 0) {
      context += `\nRecent Conversation:\n${recentMessages.map(m => 
        `${m.role}: ${m.content}`
      ).join('\n')}`;
    }

    return context;
  }

  private static parseGameDetection(aiResponse: string): {
    gameId: string;
    gameName: string;
    genre: string;
    confidence: number;
    shouldCreateTab: boolean;
  } | null {
    // Look for game detection markers in AI response
    const gameIdMatch = aiResponse.match(/\[OTAKON_GAME_ID: (.+?)\]/);
    const confidenceMatch = aiResponse.match(/\[OTAKON_CONFIDENCE: (high|medium|low)\]/);
    const genreMatch = aiResponse.match(/\[OTAKON_GENRE: (.+?)\]/);

    if (gameIdMatch && confidenceMatch) {
      const gameName = gameIdMatch[1];
      const gameId = this.generateGameId(gameName);
      const confidence = confidenceMatch[1] === 'high' ? 0.9 : 
                        confidenceMatch[1] === 'medium' ? 0.7 : 0.5;
      const genre = genreMatch?.[1] || 'Action';

      return {
        gameId,
        gameName,
        genre,
        confidence,
        shouldCreateTab: confidence >= 0.7 // High or medium confidence
      };
    }

    return null;
  }

  private static generateGameId(gameName: string): string {
    return gameName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private static getOptimalModel(userTier: UserTier, hasImages: boolean): string {
    if (hasImages) {
      return 'gemini-2.5-flash'; // Always use Flash for images
    }
    
    if (userTier === 'free') {
      return 'gemini-2.5-flash'; // Free users get Flash
    } else {
      return 'gemini-2.5-pro'; // Pro users get Pro for text
    }
  }
}
```

### **Phase 4: Context Menu & UI Enhancement (Week 2)**

#### **4.1 Context Menu System**
**Files**: `src/components/ContextMenu.tsx`

```tsx
interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: string | number;
  variant?: 'default' | 'danger';
}

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  items: ContextMenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  onClose,
  anchorEl,
  items
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const menuWidth = 280;
      const menuHeight = items.length * 48 + 16; // Approximate height

      let x = rect.right + 8;
      let y = rect.top;

      // Adjust if menu would go off-screen
      if (x + menuWidth > window.innerWidth) {
        x = rect.left - menuWidth - 8;
      }
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 8;
      }

      setPosition({ x, y });
    }
  }, [isOpen, anchorEl, items.length]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (anchorEl && !anchorEl.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 bg-surface-dark border border-surface-light/20 rounded-xl shadow-xl py-2 min-w-[280px] animate-scale-in"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
          className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-light/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            item.variant === 'danger' ? 'text-red-400 hover:bg-red-500/10' : 'text-text-primary'
          }`}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span className="flex-1 font-medium">{item.label}</span>
          {item.badge && (
            <span className="flex-shrink-0 bg-accent-primary text-accent-primary-text px-2 py-1 rounded-full text-xs font-semibold">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
```

#### **4.2 Integration with MainApp**
**Files**: `src/components/MainApp.tsx` (Updated)

```tsx
export const MainApp: React.FC<MainAppProps> = ({ onLogout, ...props }) => {
  const { user } = useUserStore();
  const { conversations, activeConversationId } = useConversationStore();
  const { 
    activeModal, 
    setActiveModal,
    contextMenuAnchor,
    setContextMenuAnchor 
  } = useUIStore();
  
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);

  // Load screenshots for badge count
  useEffect(() => {
    const loadScreenshots = () => {
      const allScreenshots = ScreenshotStorageService.getScreenshots();
      setScreenshots(allScreenshots);
    };
    
    loadScreenshots();
    
    // Listen for screenshot updates
    const handleStorageChange = () => loadScreenshots();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const contextMenuItems: ContextMenuItem[] = [
    {
      id: 'screenshot-gallery',
      label: 'Screenshot Gallery',
      icon: <GalleryIcon className="w-5 h-5" />,
      onClick: () => setActiveModal('screenshot-gallery'),
      badge: screenshots.length > 0 ? screenshots.length : undefined
    },
    {
      id: 'credit-usage',
      label: 'Credit Usage',
      icon: <CreditIcon className="w-5 h-5" />,
      onClick: () => setActiveModal('credit-usage')
    },
    {
      id: 'hands-free',
      label: 'Hands-Free Mode',
      icon: <HandsFreeIcon className="w-5 h-5" />,
      onClick: () => setActiveModal('hands-free'),
      disabled: user?.tier === 'free'
    },
    {
      id: 'pc-connection',
      label: 'PC Connection',
      icon: <DesktopIcon className="w-5 h-5" />,
      onClick: () => setActiveModal('pc-connection')
    },
    {
      id: 'divider-1',
      label: '',
      icon: null,
      onClick: () => {},
      disabled: true
    },
    {
      id: 'about',
      label: 'About Otagon',
      icon: <InfoIcon className="w-5 h-5" />,
      onClick: () => setActiveModal('about')
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      icon: <ShieldIcon className="w-5 h-5" />,
      onClick: () => setActiveModal('privacy')
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      icon: <FileTextIcon className="w-5 h-5" />,
      onClick: () => setActiveModal('terms')
    },
    {
      id: 'contact',
      label: 'Contact Us',
      icon: <MailIcon className="w-5 h-5" />,
      onClick: () => setActiveModal('contact')
    },
    {
      id: 'divider-2',
      label: '',
      icon: null,
      onClick: () => {},
      disabled: true
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <LogOutIcon className="w-5 h-5" />,
      onClick: onLogout,
      variant: 'danger'
    }
  ];

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        conversations={Object.values(conversations)}
        activeConversationId={activeConversationId}
        onConversationSelect={(id) => useConversationStore.getState().setActiveConversation(id)}
        onDeleteConversation={(id) => useConversationStore.getState().deleteConversation(id)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 bg-surface-dark border-b border-surface-light/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn-icon p-2 lg:hidden"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              <Logo size="sm" />
            </div>

            <div className="flex items-center gap-4">
              {/* Credit Indicator */}
              <CreditIndicator 
                usage={user?.usage}
                tier={user?.tier}
                onClick={() => setActiveModal('credit-usage')}
              />

              {/* Connection Status */}
              <ConnectionButton
                status={connectionStatus}
                onClick={() => setActiveModal('pc-connection')}
              />

              {/* Context Menu Button */}
              <button
                ref={contextMenuAnchor}
                onClick={(e) => setContextMenuAnchor(e.currentTarget)}
                className="btn-icon p-2 hover:bg-surface-light/10"
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <div className="flex-1">
          <ChatInterface
            conversation={conversations[activeConversationId]}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={!!contextMenuAnchor}
        onClose={() => setContextMenuAnchor(null)}
        anchorEl={contextMenuAnchor}
        items={contextMenuItems}
      />

      {/* All Modals */}
      <ScreenshotGalleryModal
        isOpen={activeModal === 'screenshot-gallery'}
        onClose={() => setActiveModal(null)}
      />
      
      <CreditModal
        isOpen={activeModal === 'credit-usage'}
        onClose={() => setActiveModal(null)}
        usage={user?.usage}
        tier={user?.tier}
      />

      <HandsFreeModal
        isOpen={activeModal === 'hands-free'}
        onClose={() => setActiveModal(null)}
        userTier={user?.tier}
      />

      <ConnectionModal
        isOpen={activeModal === 'pc-connection'}
        onClose={() => setActiveModal(null)}
      />

      {/* Other modals... */}
    </div>
  );
};
```

### **Phase 5: WebSocket Integration & PC Client (Week 3)**

#### **5.1 Enhanced WebSocket Service**
**Files**: `src/services/websocketService.ts`

```typescript
export class WebSocketService {
  private ws: WebSocket | null = null;
  private connectionCode: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 2000;
  private messageQueue: any[] = [];
  private listeners: Map<string, Function[]> = new Map();

  // Simple connection (desktop handles complexity)
  connect(code: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.connectionCode = code;
      this.ws = new WebSocket(`wss://otakon-relay.onrender.com/${code}`);

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log('Connected to relay server');
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
        this.emit('connected');
        resolve(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        clearTimeout(timeout);
        console.log('WebSocket connection closed');
        this.emit('disconnected');
        
        // Simple reconnection logic
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(code);
          }, this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      };
    });
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'partner_connected':
        this.emit('desktop_connected');
        break;
        
      case 'partner_disconnected':
        this.emit('desktop_disconnected');
        break;
        
      case 'screenshot':
        this.handleScreenshotReceived(data.data);
        break;
        
      case 'screenshot_batch':
        this.handleScreenshotBatch(data.data);
        break;
        
      default:
        this.emit('message', data);
    }
  }

  private async handleScreenshotReceived(screenshotData: any) {
    try {
      // Convert to ScreenshotData format
      const screenshot: ScreenshotData = {
        id: `pc_${Date.now()}_${Math.random()}`,
        dataUrl: screenshotData.dataUrl,
        base64: screenshotData.base64,
        mimeType: screenshotData.mimeType || 'image/png',
        name: `PC Screenshot ${new Date().toLocaleString()}`,
        size: screenshotData.base64.length * 0.75,
        timestamp: Date.now(),
        source: 'pc_client',
        isFromPC: true,
        originalFilename: screenshotData.filename
      };

      // Store in screenshot gallery
      await ScreenshotStorageService.storeScreenshot(screenshot);

      // Add to active conversation
      const { activeConversationId } = useConversationStore.getState();
      if (activeConversationId) {
        const message: ChatMessage = {
          id: `msg_${Date.now()}`,
          conversationId: activeConversationId,
          role: 'user',
          content: '',
          images: [screenshot.dataUrl],
          timestamp: new Date().toISOString(),
          isFromPC: true,
          messageType: 'image'
        };

        await ConversationService.addMessage(message, useUserStore.getState().user?.id || '');
      }

      this.emit('screenshot_received', screenshot);
    } catch (error) {
      console.error('Error handling screenshot:', error);
    }
  }

  sendMessage(type: string, data: any) {
    const message = { type, data };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  // Screenshot capture methods
  captureScreenshot(mode: 'single' | 'multi' = 'single') {
    this.sendMessage('capture_screenshot', { mode });
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionCode = null;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
```

### **Phase 6: Feedback System (Week 3)**

#### **6.1 Feedback Integration in Chat**
**Files**: `src/components/features/ChatInterface.tsx` (Enhanced)

```tsx
// Add to existing ChatInterface component
const MessageBubble: React.FC<{
  message: ChatMessage;
  onFeedback: (messageId: string, type: 'thumbs_up' | 'thumbs_down') => void;
}> = ({ message, onFeedback }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleThumbsDown = () => {
    setShowFeedbackForm(true);
  };

  const submitDetailedFeedback = async () => {
    await FeedbackService.submitFeedback(
      message.id,
      'thumbs_down',
      feedbackText
    );
    onFeedback(message.id, 'thumbs_down');
    setShowFeedbackForm(false);
    setFeedbackText('');
  };

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${
        message.role === 'user' ? 'chat-message-user' : 'chat-message-ai'
      }`}>
        {/* Message content */}
        <div className="message-content">
          {message.images?.map((image, index) => (
            <img
              key={index}
              src={image}
              alt="Uploaded"
              className="w-full max-w-sm rounded-lg mb-3"
            />
          ))}
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {/* Feedback buttons for AI messages */}
        {message.role === 'assistant' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-light/20">
            <button
              onClick={() => onFeedback(message.id, 'thumbs_up')}
              className={`p-2 rounded-lg transition-colors ${
                message.feedback === 'up'
                  ? 'bg-green-500/20 text-green-400'
                  : 'hover:bg-surface-light/10 text-text-muted hover:text-text-primary'
              }`}
              disabled={!!message.feedback}
            >
              <ThumbsUpIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleThumbsDown}
              className={`p-2 rounded-lg transition-colors ${
                message.feedback === 'down'
                  ? 'bg-red-500/20 text-red-400'
                  : 'hover:bg-surface-light/10 text-text-muted hover:text-text-primary'
              }`}
              disabled={!!message.feedback}
            >
              <ThumbsDownIcon className="w-4 h-4" />
            </button>
            
            <span className="text-xs text-text-muted ml-2">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Detailed feedback form */}
        {showFeedbackForm && (
          <div className="mt-4 p-4 bg-surface-light/10 rounded-lg">
            <h4 className="text-sm font-semibold text-text-primary mb-2">
              Help us improve
            </h4>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What could have been better about this response?"
              className="w-full p-3 bg-surface-dark border border-surface-light/20 rounded-lg text-text-primary placeholder-text-muted resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-3">
              <Button
                onClick={submitDetailedFeedback}
                variant="primary"
                size="sm"
                disabled={!feedbackText.trim()}
              >
                Submit Feedback
              </Button>
              <Button
                onClick={() => setShowFeedbackForm(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### **6.2 Feedback Service**
**Files**: `src/services/feedbackService.ts`

```typescript
export class FeedbackService {
  static async submitFeedback(
    messageId: string,
    type: 'thumbs_up' | 'thumbs_down',
    detailedFeedback?: string
  ): Promise<void> {
    try {
      const { user } = useUserStore.getState();
      const { activeConversationId } = useConversationStore.getState();

      if (!user) throw new Error('User not authenticated');

      const feedbackData = {
        message_id: messageId,
        user_id: user.id,
        feedback_type: type,
        detailed_feedback: detailedFeedback,
        conversation_id: activeConversationId,
        timestamp: new Date().toISOString(),
        metadata: {
          user_tier: user.tier,
          app_version: '2.0.0'
        }
      };

      // Store in Supabase
      const { error } = await supabase
        .from('ai_feedback')
        .insert(feedbackData);

      if (error) throw error;

      // Update local message feedback status
      await ConversationService.updateMessageFeedback(messageId, type);

      console.log('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Could show toast notification here
    }
  }

  static async getFeedbackStats(userId: string): Promise<{
    totalFeedback: number;
    positiveRatio: number;
    recentFeedback: any[];
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const totalFeedback = data.length;
      const positiveFeedback = data.filter(f => f.feedback_type === 'thumbs_up').length;
      const positiveRatio = totalFeedback > 0 ? positiveFeedback / totalFeedback : 0;

      return {
        totalFeedback,
        positiveRatio,
        recentFeedback: data.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return {
        totalFeedback: 0,
        positiveRatio: 0,
        recentFeedback: []
      };
    }
  }
}
```

---

## **🚀 Implementation Priority & Timeline**

### **🔥 CRITICAL (Week 1) - Fix Scalability Issues**
1. **Database Write Spam Fix** - Immediate
2. **State Management Restructure** - Day 1-2
3. **Conversation Loading Optimization** - Day 2-3
4. **Basic Chat Persistence** - Day 3-5

### **⚡ HIGH PRIORITY (Week 1-2) - Core Features**
1. **Screenshot Gallery System** - Week 1
2. **Context Menu & UI Enhancement** - Week 2
3. **"Everything Else" Default Tab** - Week 2
4. **Basic Game Detection** - Week 2

### **🎯 MEDIUM PRIORITY (Week 2-3) - Advanced Features**
1. **Enhanced AI Service** - Week 2-3
2. **WebSocket Integration** - Week 3
3. **Feedback System** - Week 3
4. **Credit/Usage Tracking** - Week 3

### **✨ NICE TO HAVE (Week 3-4) - Polish**
1. **Hands-Free TTS System** - Week 3-4
2. **Advanced Game Insights** - Week 4
3. **Performance Optimization** - Week 4
4. **Testing & Bug Fixes** - Week 4

---

## **📊 Success Metrics**

### **🎯 Performance Targets**
- **Database writes**: < 10 per minute per user
- **App load time**: < 3 seconds
- **Message send time**: < 500ms
- **Screenshot processing**: < 2 seconds
- **Memory usage**: < 100MB per tab

### **🎮 Feature Completeness**
- [ ] All old build features recreated
- [ ] Chat persistence works 100% reliably
- [ ] Game detection accuracy > 85%
- [ ] WebSocket connection success rate > 95%
- [ ] Cross-device sync works seamlessly

### **👥 User Experience**
- [ ] No user intervention required for persistence
- [ ] Smooth animations and transitions
- [ ] Responsive design on all devices
- [ ] Accessibility compliance
- [ ] Offline functionality works

### **🔧 Technical Excellence**
- [ ] No console errors in production
- [ ] Comprehensive error handling
- [ ] Automated testing coverage > 80%
- [ ] Code maintainability score > 8/10
- [ ] Performance budget compliance

---

## **🎯 Next Steps**

1. **Start with Phase 0** - Fix critical scalability issues immediately
2. **Parallel development** - UI components can be built while backend is being fixed
3. **Incremental testing** - Test each phase thoroughly before moving to next
4. **User feedback integration** - Get feedback early and often
5. **Performance monitoring** - Track metrics throughout development

This master plan provides a comprehensive roadmap that addresses both the feature recreation needs and the critical scalability issues. The phased approach ensures we fix the foundation before building advanced features, while the parallel development strategy maximizes efficiency.

**Ready to start with Phase 0 (Critical Scalability Fixes)?**



