import { supabase } from './supabase';
import { authService } from './supabase';
import { DiaryTask, DiaryFavorite } from './types';

export interface GameProgress {
  id: string;
  sessionDate: string;
  duration: number;
  objectivesCompleted: string[];
  discoveries: string[];
  notes: string;
  createdAt: string;
}

export interface GameProgressSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  needHelpTasks: number;
  completionPercentage: number;
}

class OtakuDiarySupabaseService {
  private static instance: OtakuDiarySupabaseService;

  static getInstance(): OtakuDiarySupabaseService {
    if (!OtakuDiarySupabaseService.instance) {
      OtakuDiarySupabaseService.instance = new OtakuDiarySupabaseService();
    }
    return OtakuDiarySupabaseService.instance;
  }

  // ========================================
  // GAME MANAGEMENT
  // ========================================

  async createGame(title: string, genre?: string): Promise<string | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('games')
        .insert({
          user_id: userId,
          title,
          genre,
          progress: 0,
          playthrough_count: 1
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating game:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating game:', error);
      return null;
    }
  }

  async getGame(gameId: string): Promise<any | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error getting game:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting game:', error);
      return null;
    }
  }

  async updateGameProgress(gameId: string, progress: number): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const { error } = await supabase
        .from('games')
        .update({
          progress,
          last_session_date: new Date().toISOString()
        })
        .eq('id', gameId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating game progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating game progress:', error);
      return false;
    }
  }

  // ========================================
  // TASK MANAGEMENT
  // ========================================

  async createTask(task: Omit<DiaryTask, 'id' | 'createdAt'>): Promise<DiaryTask | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const diaryTask: DiaryTask = {
        ...task,
        id: `diary_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now()
      };

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (userError) throw userError;

      // Update app_state with new diary task
      const currentAppState = userData.app_state || {};
      const currentDiaryTasks = currentAppState.diaryTasks || [];
      
      const updatedDiaryTasks = [...currentDiaryTasks, diaryTask];
      const updatedAppState = {
        ...currentAppState,
        diaryTasks: updatedDiaryTasks
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', userId);

      if (error) throw error;

      return diaryTask;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  async updateTask(gameId: string, taskId: string, updates: Partial<DiaryTask>): Promise<DiaryTask | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (userError) throw userError;

      // Update app_state with modified diary task
      const currentAppState = userData.app_state || {};
      const currentDiaryTasks = currentAppState.diaryTasks || [];
      
      const taskIndex = currentDiaryTasks.findIndex((task: DiaryTask) => task.id === taskId);
      if (taskIndex === -1) return null;

      const updatedTask = {
        ...currentDiaryTasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const updatedDiaryTasks = [...currentDiaryTasks];
      updatedDiaryTasks[taskIndex] = updatedTask;
      
      const updatedAppState = {
        ...currentAppState,
        diaryTasks: updatedDiaryTasks
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', userId);

      if (error) throw error;

      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  async deleteTask(gameId: string, taskId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (userError) throw userError;

      // Update app_state by removing the task
      const currentAppState = userData.app_state || {};
      const currentDiaryTasks = currentAppState.diaryTasks || [];
      
      const updatedDiaryTasks = currentDiaryTasks.filter((task: DiaryTask) => task.id !== taskId);
      
      const updatedAppState = {
        ...currentAppState,
        diaryTasks: updatedDiaryTasks
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  async getTasks(gameId: string): Promise<DiaryTask[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      // Get current user data
      const { data: userData, error } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (error) throw error;

      // Extract diary tasks from app_state
      const currentAppState = userData.app_state || {};
      const allDiaryTasks = currentAppState.diaryTasks || [];
      
      // Filter tasks for the specific game
      const gameTasks = allDiaryTasks.filter((task: DiaryTask) => task.gameId === gameId);

      return gameTasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  async getGameProgressSummary(gameId: string): Promise<GameProgressSummary | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      // Get current user data for diary tasks
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (userError) throw userError;

      // Extract diary tasks from app_state
      const currentAppState = userData.app_state || {};
      const allDiaryTasks = currentAppState.diaryTasks || [];
      
      // Filter tasks for the specific game
      const gameTasks = allDiaryTasks.filter((task: DiaryTask) => task.gameId === gameId);

      // Calculate summary
      const totalTasks = gameTasks.length;
      const completedTasks = gameTasks.filter((task: any) => task.status === 'completed').length;
      const pendingTasks = gameTasks.filter((task: any) => task.status === 'pending').length;
      const needHelpTasks = gameTasks.filter((task: any) => task.status === 'need_help').length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        totalTasks,
        completedTasks,
        pendingTasks,
        needHelpTasks,
        completionPercentage
      };
    } catch (error) {
      console.error('Error getting progress summary:', error);
      return null;
    }
  }

  // ========================================
  // FAVORITES MANAGEMENT
  // ========================================

  async addFavorite(favorite: Omit<DiaryFavorite, 'id' | 'createdAt'>): Promise<DiaryFavorite | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      const diaryFavorite: DiaryFavorite = {
        ...favorite,
        id: `diary_favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now()
      };

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (userError) throw userError;

      // Update app_state with new diary favorite
      const currentAppState = userData.app_state || {};
      const currentDiaryFavorites = currentAppState.diaryFavorites || [];
      
      // Check if favorite already exists
      const existingFavorite = currentDiaryFavorites.find((f: DiaryFavorite) => 
        f.gameId === favorite.gameId && f.content === favorite.content
      );
      
      if (existingFavorite) {
        throw new Error('Favorite already exists');
      }

      const updatedDiaryFavorites = [...currentDiaryFavorites, diaryFavorite];
      const updatedAppState = {
        ...currentAppState,
        diaryFavorites: updatedDiaryFavorites
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', userId);

      if (error) throw error;

      return diaryFavorite;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return null;
    }
  }

  async removeFavorite(gameId: string, favoriteId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (userError) throw userError;

      // Update app_state by removing the favorite
      const currentAppState = userData.app_state || {};
      const currentDiaryFavorites = currentAppState.diaryFavorites || [];
      
      const updatedDiaryFavorites = currentDiaryFavorites.filter((favorite: DiaryFavorite) => favorite.id !== favoriteId);
      
      const updatedAppState = {
        ...currentAppState,
        diaryFavorites: updatedDiaryFavorites
      };

      // Update user's app_state
      const { error } = await supabase
        .from('users')
        .update({ app_state: updatedAppState })
        .eq('auth_user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async getFavorites(gameId: string): Promise<DiaryFavorite[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return [];

      // Get current user data
      const { data: userData, error } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (error) throw error;

      // Extract diary favorites from app_state
      const currentAppState = userData.app_state || {};
      const allDiaryFavorites = currentAppState.diaryFavorites || [];
      
      // Filter favorites for the specific game
      const gameFavorites = allDiaryFavorites.filter((favorite: DiaryFavorite) => favorite.gameId === gameId);

      return gameFavorites;
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async isFavorited(gameId: string, sourceId: string, type: 'message' | 'insight'): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      // Get current user data
      const { data: userData, error } = await supabase
        .from('users')
        .select('app_state')
        .eq('auth_user_id', userId)
        .single();

      if (error) return false;

      const currentAppState = userData.app_state || {};
      const allDiaryFavorites = currentAppState.diaryFavorites || [];
      
      return allDiaryFavorites.some((favorite: DiaryFavorite) => 
        favorite.gameId === gameId && 
        ((type === 'message' && favorite.sourceMessageId === sourceId) ||
         (type === 'insight' && favorite.sourceInsightId === sourceId))
      );
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  // ========================================
  // PROGRESS TRACKING
  // ========================================

  async addGameProgress(gameId: string, progress: GameProgress): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      // Get current game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('session_data')
        .eq('id', gameId)
        .eq('user_id', userId)
        .single();

      if (gameError) throw gameError;

      // Update session_data with new progress entry
      const currentSessionData = gameData.session_data || {};
      const currentProgress = currentSessionData.progress || [];
      
      const updatedProgress = [...currentProgress, progress];
      const updatedSessionData = {
        ...currentSessionData,
        progress: updatedProgress
      };

      // Update game's session_data
      const { error } = await supabase
        .from('games')
        .update({ session_data: updatedSessionData })
        .eq('id', gameId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error adding game progress:', error);
      return false;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private async getCurrentUserId(): Promise<string | null> {
    const userId = authService.getCurrentUserId();
    return userId || null;
  }

  private mapDatabaseTaskToDiaryTask(dbTask: any): DiaryTask {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description,
      type: dbTask.type,
      status: dbTask.status,
      category: dbTask.category,
      priority: dbTask.priority,
      createdAt: new Date(dbTask.created_at).getTime(),
      ...(dbTask.completed_at && { completedAt: new Date(dbTask.completed_at).getTime() }),
      gameId: dbTask.game_id,
      ...(dbTask.source && { source: dbTask.source }),
      ...(dbTask.source_message_id && { sourceMessageId: dbTask.source_message_id })
    };
  }

  private mapDatabaseFavoriteToDiaryFavorite(dbFavorite: any): DiaryFavorite {
    return {
      id: dbFavorite.id,
      content: dbFavorite.content,
      type: dbFavorite.type,
      gameId: dbFavorite.game_id,
      createdAt: new Date(dbFavorite.created_at).getTime(),
      context: dbFavorite.context,
      sourceMessageId: dbFavorite.source_message_id,
      sourceInsightId: dbFavorite.source_insight_id
    };
  }

  // ========================================
  // MIGRATION HELPERS
  // ========================================

  async migrateFromLocalStorage(localData: any): Promise<boolean> {
    try {
      // This would handle migrating existing localStorage data to Supabase
      // Implementation depends on your specific data structure
      console.log('Data sync not needed - all data goes directly to Supabase');
      return true;
    } catch (error) {
      console.error('Error syncing data:', error);
      return false;
    }
  }
}

export const otakuDiarySupabaseService = OtakuDiarySupabaseService.getInstance();
