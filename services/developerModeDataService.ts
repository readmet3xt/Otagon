import { STORAGE_KEYS } from '../utils/constants';

/**
 * 🎯 DEVELOPER MODE DATA SERVICE
 * 
 * This service provides a localStorage-based data layer that exactly matches
 * the Supabase schema structure. This ensures consistency between developer
 * mode and authenticated user data structures.
 * 
 * Features:
 * 1. Exact Supabase schema mapping
 * 2. localStorage-based storage
 * 3. Same API as Supabase services
 * 4. No network dependencies
 * 5. Perfect for offline development
 */

// ===== TYPES (Matching Supabase Schema) =====

export interface DeveloperUserData {
  // User profile data (matches users.profile_data JSONB)
  profile_data: {
    hint_style: string;
    player_focus: string;
    preferred_tone: string;
    spoiler_tolerance: string;
    is_first_time: boolean;
    created_at: number;
    last_updated: number;
  };
  
  // User preferences (matches users.preferences JSONB)
  preferences: {
    theme: string;
    language: string;
    notifications: boolean;
    auto_save: boolean;
    developer_mode: boolean;
    [key: string]: any;
  };
  
  // App state (matches users.app_state JSONB)
  app_state: {
    onboardingComplete: boolean;
    profileSetupCompleted: boolean;
    hasSeenSplashScreens: boolean;
    welcomeMessageShown: boolean;
    firstWelcomeShown: boolean;
    hasConversations: boolean;
    hasInteractedWithChat: boolean;
    lastSessionDate: string;
    lastWelcomeTime: string;
    appClosedTime: string;
    firstRunCompleted: boolean;
    hasConnectedBefore: boolean;
    installDismissed: boolean;
    showSplashAfterLogin: boolean;
    lastSuggestedPromptsShown: string;
    conversations: string[];
    conversationsOrder: string[];
    activeConversation: string;
    [key: string]: any;
  };
  
  // Usage data (matches users.usage_data JSONB)
  usage_data: {
    textCount: number;
    imageCount: number;
    totalRequests: number;
    lastReset: number;
    [key: string]: any;
  };
  
  // Behavior data (matches users.behavior_data JSONB)
  behavior_data: {
    sessionCount: number;
    totalTimeSpent: number;
    lastActivity: number;
    featureUsage: Record<string, any>;
    [key: string]: any;
  };
  
  // Feedback data (matches users.feedback_data JSONB)
  feedback_data: {
    ratings: any[];
    suggestions: any[];
    bugReports: any[];
    [key: string]: any;
  };
  
  // Onboarding data (matches users.onboarding_data JSONB)
  onboarding_data: {
    stepsCompleted: string[];
    currentStep: string;
    completedAt: number | null;
    [key: string]: any;
  };
}

export interface DeveloperConversation {
  id: string;
  user_id: string;
  game_id: string | null;
  title: string;
  messages: any[];
  context: Record<string, any>;
  insights: Record<string, any>;
  objectives: Record<string, any>;
  ai_data: Record<string, any>;
  is_active: boolean;
  is_pinned: boolean;
  progress: number;
  created_at: string;
  updated_at: string;
  last_interaction: string;
}

export interface DeveloperGame {
  id: string;
  user_id: string;
  game_id: string;
  title: string;
  genre: string | null;
  platform: string[];
  game_data: Record<string, any>;
  progress_data: Record<string, any>;
  session_data: Record<string, any>;
  solutions_data: Record<string, any>;
  context_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_played: string;
}

export interface DeveloperTask {
  id: string;
  user_id: string;
  game_id: string;
  conversation_id: string;
  task_data: Record<string, any>;
  progress_data: Record<string, any>;
  favorites_data: Record<string, any>;
  modifications: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  category: 'custom' | 'story' | 'exploration' | 'combat' | 'achievement';
  created_at: string;
  updated_at: string;
  due_date: string | null;
  completed_at: string | null;
}

export interface DeveloperAnalytics {
  id: string;
  user_id: string;
  game_id: string | null;
  conversation_id: string | null;
  event_data: Record<string, any>;
  performance_data: Record<string, any>;
  cost_data: Record<string, any>;
  behavior_data: Record<string, any>;
  feedback_data: Record<string, any>;
  event_type: string;
  category: 'onboarding' | 'feature_usage' | 'game_activity' | 'feedback' | 'pwa' | 'performance' | 'user_behavior';
  timestamp: string;
}

// ===== DEVELOPER MODE DATA SERVICE =====

class DeveloperModeDataService {
  private static instance: DeveloperModeDataService;
  private readonly STORAGE_KEYS = {
    USER_DATA: 'otakon_developer_user_data',
    CONVERSATIONS: 'otakon_developer_conversations',
    GAMES: 'otakon_developer_games',
    TASKS: 'otakon_developer_tasks',
    ANALYTICS: 'otakon_developer_analytics',
    CACHE: 'otakon_developer_cache'
  };

  static getInstance(): DeveloperModeDataService {
    if (!DeveloperModeDataService.instance) {
      DeveloperModeDataService.instance = new DeveloperModeDataService();
    }
    return DeveloperModeDataService.instance;
  }

  // ===== USER DATA METHODS =====

  async getUserData(): Promise<DeveloperUserData | null> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get developer user data:', error);
      return null;
    }
  }

  async updateUserData(updates: Partial<DeveloperUserData>): Promise<boolean> {
    try {
      const currentData = await this.getUserData();
      if (!currentData) return false;

      const updatedData = { ...currentData, ...updates };
      localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
      return true;
    } catch (error) {
      console.error('Failed to update developer user data:', error);
      return false;
    }
  }

  async updateUserField(field: keyof DeveloperUserData, updates: any): Promise<boolean> {
    try {
      const currentData = await this.getUserData();
      if (!currentData) return false;

      const updatedData = {
        ...currentData,
        [field]: { ...currentData[field], ...updates }
      };
      localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
      return true;
    } catch (error) {
      console.error(`Failed to update developer user field ${field}:`, error);
      return false;
    }
  }

  // ===== CONVERSATIONS METHODS =====

  async getConversations(): Promise<DeveloperConversation[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get developer conversations:', error);
      return [];
    }
  }

  async getConversation(id: string): Promise<DeveloperConversation | null> {
    try {
      const conversations = await this.getConversations();
      return conversations.find(conv => conv.id === id) || null;
    } catch (error) {
      console.error('Failed to get developer conversation:', error);
      return null;
    }
  }

  async createConversation(conversation: Omit<DeveloperConversation, 'id' | 'created_at' | 'updated_at' | 'last_interaction'>): Promise<DeveloperConversation> {
    try {
      const conversations = await this.getConversations();
      const newConversation: DeveloperConversation = {
        ...conversation,
        id: 'dev-conv-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_interaction: new Date().toISOString()
      };
      
      conversations.push(newConversation);
      localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      return newConversation;
    } catch (error) {
      console.error('Failed to create developer conversation:', error);
      throw error;
    }
  }

  async updateConversation(id: string, updates: Partial<DeveloperConversation>): Promise<boolean> {
    try {
      const conversations = await this.getConversations();
      const index = conversations.findIndex(conv => conv.id === id);
      if (index === -1) return false;

      conversations[index] = {
        ...conversations[index],
        ...updates,
        updated_at: new Date().toISOString(),
        last_interaction: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      return true;
    } catch (error) {
      console.error('Failed to update developer conversation:', error);
      return false;
    }
  }

  async deleteConversation(id: string): Promise<boolean> {
    try {
      const conversations = await this.getConversations();
      const filtered = conversations.filter(conv => conv.id !== id);
      localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete developer conversation:', error);
      return false;
    }
  }

  // ===== GAMES METHODS =====

  async getGames(): Promise<DeveloperGame[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.GAMES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get developer games:', error);
      return [];
    }
  }

  async getGame(id: string): Promise<DeveloperGame | null> {
    try {
      const games = await this.getGames();
      return games.find(game => game.id === id) || null;
    } catch (error) {
      console.error('Failed to get developer game:', error);
      return null;
    }
  }

  async createGame(game: Omit<DeveloperGame, 'id' | 'created_at' | 'updated_at' | 'last_played'>): Promise<DeveloperGame> {
    try {
      const games = await this.getGames();
      const newGame: DeveloperGame = {
        ...game,
        id: 'dev-game-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_played: new Date().toISOString()
      };
      
      games.push(newGame);
      localStorage.setItem(this.STORAGE_KEYS.GAMES, JSON.stringify(games));
      return newGame;
    } catch (error) {
      console.error('Failed to create developer game:', error);
      throw error;
    }
  }

  async updateGame(id: string, updates: Partial<DeveloperGame>): Promise<boolean> {
    try {
      const games = await this.getGames();
      const index = games.findIndex(game => game.id === id);
      if (index === -1) return false;

      games[index] = {
        ...games[index],
        ...updates,
        updated_at: new Date().toISOString(),
        last_played: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEYS.GAMES, JSON.stringify(games));
      return true;
    } catch (error) {
      console.error('Failed to update developer game:', error);
      return false;
    }
  }

  // ===== TASKS METHODS =====

  async getTasks(): Promise<DeveloperTask[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get developer tasks:', error);
      return [];
    }
  }

  async createTask(task: Omit<DeveloperTask, 'id' | 'created_at' | 'updated_at'>): Promise<DeveloperTask> {
    try {
      const tasks = await this.getTasks();
      const newTask: DeveloperTask = {
        ...task,
        id: 'dev-task-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      tasks.push(newTask);
      localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      return newTask;
    } catch (error) {
      console.error('Failed to create developer task:', error);
      throw error;
    }
  }

  // ===== ANALYTICS METHODS =====

  async getAnalytics(): Promise<DeveloperAnalytics[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.ANALYTICS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get developer analytics:', error);
      return [];
    }
  }

  async createAnalytics(analytics: Omit<DeveloperAnalytics, 'id' | 'timestamp'>): Promise<DeveloperAnalytics> {
    try {
      const analyticsList = await this.getAnalytics();
      const newAnalytics: DeveloperAnalytics = {
        ...analytics,
        id: 'dev-analytics-' + Date.now(),
        timestamp: new Date().toISOString()
      };
      
      analyticsList.push(newAnalytics);
      localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analyticsList));
      return newAnalytics;
    } catch (error) {
      console.error('Failed to create developer analytics:', error);
      throw error;
    }
  }

  // ===== CACHE METHODS =====

  async getCache(key: string): Promise<any> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CACHE);
      const cache = data ? JSON.parse(data) : {};
      return cache[key] || null;
    } catch (error) {
      console.error('Failed to get developer cache:', error);
      return null;
    }
  }

  async setCache(key: string, value: any): Promise<boolean> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CACHE);
      const cache = data ? JSON.parse(data) : {};
      cache[key] = value;
      localStorage.setItem(this.STORAGE_KEYS.CACHE, JSON.stringify(cache));
      return true;
    } catch (error) {
      console.error('Failed to set developer cache:', error);
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  async clearAllData(): Promise<boolean> {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear developer data:', error);
      return false;
    }
  }

  async exportData(): Promise<string> {
    try {
      const data = {
        user_data: await this.getUserData(),
        conversations: await this.getConversations(),
        games: await this.getGames(),
        tasks: await this.getTasks(),
        analytics: await this.getAnalytics(),
        cache: JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CACHE) || '{}'),
        exported_at: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export developer data:', error);
      return '';
    }
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.user_data) {
        localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(data.user_data));
      }
      if (data.conversations) {
        localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(data.conversations));
      }
      if (data.games) {
        localStorage.setItem(this.STORAGE_KEYS.GAMES, JSON.stringify(data.games));
      }
      if (data.tasks) {
        localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
      }
      if (data.analytics) {
        localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(data.analytics));
      }
      if (data.cache) {
        localStorage.setItem(this.STORAGE_KEYS.CACHE, JSON.stringify(data.cache));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import developer data:', error);
      return false;
    }
  }
}

export const developerModeDataService = DeveloperModeDataService.getInstance();
