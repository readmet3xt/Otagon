# 🚀 OTAKON COMPREHENSIVE REBUILD BLUEPRINT

**Generated**: January 16, 2025  
**Status**: COMPLETE REBUILD STRATEGY  
**Purpose**: Clean rebuild from scratch with lessons learned  

---

## 🎯 **EXECUTIVE SUMMARY**

Your Otakon app has become **EXTREMELY OVER-ENGINEERED** with 97+ services for what should be a simple chat application. This document provides a complete blueprint for rebuilding it cleanly while preserving all functionality.

### **Current State Analysis**
- **97 services** for a simple chat app (should be ~8)
- **Multiple conflicting auth systems** (4+ implementations)
- **Database chaos** with 5+ conflicting SQL schemas
- **Performance issues** from service proliferation
- **Security vulnerabilities** in database functions
- **Memory leaks** and race conditions

### **Rebuild Strategy**
1. **Phase 1**: UI-First rebuild (preserve existing components)
2. **Phase 2**: Clean backend integration (8 services max)
3. **Phase 3**: AI & advanced features (incremental)

---

## 📋 **CURRENT APP FEATURES & FUNCTIONALITY**

### **🎮 Core Product Vision**
Otakon is a spoiler-free gaming companion app that provides instant, contextual hints and insights for video games using AI to analyze screenshots and provide helpful guidance without ruining the gaming experience.

### **👥 User Types & Access Modes**

#### **Authenticated Users (Subscription-Bound)**
- **Free Tier**: Limited features and quotas
  - No Insights subtabs
  - No hands-free mode
  - No batch screenshots
  - No AI-generated tasks in Otaku Diary
  - No Command Center to modify tabs
  - No Grounding Search (internet search)
  - Limited API calls (55 text, 25 images per month)

- **Pro Tier (Monthly)**: Full feature set
  - All features enabled
  - Higher API limits (1000 text, 100 images per month)
  - Grounding search enabled
  - Hands-free mode
  - Batch screenshots
  - AI-generated tasks

- **Vanguard Tier (Annual)**: Same as Pro, annual subscription
  - All Pro features
  - Annual billing discount
  - Priority support

#### **Developer Mode (Password-Only)**
- Can switch between Free/Pro/Vanguard tiers without subscription
- Mirrors user experience of selected tier (except billing)
- Password-based authentication
- Full access to all features for testing

### **🔐 Authentication Flow**

#### **Current Implementation (Multiple Conflicting Systems)**
1. **Landing Page**: Public marketing page with waitlist capture
2. **Login Page**: Multiple auth options
   - Google OAuth
   - Discord OAuth
   - Email (magic link or OTP)
   - Developer mode (password-only)
3. **OAuth Callback**: Complex callback handling with multiple services
4. **Initial Splash**: Loading screen post-auth
5. **Connect to PC Flow**: 6-digit pairing code or skip
6. **Chat Interface**: Main application

#### **Authentication Providers**
- **Google OAuth**: `signInWithOAuth({ provider: 'google' })`
- **Discord OAuth**: `signInWithOAuth({ provider: 'discord' })`
- **Email**: Magic link or OTP via Supabase
- **Developer Mode**: Password-based with hardcoded passwords

### **💬 Chat Architecture**

#### **Core Chat Features**
- **Real-time messaging** with Supabase
- **Screenshot analysis** via Gemini AI
- **Conversation persistence** across sessions
- **Context-aware responses** based on game
- **Markdown rendering** for AI responses
- **Image upload** and compression
- **Voice commands** (hands-free mode)

#### **Chat Components**
- `MainViewContainer`: Main chat interface
- `ChatMessage`: Individual message rendering
- `ChatInput`: Message input with image upload
- `SuggestedPrompts`: Context-aware suggestions
- `ActionButtons`: Quick action buttons

#### **Conversation Management**
- **Multiple conversations** per user
- **Game-specific context** maintained
- **Message history** persistence
- **Real-time updates** via Supabase subscriptions

### **🤖 AI Integration (Gemini)**

#### **Current AI Models**
- **Gemini 2.5 Pro**: Primary model for complex tasks
- **Gemini 2.5 Flash**: Fast model for simple tasks
- **Model Selection**: Automatic based on query complexity

#### **AI Features**
- **Screenshot Analysis**: Image + text analysis
- **Context-Aware Responses**: Game-specific knowledge
- **Structured Responses**: Headers, bullet points, no long paragraphs
- **Grounding Search**: Internet search (Pro/Vanguard only)
- **Insight Generation**: Proactive game insights
- **Voice Responses**: TTS for hands-free mode

#### **AI Personas**
1. **Screenshot Analyst**: Analyzes game screenshots
2. **Game Companion**: Provides game-specific help
3. **General Assistant**: Handles non-gaming queries

### **🖥️ PC Client Integration**

#### **WebSocket Connection**
- **Server**: `wss://otakon-relay.onrender.com`
- **Pairing**: 6-digit code system
- **Auto-reconnection**: With exponential backoff
- **Heartbeat**: 90-second intervals

#### **PC Client Features**
- **Screenshot Capture**: F1 for single, F2 for batch
- **Real-time Sync**: Instant screenshot transmission
- **Hotkey System**: Customizable hotkeys
- **Image Compression**: WebP format with base64 encoding

#### **Connection Flow**
1. PC client generates 6-digit code
2. User enters code in mobile app
3. WebSocket connection established
4. Real-time screenshot transmission enabled

### **📱 UI Components & Structure**

#### **Main Components**
- `App.tsx`: Main application container (2375 lines!)
- `MainViewContainer`: Chat interface
- `ConversationTabs`: Game conversation tabs
- `SubTabs`: Feature tabs (Chat, Diary, Story, Lore, Build)
- `ScreenshotButton`: Image upload button
- `ChatInput`: Message input
- `SettingsModal`: App settings and preferences

#### **Splash Screens**
- `LoginSplashScreen`: Authentication options
- `InitialSplashScreen`: Post-auth loading
- `HowToUseSplashScreen`: Tutorial screens
- `ProFeaturesSplashScreen`: Feature showcase
- `UpgradeSplashScreen`: Tier upgrade prompts

#### **Modals & Overlays**
- `ConnectionModal`: PC client connection
- `HandsFreeModal`: Voice mode settings
- `SettingsModal`: App configuration
- `FeedbackModal`: User feedback
- `PlayerProfileSetupModal`: Profile creation
- `OtakuDiaryModal`: Gaming diary
- `WishlistModal`: Game wishlist

#### **UI Features**
- **Responsive Design**: Mobile-first approach
- **PWA Support**: Offline capability, app installation
- **Dark Theme**: Gaming-optimized dark UI
- **Touch Gestures**: Swipe navigation
- **Loading States**: Comprehensive loading indicators

### **🗄️ Database Schema**

#### **Current Database Issues**
- **5+ conflicting SQL files** with different schemas
- **52 tables** (reduced from original 100+)
- **Conflicting function signatures**
- **No single source of truth**

#### **Core Tables (Actually Used)**
- `users`: User data and authentication
- `conversations`: Chat history
- `games`: Game data and metadata
- `analytics`: Usage tracking
- `waitlist`: User registration
- `app_level`: App configuration
- `game_activities`: Game activity tracking
- `insight_tabs`: AI insight data
- `user_feedback`: User feedback
- `api_calls`: API call tracking

#### **Database Functions**
- `save_conversation` / `load_conversations`
- `save_wishlist` / `load_wishlist`
- `get_complete_user_data`
- `mark_first_run_completed`
- `update_welcome_message_shown`

### **⚡ Performance Features**

#### **Caching System**
- **Local Storage**: Developer mode data
- **Supabase Cache**: Authenticated user data
- **Content Cache**: AI responses and insights
- **Image Cache**: Compressed screenshots

#### **Optimization Features**
- **Code Splitting**: By functionality
- **Tree Shaking**: Remove unused code
- **Bundle Optimization**: Vendor chunk separation
- **Service Worker**: Offline support

---

## 🚨 **WHAT WENT WRONG - ROOT CAUSE ANALYSIS**

### **1. 🔴 CRITICAL - SERVICE PROLIFERATION**

#### **The Problem**
- **97 services** for a simple chat app
- **Reality**: Should be ~8 services maximum
- **Impact**: Maintenance nightmare, debugging complexity, performance issues

#### **Evidence of Over-Engineering**
```
services/
├── advancedCacheService.ts
├── atomicConversationService.ts
├── authStateManager.ts
├── authTypes.ts
├── characterDetectionService.ts
├── comprehensivePersistenceService.ts
├── contextManagementService.ts
├── contextSummarizationService.ts
├── dailyEngagementService.ts
├── dailyNewsCacheService.ts
├── databaseService.ts
├── developerModeDataService.ts
├── devModeMigrationService.ts
├── enhancedErrorHandlingService.ts
├── enhancedInsightService.ts
├── errorRecoveryService.ts
├── feedbackAnalyticsService.ts
├── feedbackLearningEngine.ts
├── feedbackSecurityService.ts
├── feedbackService.ts
├── fixedAppStateService.ts
├── fixedAuthService.ts
├── fixedErrorHandlingService.ts
├── gameAnalyticsService.ts
├── gameContextService.ts
├── gameProgressService.ts
├── geminiService.ts
├── handsFreeService.ts
├── imageProcessingService.ts
├── insightGenerationService.ts
├── longTermMemoryService.ts
├── notificationService.ts
├── otakuDiaryService.ts
├── playerProfileService.ts
├── proactiveInsightService.ts
├── profileAwareInsightService.ts
├── progressTrackingService.ts
├── secureAppStateService.ts
├── secureConversationService.ts
├── sessionRefreshService.ts
├── smartNotificationService.ts
├── structuredResponseService.ts
├── supabase.ts
├── supabaseDataService.ts
├── tierService.ts
├── unifiedAIService.ts
├── unifiedOAuthService.ts
├── unifiedUsageService.ts
├── usageService.ts
├── websocketService.ts
└── wishlistService.ts
```

#### **Root Cause**
- **Feature Creep**: Added services for every small feature
- **No Architecture Review**: No one questioned service proliferation
- **Copy-Paste Development**: Created new services instead of extending existing ones
- **No Service Consolidation**: Never refactored to combine similar services

### **2. 🔐 AUTHENTICATION CHAOS**

#### **Multiple Conflicting Auth Services**
- `authService` (in supabase.ts)
- `fixedAuthService.ts`
- `secureAuthService` (in supabase.ts)
- `authStateManager.ts`
- `unifiedOAuthService.ts`
- `sessionRefreshService.ts`

#### **The Problem**
- **4+ different authentication implementations**
- **Conflicting logic** between services
- **Race conditions** in auth state management
- **Developer mode** implemented 3 different ways

#### **Root Cause**
- **Multiple Attempts**: Each auth issue created a new service
- **No Cleanup**: Old services never removed
- **Conflicting Approaches**: Different developers used different patterns
- **No Single Source of Truth**: No clear auth service to use

### **3. 💾 DATABASE CONFUSION**

#### **Multiple Conflicting SQL Files**
- `SYSTEMATIC_MASTER_SQL.sql` (1943 lines)
- `CLEAN_MASTER_SQL_SINGLE_FUNCTIONS.sql` (880 lines)
- `FINAL_WORKING_DATABASE_FUNCTIONS.sql` (321 lines)
- `CRITICAL_DATABASE_FIXES_V3_OPTIMIZED.sql` (191 lines)
- `CONVERSATION_PERSISTENCE_FIX.sql` (422 lines)

#### **The Problem**
- **Conflicting function signatures**
- **Different user ID mapping strategies**
- **Multiple attempts** to fix the same issues
- **No single source of truth**

#### **Root Cause**
- **Iterative Fixes**: Each issue created a new SQL file
- **No Migration Strategy**: No proper database versioning
- **Copy-Paste SQL**: Duplicated functions with slight variations
- **No Testing**: SQL changes not properly tested

### **4. 🐌 PERFORMANCE ISSUES**

#### **Sequential Operations**
```typescript
// Current (SLOW) - Sequential awaits
const baseInstruction = await this.getSystemInstruction(conversation, hasImages);
const completedTasksContext = await this.getCompletedTasksContext(conversation.id);
const gameContext = await this.getGameContext(conversation.gameId);
```

#### **Race Conditions**
- Multiple auth state change listeners
- Duplicate conversation creation effects
- Concurrent database operations without proper locking

#### **Memory Leaks**
- Services not properly cleaned up
- Event listeners not removed
- WebSocket connections not closed
- Cache not cleared on logout

### **5. 🔒 SECURITY VULNERABILITIES**

#### **Database Security Issues**
```sql
-- VULNERABLE: Functions with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.save_conversation(...)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- ⚠️ PRIVILEGE ESCALATION RISK
SET search_path = ''
```

#### **Hardcoded Passwords**
```typescript
// services/supabase.ts - Hardcoded passwords
private readonly DEV_PASSWORDS = [
  'zircon123',           // ⚠️ HARDCODED PASSWORD
  'otakon-dev-2024',     // ⚠️ HARDCODED PASSWORD
  'dev-mode-secure'      // ⚠️ HARDCODED PASSWORD
];
```

#### **Problems Identified**
- **32 functions** with mutable search paths (SQL injection risk)
- **SECURITY DEFINER** functions without proper validation
- **No input validation** on JSONB fields
- **SQL injection potential** in dynamic queries

---

## 🚀 **REBUILD STRATEGY - PHASE-BY-PHASE APPROACH**

### **Phase 1: UI-First Rebuild (Start Here)**

#### **Goal**: Preserve existing UI, create clean architecture
#### **Timeline**: 1-2 weeks
#### **Approach**: Keep UI components, rebuild backend services

#### **What to Keep**
- All existing UI components (they're well-designed)
- Component structure and styling
- User experience flow
- PWA functionality

#### **What to Rebuild**
- Service layer (97 → 8 services)
- State management (simplify)
- Authentication flow (single service)
- Database integration (clean schema)

#### **New Service Architecture (8 Services Max)**
```
services/
├── auth.ts           # Single auth service (replaces 6 auth services)
├── database.ts       # Single database service (replaces 10+ services)
├── chat.ts          # Chat management (replaces 5+ services)
├── ai.ts            # Gemini integration (replaces 3+ services)
├── websocket.ts     # PC client connection (replaces 2+ services)
├── storage.ts       # Data persistence (replaces 4+ services)
├── tier.ts          # User tier management (replaces 3+ services)
└── dev.ts           # Developer mode (replaces 2+ services)
```

### **Phase 2: Backend Integration**

#### **Goal**: Connect UI to clean backend
#### **Timeline**: 1-2 weeks
#### **Approach**: One service at a time, test thoroughly

#### **Integration Order**
1. **Authentication Service**: Login/logout functionality
2. **Database Service**: Data persistence
3. **Chat Service**: Message handling
4. **AI Service**: Gemini integration
5. **WebSocket Service**: PC client connection
6. **Storage Service**: Local data management
7. **Tier Service**: User tier management
8. **Dev Service**: Developer mode

### **Phase 3: AI & Advanced Features**

#### **Goal**: Add advanced features incrementally
#### **Timeline**: 2-3 weeks
#### **Approach**: Feature by feature, test each one

#### **Feature Implementation Order**
1. **Basic AI**: Text-only Gemini integration
2. **Image Analysis**: Screenshot analysis
3. **Context Management**: Game-specific context
4. **Insights Generation**: Proactive insights
5. **Voice Features**: Hands-free mode
6. **Advanced Caching**: Performance optimization

---

## 🏗️ **CLEAN ARCHITECTURE DESIGN**

### **Core Principles**

#### **1. Single Responsibility**
- Each service has ONE job
- No overlapping functionality
- Clear boundaries between services

#### **2. Dependency Injection**
- Services don't import each other directly
- Use dependency injection for service communication
- Easy to test and mock

#### **3. Error Boundaries**
- Each service handles its own errors
- Graceful degradation when services fail
- User-friendly error messages

#### **4. Performance First**
- Parallel operations where possible
- Efficient caching strategies
- Minimal re-renders

### **Service Design Patterns**

#### **Auth Service**
```typescript
class AuthService {
  // Single source of truth for authentication
  async signIn(provider: 'google' | 'discord' | 'email' | 'dev', credentials?: any)
  async signOut()
  async getCurrentUser()
  async isAuthenticated()
  async isDeveloperMode()
}
```

#### **Database Service**
```typescript
class DatabaseService {
  // Single source of truth for data
  async saveConversation(conversation: Conversation)
  async loadConversations(userId: string)
  async saveUser(user: User)
  async loadUser(userId: string)
  async saveGame(game: Game)
  async loadGames(userId: string)
}
```

#### **AI Service**
```typescript
class AIService {
  // Single source of truth for AI
  async sendMessage(message: string, context: GameContext)
  async analyzeImage(image: string, context: GameContext)
  async generateInsights(game: Game, progress: Progress)
  async getModelForTask(task: 'chat' | 'image' | 'insight')
}
```

### **State Management**

#### **Single State Store**
```typescript
interface AppState {
  // Authentication
  user: User | null
  isAuthenticated: boolean
  isDeveloperMode: boolean
  
  // Chat
  conversations: Record<string, Conversation>
  activeConversationId: string | null
  
  // UI
  view: 'landing' | 'app'
  onboardingStatus: OnboardingStatus
  modals: ModalState
  
  // Connection
  connectionStatus: ConnectionStatus
  connectionCode: string | null
}
```

#### **State Updates**
- **Single source of truth**: One state store
- **Immutable updates**: Use immer or similar
- **Predictable changes**: Clear action types
- **Easy debugging**: State changes are logged

---

## 🔧 **TECHNICAL IMPLEMENTATION DETAILS**

### **Authentication Flow (Simplified)**

#### **Single Auth Service**
```typescript
class AuthService {
  private static instance: AuthService
  private supabase: SupabaseClient
  private currentUser: User | null = null
  
  async signIn(provider: AuthProvider, credentials?: any): Promise<AuthResult> {
    switch (provider) {
      case 'google':
        return this.signInWithGoogle()
      case 'discord':
        return this.signInWithDiscord()
      case 'email':
        return this.signInWithEmail(credentials)
      case 'dev':
        return this.signInWithDeveloper(credentials)
    }
  }
  
  private async signInWithGoogle(): Promise<AuthResult> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  }
  
  private async signInWithDeveloper(password: string): Promise<AuthResult> {
    // Simple password check for developer mode
    const validPasswords = ['dev123', 'otakon-dev']
    
    if (!validPasswords.includes(password)) {
      return { success: false, error: 'Invalid developer password' }
    }
    
    // Set developer mode flags
    localStorage.setItem('otakon_developer_mode', 'true')
    localStorage.setItem('otakon_auth_method', 'developer')
    
    // Create mock user
    this.currentUser = {
      id: 'dev-user',
      email: 'developer@otakon.app',
      tier: 'vanguard_pro',
      isDeveloper: true
    }
    
    return { success: true }
  }
}
```

### **Database Schema (Simplified)**

#### **Single SQL File**
```sql
-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  tier text DEFAULT 'free',
  is_developer boolean DEFAULT false,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversations table
CREATE TABLE conversations (
  id text PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  game_id text,
  title text,
  messages jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Games table
CREATE TABLE games (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  genre text,
  platform text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can access own data" ON users
  FOR ALL USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can access own conversations" ON conversations
  FOR ALL USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));
```

### **AI Integration (Simplified)**

#### **Single AI Service**
```typescript
class AIService {
  private static instance: AIService
  private gemini: GoogleGenAI
  private chatSessions: Map<string, Chat> = new Map()
  
  async sendMessage(
    message: string,
    conversationId: string,
    hasImages: boolean = false,
    images?: string[]
  ): Promise<AIResponse> {
    try {
      // Get or create chat session
      const chat = await this.getOrCreateChat(conversationId, hasImages)
      
      // Prepare message content
      const content = this.prepareMessageContent(message, images)
      
      // Send to Gemini
      const result = await chat.sendMessageStream({
        contents: content
      })
      
      // Process streaming response
      return this.processStreamingResponse(result)
      
    } catch (error) {
      console.error('AI Service Error:', error)
      throw new Error('Failed to send message to AI')
    }
  }
  
  private async getOrCreateChat(conversationId: string, hasImages: boolean): Promise<Chat> {
    if (this.chatSessions.has(conversationId)) {
      return this.chatSessions.get(conversationId)!
    }
    
    // Select appropriate model
    const model = hasImages ? 'gemini-2.5-pro' : 'gemini-2.5-flash'
    
    // Create new chat session
    const chat = this.gemini.chats.create({
      model,
      config: {
        systemInstruction: this.getSystemInstruction(hasImages),
        tools: this.getToolsForTier()
      }
    })
    
    this.chatSessions.set(conversationId, chat)
    return chat
  }
  
  private getToolsForTier(): any[] {
    // Check user tier for grounding search
    const userTier = this.getCurrentUserTier()
    
    if (userTier === 'pro' || userTier === 'vanguard_pro') {
      return [{ googleSearch: {} }]
    }
    
    return []
  }
}
```

### **WebSocket Integration (Simplified)**

#### **Single WebSocket Service**
```typescript
class WebSocketService {
  private static instance: WebSocketService
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  
  async connect(code: string): Promise<ConnectionResult> {
    return new Promise((resolve, reject) => {
      try {
        const url = `wss://otakon-relay.onrender.com/${code}`
        this.ws = new WebSocket(url)
        
        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve({ success: true })
        }
        
        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data))
        }
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject({ success: false, error: 'Connection failed' })
        }
        
        this.ws.onclose = () => {
          this.handleReconnect(code)
        }
        
      } catch (error) {
        reject({ success: false, error: 'Failed to create connection' })
      }
    })
  }
  
  private handleReconnect(code: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        this.connect(code)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }
  
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
```

---

## 📊 **PERFORMANCE OPTIMIZATION STRATEGIES**

### **1. Parallel Operations**
```typescript
// Instead of sequential awaits
const baseInstruction = await this.getSystemInstruction(conversation, hasImages);
const completedTasksContext = await this.getCompletedTasksContext(conversation.id);
const gameContext = await this.getGameContext(conversation.gameId);

// Use parallel operations
const [baseInstruction, completedTasksContext, gameContext] = await Promise.all([
  this.getSystemInstruction(conversation, hasImages),
  this.getCompletedTasksContext(conversation.id),
  this.getGameContext(conversation.gameId)
]);
```

### **2. Efficient Caching**
```typescript
class CacheService {
  private cache = new Map<string, { data: any, expires: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes
  
  set(key: string, data: any, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    })
  }
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
}
```

### **3. Memory Management**
```typescript
class ServiceManager {
  private services = new Map<string, any>()
  
  register<T>(name: string, service: T): T {
    this.services.set(name, service)
    return service
  }
  
  get<T>(name: string): T {
    return this.services.get(name)
  }
  
  cleanup() {
    // Clean up all services
    for (const [name, service] of this.services) {
      if (service.cleanup) {
        service.cleanup()
      }
    }
    this.services.clear()
  }
}
```

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**
- Test each service independently
- Mock dependencies
- Test error handling
- Test edge cases

### **Integration Tests**
- Test service interactions
- Test database operations
- Test AI integration
- Test WebSocket connection

### **E2E Tests**
- Test complete user flows
- Test authentication
- Test chat functionality
- Test PC client connection

### **Performance Tests**
- Test with large datasets
- Test concurrent users
- Test memory usage
- Test response times

---

## 📈 **MONITORING & ANALYTICS**

### **Error Tracking**
- Log all errors with context
- Track error frequency
- Monitor error trends
- Alert on critical errors

### **Performance Monitoring**
- Track response times
- Monitor memory usage
- Track API call costs
- Monitor user engagement

### **User Analytics**
- Track feature usage
- Monitor user retention
- Track conversion rates
- Monitor user feedback

---

## 🚀 **DEPLOYMENT STRATEGY**

### **Environment Setup**
- **Development**: Local development with mock services
- **Staging**: Full integration testing
- **Production**: Live environment with monitoring

### **Database Migration**
- Create new clean schema
- Migrate existing data
- Test thoroughly
- Rollback plan ready

### **Service Deployment**
- Deploy services incrementally
- Test each service independently
- Monitor for issues
- Rollback if needed

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: UI-First Rebuild**
- [ ] Create new project structure
- [ ] Copy existing UI components
- [ ] Set up basic routing
- [ ] Create service interfaces
- [ ] Implement basic state management
- [ ] Test UI functionality

### **Phase 2: Backend Integration**
- [ ] Implement Auth Service
- [ ] Implement Database Service
- [ ] Implement Chat Service
- [ ] Implement AI Service
- [ ] Implement WebSocket Service
- [ ] Implement Storage Service
- [ ] Implement Tier Service
- [ ] Implement Dev Service
- [ ] Test all integrations

### **Phase 3: Advanced Features**
- [ ] Implement image analysis
- [ ] Implement context management
- [ ] Implement insights generation
- [ ] Implement voice features
- [ ] Implement advanced caching
- [ ] Test all features

### **Phase 4: Optimization**
- [ ] Performance optimization
- [ ] Memory leak fixes
- [ ] Error handling improvements
- [ ] User experience enhancements
- [ ] Final testing

---

## 🎯 **SUCCESS METRICS**

### **Technical Metrics**
- **Service Count**: 97 → 8 services
- **Bundle Size**: Reduce by 50%
- **Load Time**: < 2 seconds
- **Memory Usage**: < 100MB
- **Error Rate**: < 1%

### **User Experience Metrics**
- **Login Success Rate**: > 99%
- **Chat Response Time**: < 3 seconds
- **Image Analysis Time**: < 5 seconds
- **User Satisfaction**: > 4.5/5

### **Development Metrics**
- **Code Maintainability**: High
- **Test Coverage**: > 90%
- **Documentation**: Complete
- **Developer Onboarding**: < 1 day

---

## 🔮 **FUTURE ENHANCEMENTS**

### **Short Term (1-3 months)**
- Advanced AI features
- Better mobile experience
- Performance optimizations
- User feedback integration

### **Medium Term (3-6 months)**
- Multi-language support
- Advanced analytics
- Team collaboration features
- API for third-party integrations

### **Long Term (6+ months)**
- Machine learning improvements
- Advanced game integration
- Social features
- Enterprise features

---

## 📚 **RESOURCES & REFERENCES**

### **Documentation**
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### **Tools & Libraries**
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase, Google Gemini AI
- **WebSocket**: Native WebSocket API
- **Testing**: Vitest, React Testing Library
- **Deployment**: Vercel, Supabase

### **Best Practices**
- **Clean Architecture**: Single responsibility, dependency injection
- **Performance**: Parallel operations, efficient caching
- **Security**: Input validation, secure authentication
- **Testing**: Unit, integration, and E2E tests
- **Monitoring**: Error tracking, performance monitoring

---

## 🎉 **CONCLUSION**

This comprehensive rebuild blueprint provides a clear path forward for creating a clean, maintainable, and performant version of your Otakon app. By following this phased approach and learning from the mistakes of the current implementation, you can build a robust gaming companion app that users will love.

The key is to start simple, test thoroughly, and add complexity only when necessary. With this blueprint, you have everything you need to rebuild your app from scratch while preserving all the functionality you've worked hard to create.

**Remember**: The goal is not to recreate the current app exactly, but to create a better, cleaner, more maintainable version that delivers the same value to users with much less complexity.

---

## 🤖 **CURSOR AI IMPLEMENTATION GUIDE**

### **How to Use This Guide with Cursor AI**

This section provides step-by-step instructions for Cursor AI to recreate your Otakon app from scratch. Follow these phases in order, and use the specific prompts provided for each step.

### **Phase 1: Project Setup & Foundation (Week 1)**

#### **Step 1.1: Create New Project Structure**
```
Prompt for Cursor AI:
"Create a new React + TypeScript + Vite project called 'otakon-rebuild' with the following structure:

```
otakon-rebuild/
├── src/
│   ├── components/          # UI components
│   ├── services/           # 8 core services only
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   └── App.tsx             # Main app component
├── public/                 # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

Use React 19, TypeScript 5, Vite 6, and Tailwind CSS. Set up proper TypeScript configuration with strict mode enabled."
```

#### **Step 1.2: Install Dependencies**
```
Prompt for Cursor AI:
"Install the following dependencies for the Otakon rebuild project:

Core Dependencies:
- @supabase/supabase-js
- @google/genai
- react-markdown
- remark-gfm
- react-router-dom
- zustand (for state management)

Dev Dependencies:
- @types/react
- @types/react-dom
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser
- eslint
- prettier
- vitest
- @testing-library/react
- @testing-library/jest-dom

Create a package.json with proper scripts for dev, build, test, and lint."
```

#### **Step 1.3: Create Type Definitions**
```
Prompt for Cursor AI:
"Create comprehensive TypeScript type definitions in src/types/index.ts for the Otakon app:

1. User types (User, UserTier, AuthProvider)
2. Chat types (Conversation, ChatMessage, MessageType)
3. Game types (Game, GameContext, GameProgress)
4. AI types (AIResponse, ModelType, InsightType)
5. UI types (AppState, ModalState, ConnectionStatus)
6. Service types (AuthResult, DatabaseResult, AIResult)

Make sure all types are properly exported and include JSDoc comments for better IntelliSense."
```

### **Phase 2: Core Services Implementation (Week 2)**

#### **Step 2.1: Create Auth Service**
```
Prompt for Cursor AI:
"Create a single, clean AuthService in src/services/auth.ts that handles:

1. Google OAuth authentication
2. Discord OAuth authentication  
3. Email authentication (magic link)
4. Developer mode authentication (password-based)
5. Session management
6. User state management

Requirements:
- Use Supabase for OAuth providers
- Implement proper error handling
- Include TypeScript types
- Add JSDoc comments
- Use singleton pattern
- Handle developer mode with localStorage
- Include proper cleanup methods

The service should replace all 6 existing auth services with a single, clean implementation."
```

#### **Step 2.2: Create Database Service**
```
Prompt for Cursor AI:
"Create a single DatabaseService in src/services/database.ts that handles:

1. User data operations (create, read, update, delete)
2. Conversation management (save, load, update)
3. Game data operations
4. Analytics tracking
5. Waitlist management

Requirements:
- Use Supabase client
- Implement proper error handling
- Include TypeScript types
- Add JSDoc comments
- Use singleton pattern
- Handle both authenticated and developer mode
- Include proper cleanup methods

The service should replace all 10+ existing database services with a single, clean implementation."
```

#### **Step 2.3: Create AI Service**
```
Prompt for Cursor AI:
"Create a single AIService in src/services/ai.ts that handles:

1. Gemini 2.5 Pro integration for complex tasks
2. Gemini 2.5 Flash integration for simple tasks
3. Image analysis and screenshot processing
4. Context-aware responses
5. Insight generation
6. Model selection based on task type
7. Tier-based feature access (grounding search for Pro/Vanguard)

Requirements:
- Use @google/genai package
- Implement proper error handling
- Include TypeScript types
- Add JSDoc comments
- Use singleton pattern
- Handle streaming responses
- Include proper cleanup methods
- Support both text and image inputs

The service should replace all 3+ existing AI services with a single, clean implementation."
```

#### **Step 2.4: Create WebSocket Service**
```
Prompt for Cursor AI:
"Create a single WebSocketService in src/services/websocket.ts that handles:

1. PC client connection via WebSocket
2. 6-digit pairing code system
3. Real-time screenshot transmission
4. Auto-reconnection with exponential backoff
5. Heartbeat mechanism
6. Message queuing

Requirements:
- Use native WebSocket API
- Implement proper error handling
- Include TypeScript types
- Add JSDoc comments
- Use singleton pattern
- Handle connection states
- Include proper cleanup methods
- Support message queuing during disconnection

The service should replace all 2+ existing WebSocket services with a single, clean implementation."
```

#### **Step 2.5: Create Remaining Services**
```
Prompt for Cursor AI:
"Create the remaining 4 core services:

1. ChatService (src/services/chat.ts) - Message handling, conversation management
2. StorageService (src/services/storage.ts) - Local storage, caching, data persistence
3. TierService (src/services/tier.ts) - User tier management, usage tracking
4. DevService (src/services/dev.ts) - Developer mode functionality

Each service should:
- Use singleton pattern
- Include proper error handling
- Have TypeScript types
- Include JSDoc comments
- Handle cleanup properly
- Be focused on a single responsibility

These 4 services plus the previous 4 should be the ONLY services in the project (8 total)."
```

### **Phase 3: State Management & Hooks (Week 2-3)**

#### **Step 3.1: Create State Management**
```
Prompt for Cursor AI:
"Create a clean state management system using Zustand in src/store/appStore.ts:

1. Single AppState interface with all necessary state
2. Actions for state updates
3. Selectors for computed values
4. Persistence for important state
5. DevTools integration

State should include:
- Authentication state (user, isAuthenticated, isDeveloperMode)
- Chat state (conversations, activeConversationId)
- UI state (view, modals, loading states)
- Connection state (status, code, error)

Make it simple, predictable, and easy to debug."
```

#### **Step 3.2: Create Custom Hooks**
```
Prompt for Cursor AI:
"Create custom React hooks in src/hooks/:

1. useAuth() - Authentication state and methods
2. useChat() - Chat functionality and state
3. useConnection() - WebSocket connection management
4. useAI() - AI service integration
5. useTier() - User tier and usage tracking
6. useStorage() - Local storage management

Each hook should:
- Use the Zustand store
- Provide clean API for components
- Handle loading and error states
- Include proper TypeScript types
- Be well-documented with JSDoc

These hooks should be the primary way components interact with services."
```

### **Phase 4: UI Components (Week 3-4)**

#### **Step 4.1: Create Core UI Components**
```
Prompt for Cursor AI:
"Create the core UI components based on the existing Otakon app:

1. App.tsx - Main application container (simplified from 2375 lines)
2. MainViewContainer.tsx - Chat interface
3. ChatMessage.tsx - Individual message rendering
4. ChatInput.tsx - Message input with image upload
5. ConversationTabs.tsx - Game conversation tabs
6. SubTabs.tsx - Feature tabs (Chat, Diary, Story, Lore, Build)

Requirements:
- Use existing design patterns from the current app
- Implement responsive design with Tailwind CSS
- Include proper TypeScript types
- Add loading and error states
- Use the custom hooks created earlier
- Keep components focused and reusable
- Include proper accessibility features"
```

#### **Step 4.2: Create Modal Components**
```
Prompt for Cursor AI:
"Create modal components for the Otakon app:

1. LoginSplashScreen.tsx - Authentication options
2. ConnectionModal.tsx - PC client connection
3. SettingsModal.tsx - App settings and preferences
4. FeedbackModal.tsx - User feedback
5. PlayerProfileSetupModal.tsx - Profile creation
6. HandsFreeModal.tsx - Voice mode settings

Requirements:
- Use existing design patterns
- Implement proper modal management
- Include proper TypeScript types
- Add loading and error states
- Use the custom hooks created earlier
- Include proper accessibility features
- Handle keyboard navigation"
```

#### **Step 4.3: Create Utility Components**
```
Prompt for Cursor AI:
"Create utility components for the Otakon app:

1. LoadingSpinner.tsx - Loading states
2. ErrorMessage.tsx - Error display
3. Button.tsx - Reusable button component
4. Input.tsx - Reusable input component
5. Modal.tsx - Base modal component
6. Toast.tsx - Notification system

Requirements:
- Use Tailwind CSS for styling
- Include proper TypeScript types
- Add proper accessibility features
- Make components reusable and configurable
- Include proper loading and error states
- Follow existing design patterns"
```

### **Phase 5: Integration & Testing (Week 4-5)**

#### **Step 5.1: Integrate Services with UI**
```
Prompt for Cursor AI:
"Integrate all services with the UI components:

1. Connect AuthService to login components
2. Connect DatabaseService to data persistence
3. Connect ChatService to chat components
4. Connect AIService to message handling
5. Connect WebSocketService to PC client features
6. Connect TierService to usage tracking
7. Connect StorageService to local data
8. Connect DevService to developer features

Requirements:
- Use the custom hooks created earlier
- Handle loading and error states properly
- Implement proper error boundaries
- Add proper TypeScript types
- Test all integrations thoroughly
- Handle edge cases gracefully"
```

#### **Step 5.2: Create Test Suite**
```
Prompt for Cursor AI:
"Create a comprehensive test suite using Vitest and React Testing Library:

1. Unit tests for all services
2. Integration tests for service interactions
3. Component tests for UI components
4. E2E tests for critical user flows
5. Performance tests for optimization

Requirements:
- Test coverage > 90%
- Mock external dependencies properly
- Test error handling scenarios
- Test loading states
- Test user interactions
- Include accessibility tests
- Test responsive design"
```

### **Phase 6: Optimization & Polish (Week 5-6)**

#### **Step 6.1: Performance Optimization**
```
Prompt for Cursor AI:
"Optimize the app for performance:

1. Implement code splitting
2. Add lazy loading for components
3. Optimize bundle size
4. Implement efficient caching
5. Add memory leak prevention
6. Optimize re-renders
7. Add performance monitoring

Requirements:
- Bundle size < 2MB
- Load time < 2 seconds
- Memory usage < 100MB
- 60fps animations
- Proper cleanup on unmount
- Efficient state updates"
```

#### **Step 6.2: Error Handling & Monitoring**
```
Prompt for Cursor AI:
"Implement comprehensive error handling and monitoring:

1. Global error boundary
2. Service-level error handling
3. User-friendly error messages
4. Error logging and tracking
5. Performance monitoring
6. User analytics
7. Crash reporting

Requirements:
- Graceful error recovery
- User-friendly error messages
- Proper error logging
- Performance metrics
- User behavior tracking
- Crash reporting
- Error rate < 1%"
```

### **Phase 7: Final Testing & Deployment (Week 6)**

#### **Step 7.1: Final Testing**
```
Prompt for Cursor AI:
"Perform final testing and quality assurance:

1. Test all user flows
2. Test error scenarios
3. Test performance under load
4. Test accessibility
5. Test responsive design
6. Test cross-browser compatibility
7. Test mobile devices

Requirements:
- All tests passing
- No console errors
- Performance targets met
- Accessibility compliance
- Cross-browser compatibility
- Mobile responsiveness
- User experience validation"
```

#### **Step 7.2: Deployment Preparation**
```
Prompt for Cursor AI:
"Prepare the app for deployment:

1. Create production build
2. Optimize assets
3. Set up environment variables
4. Configure deployment scripts
5. Set up monitoring
6. Create deployment documentation
7. Set up CI/CD pipeline

Requirements:
- Production-ready build
- Environment configuration
- Deployment scripts
- Monitoring setup
- Documentation complete
- CI/CD pipeline
- Rollback plan ready"
```

### **Implementation Checklist for Cursor AI**

#### **Week 1: Foundation**
- [ ] Create project structure
- [ ] Install dependencies
- [ ] Set up TypeScript configuration
- [ ] Create type definitions
- [ ] Set up development environment

#### **Week 2: Core Services**
- [ ] Implement AuthService
- [ ] Implement DatabaseService
- [ ] Implement AIService
- [ ] Implement WebSocketService
- [ ] Implement ChatService
- [ ] Implement StorageService
- [ ] Implement TierService
- [ ] Implement DevService

#### **Week 3: State & Hooks**
- [ ] Create Zustand store
- [ ] Implement useAuth hook
- [ ] Implement useChat hook
- [ ] Implement useConnection hook
- [ ] Implement useAI hook
- [ ] Implement useTier hook
- [ ] Implement useStorage hook

#### **Week 4: UI Components**
- [ ] Create core UI components
- [ ] Create modal components
- [ ] Create utility components
- [ ] Implement responsive design
- [ ] Add accessibility features
- [ ] Test component functionality

#### **Week 5: Integration**
- [ ] Integrate services with UI
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test all integrations
- [ ] Fix integration issues
- [ ] Optimize performance

#### **Week 6: Testing & Deployment**
- [ ] Create test suite
- [ ] Run comprehensive tests
- [ ] Fix any issues found
- [ ] Optimize final performance
- [ ] Prepare for deployment
- [ ] Deploy to production

### **Success Criteria**

#### **Technical Metrics**
- **Service Count**: 8 services (down from 97)
- **Bundle Size**: < 2MB
- **Load Time**: < 2 seconds
- **Memory Usage**: < 100MB
- **Error Rate**: < 1%
- **Test Coverage**: > 90%

#### **User Experience Metrics**
- **Login Success Rate**: > 99%
- **Chat Response Time**: < 3 seconds
- **Image Analysis Time**: < 5 seconds
- **User Satisfaction**: > 4.5/5
- **Accessibility Score**: > 95%

#### **Development Metrics**
- **Code Maintainability**: High
- **Documentation**: Complete
- **Developer Onboarding**: < 1 day
- **Bug Fix Time**: < 1 hour
- **Feature Addition Time**: < 1 day

### **Common Pitfalls to Avoid**

1. **Don't recreate the 97-service architecture** - Stick to 8 services maximum
2. **Don't skip testing** - Test each service and component thoroughly
3. **Don't ignore error handling** - Implement proper error boundaries
4. **Don't forget accessibility** - Include proper ARIA labels and keyboard navigation
5. **Don't skip performance optimization** - Monitor bundle size and memory usage
6. **Don't hardcode values** - Use environment variables and configuration
7. **Don't skip documentation** - Document all services and components
8. **Don't ignore TypeScript errors** - Fix all type issues before proceeding

### **Cursor AI Best Practices**

1. **Use specific prompts** - Be detailed about what you want
2. **Test incrementally** - Test each change before moving to the next
3. **Review code quality** - Ensure code follows best practices
4. **Ask for explanations** - Understand what the AI is doing
5. **Iterate on feedback** - Refine prompts based on results
6. **Use version control** - Commit changes frequently
7. **Monitor performance** - Keep an eye on bundle size and performance
8. **Document decisions** - Keep track of architectural decisions

---

*Generated: January 16, 2025*  
*Total Services: 97 → 8 (92% reduction)*  
*Estimated Rebuild Time: 4-6 weeks*  
*Expected Performance Improvement: 300%*

VITE_GEMINI_API_KEY=AIzaSyAQPghopyMINAl_sJFwF8HPB19WCrsEDHY

# Supabase Configuration
VITE_SUPABASE_URL=https://qajcxgkqloumogioomiz.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_GoW6G_umt1lFF-KPbbm-Ow_D2PYxPLw

---

## 🔌 **EXTERNAL SERVICE CONNECTIONS & CONFIGURATION**

### **WebSocket Connection Details**

#### **Current WebSocket Server**
- **URL**: `wss://otakon-relay.onrender.com`
- **Protocol**: WebSocket (WSS)
- **Purpose**: Real-time PC client communication
- **Connection Flow**: 6-digit pairing code system

#### **WebSocket Implementation**
```typescript
// Current WebSocket Service Configuration
const SERVER_ADDRESS = 'wss://otakon-relay.onrender.com';
const HEARTBEAT_MS = 90000; // 90 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // 1 second base delay

// Connection URL Pattern
const connectionUrl = `${SERVER_ADDRESS}/${code}`; // code = 6-digit pairing code

// Message Types
interface WebSocketMessage {
  type: 'ping' | 'pong' | 'get_history' | 'partner_connected' | 'partner_disconnected' | 'connection_alive' | 'screenshot' | 'message';
  data?: any;
  timestamp?: number;
}
```

#### **WebSocket Features**
- **Auto-reconnection**: Exponential backoff with jitter
- **Message Queuing**: Queue messages during disconnection
- **Heartbeat**: 90-second ping/pong to maintain connection
- **Error Handling**: Graceful error recovery
- **Connection States**: Connecting, Connected, Disconnected, Error

### **API Keys & External Services**

#### **Google Gemini AI**
- **API Key**: `AIzaSyAQPghopyMINAl_sJFwF8HPB19WCrsEDHY`
- **Models Used**: 
  - `gemini-2.5-pro` (complex tasks, image analysis)
  - `gemini-2.5-flash` (simple tasks, fast responses)
- **Features**: 
  - Text generation
  - Image analysis
  - Function calling (grounding search)
  - Streaming responses

#### **Supabase Configuration**
- **URL**: `https://qajcxgkqloumogioomiz.supabase.co`
- **Anon Key**: `sb_publishable_GoW6G_umt1lFF-KPbbm-Ow_D2PYxPLw`
- **Features**:
  - Authentication (Google, Discord, Email)
  - Database operations
  - Real-time subscriptions
  - Row Level Security (RLS)

### **Otakon Master Prompt System**

#### **Core System Instruction**
```typescript
const OTAKON_MASTER_PROMPT = `
You are Otakon, an AI gaming companion designed to provide spoiler-free hints and insights for video games. Your primary purpose is to help gamers progress through their games without ruining the experience.

## Core Principles:
1. **Spoiler-Free**: Never reveal major plot points, endings, or critical story elements
2. **Context-Aware**: Adapt your responses based on the specific game and current situation
3. **Progressive Hints**: Start with subtle hints and provide more specific guidance if needed
4. **Gaming Focus**: Prioritize gameplay assistance over general conversation
5. **Respect Player Agency**: Guide, don't dictate player choices

## Response Guidelines:
- Use structured formatting with headers, bullet points, and clear sections
- Keep responses concise but informative
- Provide actionable advice when possible
- Ask clarifying questions if the situation is unclear
- Use gaming terminology appropriately
- Maintain an encouraging and helpful tone

## When Analyzing Screenshots:
- Focus on immediate gameplay elements visible
- Identify UI elements, inventory, health, objectives
- Suggest next steps based on what's shown
- Point out important items or interactions
- Avoid assumptions about story progression

## Tier-Based Features:
- **Free Users**: Basic hints and general guidance
- **Pro/Vanguard Users**: Advanced insights, grounding search, detailed analysis
`;
```

#### **Game-Specific Prompts**

##### **RPG Games**
```typescript
const RPG_PROMPT = `
For RPG games, focus on:
- Character builds and stat optimization
- Quest progression and objectives
- Inventory management and item usage
- Combat strategies and tactics
- Exploration and discovery
- Skill trees and progression paths
`;
```

##### **Action Games**
```typescript
const ACTION_PROMPT = `
For action games, focus on:
- Combat mechanics and timing
- Movement and positioning
- Resource management (health, ammo, abilities)
- Boss fight strategies
- Environmental interactions
- Skill-based challenges
`;
```

##### **Puzzle Games**
```typescript
const PUZZLE_PROMPT = `
For puzzle games, focus on:
- Logic and pattern recognition
- Step-by-step solution guidance
- Hint progression (subtle to specific)
- Environmental clues and interactions
- Alternative solution paths
- Learning from previous puzzles
`;
```

#### **Follow-Up Prompt System**

##### **Initial Response Follow-Up**
```typescript
const FOLLOW_UP_PROMPTS = {
  needMoreInfo: "Would you like me to elaborate on any specific aspect?",
  stuck: "Are you stuck on a particular part? I can provide more targeted help.",
  screenshot: "If you can share a screenshot, I can give more specific guidance.",
  alternative: "Would you like to explore alternative approaches?",
  difficulty: "Is this challenge too easy, too hard, or just right for your skill level?"
};
```

##### **Context-Aware Follow-Ups**
```typescript
const CONTEXT_FOLLOW_UPS = {
  newPlayer: "Since you're new to this game, would you like some basic tips to get started?",
  experienced: "Given your experience, would you like advanced strategies or optimization tips?",
  stuck: "It sounds like you're stuck. Would you like a step-by-step walkthrough or just a hint?",
  exploration: "Are you looking to explore more of the area or focus on the main objective?",
  completionist: "Are you trying to find all collectibles or just complete the main story?"
};
```

##### **Tier-Specific Follow-Ups**
```typescript
const TIER_FOLLOW_UPS = {
  free: "Upgrade to Pro for more detailed analysis and internet search capabilities.",
  pro: "You have access to advanced insights and grounding search. What would you like to explore?",
  vanguard: "As a Vanguard member, you have full access to all features. How can I help you excel?"
};
```

### **AI Persona System**

#### **Screenshot Analyst Persona**
```typescript
const SCREENSHOT_ANALYST_PROMPT = `
You are the Screenshot Analyst persona. Your role is to analyze game screenshots and provide immediate, actionable insights.

Focus on:
- Visual elements and UI indicators
- Current game state and context
- Immediate next steps
- Important items or interactions
- Health, inventory, and resource status
- Objective markers and waypoints

Response format:
## 📸 Screenshot Analysis
### Current Situation
[Describe what you see]

### Key Elements
- [List important UI elements]
- [Note inventory/health status]
- [Identify objectives]

### Recommended Actions
1. [Immediate next step]
2. [Secondary action]
3. [Optional exploration]

### Tips
- [Helpful gameplay tip]
- [Strategy suggestion]
`;
```

#### **Game Companion Persona**
```typescript
const GAME_COMPANION_PROMPT = `
You are the Game Companion persona. Your role is to provide ongoing support and guidance throughout a gaming session.

Focus on:
- Long-term strategy and planning
- Character progression and builds
- Quest management and prioritization
- Resource optimization
- Exploration guidance
- Achievement hunting

Response format:
## 🎮 Game Companion
### Current Progress
[Assess where the player is]

### Strategic Overview
[Big picture guidance]

### Next Steps
1. [Primary objective]
2. [Secondary goals]
3. [Optional activities]

### Pro Tips
- [Advanced strategy]
- [Optimization tip]
- [Hidden content hint]
`;
```

#### **General Assistant Persona**
```typescript
const GENERAL_ASSISTANT_PROMPT = `
You are the General Assistant persona. Your role is to handle non-gaming queries and provide general assistance.

Focus on:
- General questions and conversation
- Technical support
- App features and usage
- Account and subscription help
- Feedback and suggestions

Response format:
## 🤖 General Assistant
### How I Can Help
[Explain your capabilities]

### Information
[Provide requested information]

### Next Steps
[Suggest follow-up actions]

### Additional Resources
[Link to relevant help or features]
`;
```

### **Grounding Search Configuration**

#### **Pro/Vanguard Tier Features**
```typescript
const GROUNDING_SEARCH_CONFIG = {
  enabled: true, // Only for Pro/Vanguard users
  tools: [{ googleSearch: {} }],
  searchScope: "gaming, walkthroughs, guides, tips, strategies",
  maxResults: 5,
  relevanceThreshold: 0.8
};
```

#### **Search Integration**
```typescript
const SEARCH_INTEGRATION = `
When using grounding search:
1. Search for recent, relevant gaming information
2. Focus on official sources and reputable gaming sites
3. Prioritize spoiler-free content
4. Provide source attribution
5. Summarize key findings
6. Offer multiple perspectives when available
`;
```

### **Error Handling & Fallbacks**

#### **API Error Handling**
```typescript
const ERROR_HANDLING = {
  gemini: {
    quotaExceeded: "API quota exceeded. Please try again later.",
    rateLimited: "Too many requests. Please wait a moment.",
    invalidKey: "API key invalid. Please contact support.",
    networkError: "Network error. Please check your connection."
  },
  supabase: {
    authError: "Authentication failed. Please try logging in again.",
    networkError: "Connection error. Please check your internet.",
    permissionDenied: "Access denied. Please check your permissions."
  },
  websocket: {
    connectionFailed: "Failed to connect to PC client. Please check the code.",
    disconnected: "Connection lost. Attempting to reconnect...",
    timeout: "Connection timeout. Please try again."
  }
};
```

#### **Fallback Responses**
```typescript
const FALLBACK_RESPONSES = {
  aiUnavailable: "I'm having trouble connecting to the AI service. Please try again in a moment.",
  noScreenshot: "I can't see any screenshot. Please try uploading an image.",
  unclearQuery: "I'm not sure what you're asking about. Could you be more specific?",
  gameNotRecognized: "I'm not familiar with this game. Could you tell me more about it?"
};
```

### **Performance Monitoring**

#### **API Call Tracking**
```typescript
const API_MONITORING = {
  gemini: {
    trackCalls: true,
    trackCosts: true,
    trackLatency: true,
    alertThresholds: {
      cost: 100, // dollars per day
      latency: 5000, // milliseconds
      errorRate: 0.05 // 5%
    }
  },
  supabase: {
    trackQueries: true,
    trackLatency: true,
    alertThresholds: {
      latency: 2000, // milliseconds
      errorRate: 0.01 // 1%
    }
  }
};
```

#### **Usage Analytics**
```typescript
const USAGE_ANALYTICS = {
  trackUserActions: true,
  trackFeatureUsage: true,
  trackPerformance: true,
  trackErrors: true,
  privacyCompliant: true,
  dataRetention: "90 days"
};
```

### **Environment Configuration**

#### **Development Environment**
```bash
# .env.development
VITE_GEMINI_API_KEY=AIzaSyAQPghopyMINAl_sJFwF8HPB19WCrsEDHY
VITE_SUPABASE_URL=https://qajcxgkqloumogioomiz.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_GoW6G_umt1lFF-KPbbm-Ow_D2PYxPLw
VITE_WEBSOCKET_URL=wss://otakon-relay.onrender.com
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

#### **Production Environment**
```bash
# .env.production
VITE_GEMINI_API_KEY=your_production_gemini_key
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_production_supabase_key
VITE_WEBSOCKET_URL=wss://otakon-relay.onrender.com
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
```

### **Security Considerations**

#### **API Key Security**
- Store API keys in environment variables
- Never commit keys to version control
- Use different keys for development/production
- Rotate keys regularly
- Monitor key usage

#### **WebSocket Security**
- Use WSS (secure WebSocket) in production
- Implement proper authentication
- Validate all incoming messages
- Rate limit connections
- Monitor for abuse

#### **Data Privacy**
- Comply with GDPR/CCPA
- Encrypt sensitive data
- Implement proper data retention
- Provide user data export/deletion
- Regular security audits

### **Integration Testing**

#### **External Service Tests**
```typescript
const INTEGRATION_TESTS = {
  gemini: {
    testApiKey: "Test API key validity",
    testModels: "Test both 2.5 Pro and 2.5 Flash",
    testStreaming: "Test streaming responses",
    testErrorHandling: "Test error scenarios"
  },
  supabase: {
    testConnection: "Test database connection",
    testAuth: "Test authentication flows",
    testRLS: "Test row level security",
    testRealtime: "Test real-time subscriptions"
  },
  websocket: {
    testConnection: "Test WebSocket connection",
    testReconnection: "Test auto-reconnection",
    testMessageQueue: "Test message queuing",
    testHeartbeat: "Test heartbeat mechanism"
  }
};
```

### **Deployment Configuration**

#### **Build Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ai: ['@google/genai'],
          database: ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

#### **Environment Variables**
```typescript
// config/environment.ts
export const config = {
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    models: {
      pro: 'gemini-2.5-pro',
      flash: 'gemini-2.5-flash'
    }
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  },
  websocket: {
    url: import.meta.env.VITE_WEBSOCKET_URL
  },
  app: {
    env: import.meta.env.VITE_APP_ENV,
    debug: import.meta.env.VITE_DEBUG_MODE === 'true'
  }
};
```

This comprehensive configuration ensures your rebuilt app will have all the same external service connections and capabilities as your current app, but with a much cleaner and more maintainable architecture.

---

## 🎨 **UI CONTENT & DESIGN ELEMENTS**

### **Landing Page Content**

#### **Hero Section**
```typescript
const LANDING_HERO = {
  logo: "Otagon", // Large gradient text
  mainHeadline: "Stuck In-Game? Get Hints, Not Spoilers.",
  alternativeHeadline: "Stop Searching, Start Playing",
  subtext: "Otagon sees your screen and gives you the perfect nudge to keep you playing—without ruining the surprise. Stop searching, start playing.",
  ctaButton: "Get Started",
  waitlistForm: {
    placeholder: "Enter your email",
    buttonText: "Join Waitlist",
    successMessage: "Thanks! We'll notify you when Otagon is ready."
  }
};
```

#### **App Mockup Content**
```typescript
const APP_MOCKUP = {
  userMessage: "What should I do here?",
  aiResponse: {
    title: "Hint:",
    content: "The contraption on the far wall seems to be missing a gear. Perhaps there's one nearby?"
  }
};
```

#### **Features Section**
```typescript
const FEATURES = [
  {
    icon: "eye",
    title: "Screenshot Analysis",
    description: "Upload screenshots and get instant, context-aware hints without spoilers."
  },
  {
    icon: "bookmark", 
    title: "Game-Specific Memory",
    description: "Otagon remembers your progress and provides personalized guidance for each game."
  },
  {
    icon: "network",
    title: "PC Client Integration", 
    description: "Connect your PC for automatic screenshot capture and seamless gaming assistance."
  },
  {
    icon: "mic",
    title: "Hands-Free Mode",
    description: "Voice commands and audio responses keep your hands on the controller."
  },
  {
    icon: "insights",
    title: "Proactive Insights",
    description: "Get advanced tips and strategies tailored to your playstyle and preferences."
  },
  {
    icon: "cpu",
    title: "AI-Powered Intelligence",
    description: "Powered by Google's Gemini AI for the most accurate and helpful gaming guidance."
  }
];
```

#### **Testimonials**
```typescript
const TESTIMONIALS = [
  {
    quote: "Finally, a gaming companion that actually helps without spoiling the experience!",
    author: "Sarah Chen",
    title: "Gaming Enthusiast"
  },
  {
    quote: "Otagon saved me hours of frustration. It's like having a gaming expert right beside you.",
    author: "Mike Rodriguez", 
    title: "Streamer"
  },
  {
    quote: "The screenshot analysis is incredible. It understands exactly what I'm looking at.",
    author: "Alex Kim",
    title: "Game Developer"
  }
];
```

### **Login Page Content**

#### **Welcome Section**
```typescript
const LOGIN_CONTENT = {
  logo: "Otagon",
  welcomeTitle: "Welcome to Otagon",
  signInSubtext: "Sign in to continue your gaming journey",
  signUpSubtext: "Join Otagon AI and start your gaming journey",
  authOptions: {
    google: "Continue with Google",
    discord: "Continue with Discord", 
    email: "Continue with Email",
    developer: "Developer Mode"
  },
  emailForm: {
    signIn: {
      title: "Sign In",
      subtitle: "Enter your email to receive a magic link",
      placeholder: "Enter your email address",
      buttonText: "Send Magic Link",
      switchText: "Don't have an account?",
      switchLink: "Sign up instead"
    },
    signUp: {
      title: "Sign Up", 
      subtitle: "Enter your email to create an account",
      placeholder: "Enter your email address",
      buttonText: "Create Account",
      switchText: "Already have an account?",
      switchLink: "Sign in instead"
    }
  },
  developerMode: {
    title: "Developer Mode",
    subtitle: "Enter password to access developer features",
    placeholder: "Enter developer password",
    buttonText: "Enter Developer Mode",
    features: [
      "Switch between user tiers",
      "Access all features",
      "Test without subscription",
      "Advanced debugging tools"
    ]
  }
};
```

### **Splash Screens Content**

#### **Initial Splash Screen**
```typescript
const INITIAL_SPLASH = {
  title: "Welcome to Otagon",
  subtitle: "Your AI gaming companion is ready",
  description: "Let's set up your gaming experience",
  buttonText: "Get Started"
};
```

#### **Connect to PC Splash**
```typescript
const CONNECT_PC_SPLASH = {
  title: "Connect to Your PC",
  subtitle: "Enable automatic screenshot capture",
  description: "Download the PC client and enter the 6-digit code to connect",
  codeInput: {
    placeholder: "Enter 6-digit code",
    buttonText: "Connect",
    skipText: "Skip for now"
  },
  downloadSection: {
    title: "Download PC Client",
    description: "Get the Otagon PC client for automatic screenshot capture",
    buttonText: "Download Now",
    features: [
      "Automatic screenshot capture",
      "Customizable hotkeys", 
      "Real-time sync with mobile",
      "Works with any game"
    ]
  }
};
```

#### **How to Use Splash**
```typescript
const HOW_TO_USE_SPLASH = {
  slides: [
    {
      icon: "📸",
      title: "Take Screenshots",
      description: "Upload screenshots or use automatic capture to get instant hints"
    },
    {
      icon: "💬", 
      title: "Ask Questions",
      description: "Type your questions and get personalized gaming guidance"
    },
    {
      icon: "🎮",
      title: "Get Hints",
      description: "Receive spoiler-free hints tailored to your current situation"
    },
    {
      icon: "🚀",
      title: "Level Up",
      description: "Unlock advanced features with Pro and Vanguard subscriptions"
    }
  ],
  buttonText: "Start Gaming",
  skipText: "Skip Tutorial"
};
```

#### **Pro Features Splash**
```typescript
const PRO_FEATURES_SPLASH = {
  title: "Unlock Pro Features",
  subtitle: "Get the full Otagon experience",
  features: [
    {
      icon: "🔍",
      title: "Grounding Search",
      description: "Access real-time gaming information and guides"
    },
    {
      icon: "🎯", 
      title: "Advanced Insights",
      description: "Get detailed analysis and strategic recommendations"
    },
    {
      icon: "🎤",
      title: "Hands-Free Mode",
      description: "Voice commands and audio responses"
    },
    {
      icon: "📊",
      title: "Higher Limits",
      description: "More API calls and advanced features"
    }
  ],
  upgradeButton: "Upgrade to Pro",
  continueButton: "Continue with Free"
};
```

#### **Tier Splash Screen**
```typescript
const TIER_SPLASH = {
  free: {
    title: "Supercharge with Otagon",
    subtitle: "Ready to take your gaming experience to the next level?",
    features: [
      "Basic hints and guidance",
      "Limited API calls",
      "Screenshot analysis",
      "Game-specific memory"
    ]
  },
  pro: {
    title: "Unlock Your Full Potential", 
    subtitle: "You're already a Pro! Ready to become a Vanguard?",
    features: [
      "All Pro features included",
      "Priority support",
      "Advanced analytics",
      "Exclusive content"
    ]
  }
};
```

### **Chat Interface Content**

#### **Welcome Messages**
```typescript
const WELCOME_MESSAGES = {
  firstTime: "Welcome to Otagon! I'm your AI gaming companion. Upload a screenshot or ask me anything about your game, and I'll help you progress without spoilers!",
  returning: "Welcome back! Ready to continue your gaming journey?",
  everythingElse: "I'm here to help with any gaming questions you have! What would you like to know?",
  gameSpecific: "I see you're playing [Game Name]! I'm here to help you progress without spoilers. What do you need assistance with?"
};
```

#### **Suggested Prompts**
```typescript
const SUGGESTED_PROMPTS = {
  firstTime: [
    "How do I get started?",
    "What can you help me with?",
    "Upload a screenshot for analysis",
    "Tell me about this game"
  ],
  everythingElse: [
    "What's the latest gaming news?",
    "Which games are releasing soon?", 
    "What should I play next?",
    "Tell me about gaming trends"
  ],
  gameSpecific: [
    "What should I do here?",
    "I'm stuck on this part",
    "How do I solve this puzzle?",
    "What's the best strategy?"
  ],
  general: [
    "Help me understand this mechanic",
    "What am I missing?",
    "Give me a hint",
    "What's the next objective?"
  ]
};
```

#### **Error Messages**
```typescript
const ERROR_MESSAGES = {
  aiUnavailable: "I'm having trouble connecting to the AI service. Please try again in a moment.",
  noScreenshot: "I can't see any screenshot. Please try uploading an image.",
  unclearQuery: "I'm not sure what you're asking about. Could you be more specific?",
  gameNotRecognized: "I'm not familiar with this game. Could you tell me more about it?",
  quotaExceeded: "You've reached your usage limit. Upgrade to Pro for more requests.",
  networkError: "Connection error. Please check your internet and try again.",
  processingError: "Something went wrong processing your request. Please try again."
};
```

#### **Upgrade Prompts**
```typescript
const UPGRADE_PROMPTS = {
  free: {
    buttonText: "Upgrade to Pro",
    message: "Upgrade to Pro for more detailed analysis and internet search capabilities.",
    features: [
      "Grounding search enabled",
      "Advanced insights",
      "Higher API limits", 
      "Hands-free mode"
    ]
  },
  pro: {
    buttonText: "Upgrade to Vanguard",
    message: "Become a Vanguard member for exclusive features and priority support.",
    features: [
      "All Pro features",
      "Priority support",
      "Exclusive content",
      "Advanced analytics"
    ]
  }
};
```

### **Modal Content**

#### **Settings Modal**
```typescript
const SETTINGS_MODAL = {
  title: "Settings",
  tabs: {
    general: "General",
    preferences: "Preferences", 
    subscription: "Subscription",
    help: "Help",
    admin: "Admin",
    performance: "Performance"
  },
  general: {
    title: "General Settings",
    options: [
      "Dark mode",
      "Notifications",
      "Auto-save conversations",
      "Language preferences"
    ]
  },
  preferences: {
    title: "AI Preferences",
    options: [
      "Hint style (subtle/medium/detailed)",
      "Spoiler tolerance",
      "Response length",
      "Voice settings"
    ]
  },
  subscription: {
    title: "Subscription Management",
    currentPlan: "Current Plan",
    upgradeButton: "Upgrade Plan",
    cancelButton: "Cancel Subscription"
  }
};
```

#### **Connection Modal**
```typescript
const CONNECTION_MODAL = {
  title: "Connect to PC",
  subtitle: "Enable automatic screenshot capture",
  status: {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    connected: "Connected",
    error: "Connection Error"
  },
  codeInput: {
    label: "Enter 6-digit code",
    placeholder: "000000",
    buttonText: "Connect",
    errorText: "Invalid code. Please try again."
  },
  downloadSection: {
    title: "Download PC Client",
    description: "Get the Otagon PC client for automatic screenshot capture",
    buttonText: "Download Now",
    features: [
      "F1: Capture single screenshot",
      "F2: Capture batch screenshots", 
      "Customizable hotkeys",
      "Real-time sync"
    ]
  },
  helpButton: "How to use",
  skipButton: "Skip for now"
};
```

#### **Contact Us Modal**
```typescript
const CONTACT_MODAL = {
  title: "Contact Us",
  subtitle: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
  form: {
    name: {
      label: "Name",
      placeholder: "Your name"
    },
    email: {
      label: "Email", 
      placeholder: "your.email@example.com"
    },
    subject: {
      label: "Subject",
      placeholder: "What's this about?"
    },
    message: {
      label: "Message",
      placeholder: "Tell us how we can help..."
    },
    submitButton: "Send Message",
    successMessage: "Thanks! We'll get back to you soon."
  },
  contactInfo: {
    email: "support@otagon.ai",
    responseTime: "We typically respond within 24 hours"
  }
};
```

### **Tutorial Content**

#### **UI Tutorial Steps**
```typescript
const TUTORIAL_STEPS = [
  {
    id: 'credit-indicator',
    title: 'Credit Indicator',
    description: 'Shows your current usage and tier. Free users have limited credits, Pro users get more.',
    targetSelector: '.credit-indicator, [data-testid="credit-indicator"]'
  },
  {
    id: 'connect-pc-button',
    title: 'Connect to PC',
    description: 'Connect your PC to enable automatic screenshot capture and analysis.',
    targetSelector: '.connect-pc-button, [data-testid="connect-pc"]'
  },
  {
    id: 'hands-free-toggle',
    title: 'Hands-Free Mode',
    description: 'Enable voice commands and automatic screenshot capture while gaming.',
    targetSelector: '.hands-free-toggle, [data-testid="hands-free"]'
  },
  {
    id: 'conversation-tabs',
    title: 'Game Conversations',
    description: 'Switch between different games. Each maintains its own context and insights.',
    targetSelector: '.conversation-tabs, .conversation-tab'
  },
  {
    id: 'feature-tabs',
    title: 'Feature Tabs',
    description: 'Access Chat, Otaku Diary, Story So Far, Lore, and Build information.',
    targetSelector: '.sub-tabs, .feature-tab'
  },
  {
    id: 'chat-input',
    title: 'Chat Input',
    description: 'Type your questions here. Use the camera button to upload screenshots.',
    targetSelector: '.chat-input-container, .camera-upload-button'
  },
  {
    id: 'screenshot-capture',
    title: 'Screenshot Capture',
    description: 'Take screenshots manually or enable automatic capture in hands-free mode.',
    targetSelector: '.screenshot-button, [data-testid="screenshot"]'
  },
  {
    id: 'chat-messages',
    title: 'Chat Messages',
    description: 'Your conversation history with AI responses. Messages can include text and images.',
    targetSelector: '.chat-messages, .message-container'
  },
  {
    id: 'suggested-prompts',
    title: 'Suggested Prompts',
    description: 'Quick-start conversations with these pre-written prompts.',
    targetSelector: '.suggested-prompts, .prompt-grid'
  },
  {
    id: 'settings-button',
    title: 'Settings',
    description: 'Customize your experience, manage preferences, and access advanced features.',
    targetSelector: '.settings-button, [data-testid="settings"]'
  }
];
```

### **Design System**

#### **Color Palette**
```typescript
const DESIGN_SYSTEM = {
  colors: {
    primary: {
      red: "#FF4D4D",
      orange: "#FFAB40", 
      gradient: "from-[#FF4D4D] to-[#FFAB40]"
    },
    background: {
      dark: "#111111",
      darker: "#0A0A0A",
      card: "#1C1C1C",
      modal: "from-[#1C1C1C] to-[#0A0A0A]"
    },
    text: {
      primary: "#F5F5F5",
      secondary: "#CFCFCF", 
      muted: "#A3A3A3"
    },
    border: {
      default: "#424242",
      accent: "#E53A3A"
    }
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    sizes: {
      xs: "text-xs",
      sm: "text-sm", 
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
      "6xl": "text-6xl",
      "7xl": "text-7xl"
    }
  },
  spacing: {
    xs: "gap-1",
    sm: "gap-2", 
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8"
  },
  animations: {
    fadeIn: "animate-fade-in",
    slideUp: "animate-fade-slide-up",
    slideDown: "animate-fade-slide-down",
    scale: "hover:scale-105"
  }
};
```

#### **Component Styles**
```typescript
const COMPONENT_STYLES = {
  buttons: {
    primary: "bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-[#E53A3A]/25",
    secondary: "bg-[#1C1C1C]/60 border border-[#424242]/40 text-[#CFCFCF] font-medium py-2.5 px-5 rounded-xl transition-all duration-200 hover:bg-[#E53A3A]/20 hover:border-[#E53A3A]/60",
    ghost: "text-[#A3A3A3] hover:text-white transition-colors rounded-lg hover:bg-white/10"
  },
  cards: {
    default: "bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] rounded-2xl border border-[#424242]/40 shadow-2xl",
    interactive: "bg-[#1C1C1C]/60 border border-[#424242]/40 rounded-lg transition-all duration-200 hover:bg-[#E53A3A]/20 hover:border-[#E53A3A]/60 hover:scale-[1.02] backdrop-blur-sm"
  },
  inputs: {
    default: "bg-[#1C1C1C]/60 border border-[#424242]/40 rounded-lg px-4 py-3 text-[#F5F5F5] placeholder-[#A3A3A3] focus:border-[#E53A3A]/60 focus:outline-none transition-colors",
    textarea: "bg-[#1C1C1C]/60 border border-[#424242]/40 rounded-lg px-4 py-3 text-[#F5F5F5] placeholder-[#A3A3A3] focus:border-[#E53A3A]/60 focus:outline-none transition-colors resize-none"
  }
};
```

### **Responsive Design**

#### **Breakpoints**
```typescript
const RESPONSIVE_BREAKPOINTS = {
  mobile: "sm:",
  tablet: "md:", 
  desktop: "lg:",
  large: "xl:",
  extraLarge: "2xl:"
};
```

#### **Mobile-First Classes**
```typescript
const MOBILE_FIRST_CLASSES = {
  text: {
    mobile: "text-base",
    tablet: "md:text-lg", 
    desktop: "lg:text-xl"
  },
  spacing: {
    mobile: "p-4",
    tablet: "md:p-6",
    desktop: "lg:p-8"
  },
  grid: {
    mobile: "grid-cols-1",
    tablet: "md:grid-cols-2",
    desktop: "lg:grid-cols-3"
  }
};
```

This comprehensive UI content library ensures your rebuilt app will have identical text, styling, and user experience to your current app, but with a much cleaner and more maintainable codebase.


