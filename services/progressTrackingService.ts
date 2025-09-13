import { supabase } from './supabase';
import { GameProgress, GameEvent, ProgressHistory } from './types';

export interface ProgressUpdateResult {
  success: boolean;
  data?: any;
  message?: string;
  isDuplicate?: boolean;
  existingEventId?: string;
}

export class ProgressTrackingService {
  
  // Get user's current game progress with versioning
  async getUserGameProgress(
    userId: string, 
    gameId: string, 
    gameVersion: string = 'base_game'
  ): Promise<GameProgress> {
    const { data } = await supabase
      .from('games')
      .select(`
        current_progress_level,
        game_version,
        completed_events,
        progress_metadata,
        last_progress_update,
        progress_confidence
      `)
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .eq('game_version', gameVersion)
      .single();
    
    return data || {
      current_progress_level: 1,
      game_version: gameVersion,
      completed_events: [],
      progress_metadata: {},
      last_progress_update: new Date().toISOString(),
      progress_confidence: 1.0
    };
  }

  // Update progress based on AI-detected event with versioning
  async updateProgressFromEvent(
    userId: string,
    gameId: string,
    eventId: string,
    gameVersion: string = 'base_game',
    aiConfidence: number,
    aiReasoning: string,
    aiEvidence: string[]
  ): Promise<ProgressUpdateResult> {
    
    try {
      const response = await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          gameId,
          eventId,
          gameVersion,
          aiConfidence,
          aiReasoning,
          aiEvidence
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update progress');
      }

      const result = await response.json();
      
      // Check if this was a duplicate event
      if (result.existingEvent) {
        return {
          ...result,
          isDuplicate: true,
          existingEventId: result.existingEvent.id
        };
      }

      return result;

    } catch (error) {
      console.error('Progress update failed:', error);
      throw error;
    }
  }

  // Get available events for a game with versioning (using games.session_data)
  async getAvailableEvents(
    gameId: string, 
    currentLevel: number, 
    gameVersion: string = 'base_game'
  ): Promise<GameEvent[]> {
    const { data: gameData, error } = await supabase
      .from('games')
      .select('session_data')
      .eq('id', gameId)
      .single();

    if (error) throw error;

    const sessionData = gameData.session_data || {};
    const progressEvents = sessionData.progressEvents || [];
    
    // Filter events for current level + next 2 levels
    const relevantEvents = progressEvents.filter((event: any) => 
      event.game_version === gameVersion && 
      event.unlocks_progress_level <= currentLevel + 2
    );
    
    return relevantEvents.sort((a: any, b: any) => a.unlocks_progress_level - b.unlocks_progress_level);
  }

  // Get progress history with versioning (using games.session_data)
  async getProgressHistory(
    userId: string, 
    gameId: string, 
    gameVersion: string = 'base_game'
  ): Promise<ProgressHistory[]> {
    const { data: gameData, error } = await supabase
      .from('games')
      .select('session_data')
      .eq('id', gameId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const sessionData = gameData.session_data || {};
    const progressHistory = sessionData.progressHistory || [];
    
    // Filter by game version and sort by created_at
    const relevantHistory = progressHistory.filter((history: any) => 
      history.game_version === gameVersion
    );
    
    return relevantHistory.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Get or create progress event for any game
  async getOrCreateProgressEvent(
    gameId: string,
    eventType: string,
    description: string,
    progressLevel: number,
    gameVersion: string = 'base_game'
  ): Promise<string> {
    
    // Get game data
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('session_data')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;

    const sessionData = gameData.session_data || {};
    const progressEvents = sessionData.progressEvents || [];
    
    // First, try to find an existing event
    const existingEvent = progressEvents.find((event: any) => 
      event.game_version === gameVersion &&
      event.event_type === eventType &&
      event.unlocks_progress_level === progressLevel
    );
    
    if (existingEvent) {
      return existingEvent.event_id;
    }
    
    // If no existing event, try to find a universal event
    const universalEvent = progressEvents.find((event: any) => 
      event.game_id === '*' &&
      event.event_type === eventType
    );
    
    if (universalEvent) {
      // Use universal event as template, create game-specific version
      const newEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newEvent = {
        event_id: newEventId,
        game_id: gameId,
        game_version: gameVersion,
        event_type: eventType,
        description: description,
        unlocks_progress_level: progressLevel,
        lore_context: `Game-specific ${eventType} event`,
        difficulty: 3,
        created_at: new Date().toISOString()
      };
      
      // Add to progress events
      const updatedProgressEvents = [...progressEvents, newEvent];
      const updatedSessionData = {
        ...sessionData,
        progressEvents: updatedProgressEvents
      };
      
      // Update games table
      await supabase
        .from('games')
        .update({ session_data: updatedSessionData })
        .eq('id', gameId);
      
      return newEventId;
    }
    
    // If no universal event, create a completely new one
    const newEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEvent = {
      event_id: newEventId,
      game_id: gameId,
      game_version: gameVersion,
      event_type: eventType,
      description: description,
      unlocks_progress_level: progressLevel,
      lore_context: `Custom ${eventType} event for ${gameId}`,
      difficulty: 3,
      created_at: new Date().toISOString()
    };
    
    // Add to progress events
    const updatedProgressEvents = [...progressEvents, newEvent];
    const updatedSessionData = {
      ...sessionData,
      progressEvents: updatedProgressEvents
    };
    
    // Update games table
    const { error: updateError } = await supabase
      .from('games')
      .update({ session_data: updatedSessionData })
      .eq('id', gameId);
    
    if (updateError) throw updateError;
    
    return newEventId;
  }

  // Update progress for any game (with dynamic event creation)
  async updateProgressForAnyGame(
    userId: string,
    gameId: string,
    eventType: string,
    description: string,
    progressLevel: number,
    gameVersion: string = 'base_game',
    aiConfidence: number = 0.8,
    aiReasoning: string = 'User input analysis',
    aiEvidence: string[] = []
  ): Promise<ProgressUpdateResult> {
    
    console.log('🎮 Progress Tracking: Starting progress update', {
      userId,
      gameId,
      eventType,
      description,
      progressLevel,
      gameVersion,
      aiConfidence,
      aiReasoning,
      aiEvidence
    });
    
    try {
      // Get or create the appropriate event
      const eventId = await this.getOrCreateProgressEvent(
        gameId, eventType, description, progressLevel, gameVersion
      );
      
      console.log('🎮 Progress Tracking: Event ID resolved', { eventId });
      
      // Update progress using the existing function
      const result = await this.updateProgressFromEvent(
        userId, gameId, eventId, gameVersion, aiConfidence, aiReasoning, aiEvidence
      );
      
      console.log('🎮 Progress Tracking: Progress update completed', { result });
      return result;
      
    } catch (error) {
      console.error('🎮 Progress Tracking: Progress update failed', error);
      throw error;
    }
  }

  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }
}

export const progressTrackingService = new ProgressTrackingService();
