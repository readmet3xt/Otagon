import { supabase } from './supabase';
import { feedbackSecurityService } from './feedbackSecurityService';

export interface FeedbackAnalysis {
  rejectionPattern: string;
  improvementSuggestions: string[];
  aiConfidenceTrend: number;
  commonFailurePoints: string[];
}

export class FeedbackLearningEngine {
  
  // Track progress update feedback with version context (with security validation)
  async trackProgressFeedback(
    historyId: string,
    feedback: 'confirmed' | 'rejected',
    gameVersion: string,
    userReason?: string,
    aiConfidence?: number
  ): Promise<void> {
    
    console.log('🧠 Feedback Learning: Tracking progress feedback', {
      historyId,
      feedback,
      gameVersion,
      userReason,
      aiConfidence
    });
    
    try {
      // SECURITY VALIDATION: Ensure database operation is allowed
      const systemData = {
        category: 'progress_feedback',
        event_type: feedback,
        history_id: historyId,
        game_version: gameVersion,
        user_reason: userReason,
        ai_confidence: aiConfidence,
        feedback_type: 'progress_update',
        timestamp: new Date().toISOString()
      };

      if (!feedbackSecurityService.validateDatabaseOperation('insert', 'system_new', { system_data: systemData })) {
        console.error('🚨 SECURITY BLOCKED: Progress feedback database operation not allowed');
        return;
      }

      // Store feedback in app_level table with version context
      const { error } = await supabase
        .from('app_level')
        .upsert({
          key: 'system_feedback_data',
          value: systemData,
          description: 'System feedback data for learning',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('🧠 Feedback Learning: Error storing feedback:', error);
        return;
      }

      // If rejected, analyze for pattern improvement
      if (feedback === 'rejected') {
        console.log('🧠 Feedback Learning: Analyzing rejection pattern');
        await this.analyzeRejectionPattern(historyId, userReason, gameVersion);
      }

      // SECURITY VALIDATION: Ensure progress history update is allowed
      if (feedbackSecurityService.validateDatabaseOperation('update', 'progress_history', {
        user_feedback: feedback,
        feedback_timestamp: new Date().toISOString()
      })) {
        // Update progress history with feedback (using games.session_data)
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('session_data')
          .eq('id', historyId.split('_')[0]) // Extract game ID from history ID
          .single();

        if (!gameError) {
          const sessionData = gameData.session_data || {};
          const progressHistory = sessionData.progressHistory || [];
          
          // Find and update the specific history entry
          const historyIndex = progressHistory.findIndex((h: any) => h.id === historyId);
          if (historyIndex !== -1) {
            progressHistory[historyIndex] = {
              ...progressHistory[historyIndex],
              user_feedback: feedback,
              feedback_timestamp: new Date().toISOString()
            };
            
            const updatedSessionData = {
              ...sessionData,
              progressHistory: progressHistory
            };
            
            await supabase
              .from('games')
              .update({ session_data: updatedSessionData })
              .eq('id', historyId.split('_')[0]);
          }
        }
      }

      console.log('🧠 Feedback Learning: Feedback tracking completed successfully');

    } catch (error) {
      console.error('🧠 Feedback Learning: Error tracking progress feedback:', error);
    }
  }

  // Analyze rejection patterns with version context
  private async analyzeRejectionPattern(
    historyId: string, 
    userReason?: string, 
    gameVersion: string = 'base_game'
  ): Promise<void> {
    
    try {
      // Get history entry from games.session_data
      const gameId = historyId.split('_')[0];
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('session_data')
        .eq('id', gameId)
        .single();

      if (gameError || !gameData) return;

      const sessionData = gameData.session_data || {};
      const progressHistory = sessionData.progressHistory || [];
      
      const historyEntry = progressHistory.find((h: any) => h.id === historyId);
      if (!historyEntry) return;

      // Store rejection analysis for prompt improvement with version context
      const { error } = await supabase
        .from('app_level')
        .upsert({
          key: 'rejection_analysis_data',
          value: {
            category: 'ai_improvement',
            event_type: 'progress_detection_failure',
            event_id: historyEntry.event_id,
            game_id: historyEntry.game_id,
            game_version: gameVersion,
            ai_confidence: historyEntry.ai_confidence,
            ai_reasoning: historyEntry.ai_reasoning,
            user_reason: userReason,
            failure_pattern: 'false_positive',
            timestamp: new Date().toISOString()
          },
          description: 'Rejection analysis data for AI improvement',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('Error storing rejection analysis:', error);
      }

    } catch (error) {
      console.error('Error analyzing rejection pattern:', error);
    }
  }

  // Get feedback-based improvements for AI prompts with version context
  async getProgressDetectionImprovements(
    gameId: string, 
    gameVersion: string = 'base_game'
  ): Promise<string[]> {
    
    try {
      const { data: rejectionData, error } = await supabase
        .from('app_level')
        .select('value')
        .eq('key', 'rejection_analysis_data')
        .single();

      if (error) {
        console.error('Error fetching rejection data:', error);
        return [];
      }

      const rejections = rejectionData?.value ? [rejectionData.value] : [];

      const improvements: string[] = [];
      
      if (rejections && rejections.length > 0) {
        const falsePositiveRate = rejections.length / 100; // Assuming 100 total attempts
        
        if (falsePositiveRate > 0.1) { // More than 10% false positives
          improvements.push(`Be more conservative with progress detection for ${gameVersion}. Only update when very confident (>0.8).`);
        }
        
        if (rejections.some(r => r.system_data?.ai_confidence > 0.8)) {
          improvements.push('High confidence predictions can still be wrong. Always verify with multiple pieces of evidence.');
        }

        // Version-specific improvements
        if (gameVersion !== 'base_game') {
          improvements.push(`Pay special attention to ${gameVersion}-specific content and progression patterns.`);
        }

        // Analyze common failure points
        const failurePoints = this.analyzeCommonFailurePoints(rejections);
        improvements.push(...failurePoints);
      }

      return improvements;

    } catch (error) {
      console.error('Error getting progress detection improvements:', error);
      return [];
    }
  }

  // Analyze common failure points from rejections
  private analyzeCommonFailurePoints(rejections: any[]): string[] {
    const improvements: string[] = [];
    
    // Group rejections by event type
    const eventTypeFailures: { [key: string]: number } = {};
    const confidenceFailures: { [key: string]: number } = {};
    
    rejections.forEach(rejection => {
      const eventType = rejection.system_data?.event_type || 'unknown';
      const aiConfidence = rejection.system_data?.ai_confidence || 0;
      
      eventTypeFailures[eventType] = (eventTypeFailures[eventType] || 0) + 1;
      
      if (aiConfidence > 0.8) {
        confidenceFailures['high_confidence'] = (confidenceFailures['high_confidence'] || 0) + 1;
      } else if (aiConfidence < 0.5) {
        confidenceFailures['low_confidence'] = (confidenceFailures['low_confidence'] || 0) + 1;
      }
    });

    // Generate specific improvements
    Object.entries(eventTypeFailures).forEach(([eventType, count]) => {
      if (count > 2) { // More than 2 failures for this event type
        improvements.push(`Be more careful with ${eventType} detection. This event type has ${count} recent rejections.`);
      }
    });

    if ((confidenceFailures['high_confidence'] || 0) > 0) {
      improvements.push('High confidence predictions are being rejected. Require stronger evidence before making predictions.');
    }

    if ((confidenceFailures['low_confidence'] || 0) > 0) {
      improvements.push('Low confidence predictions are being rejected. Improve detection accuracy for better confidence scoring.');
    }

    return improvements;
  }

  // Get overall feedback statistics
  async getFeedbackStatistics(gameId?: string, gameVersion?: string): Promise<{
    totalFeedback: number;
    confirmations: number;
    rejections: number;
    averageConfidence: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
  }> {
    
    try {
      const { data: feedbackData, error } = await supabase
        .from('app_level')
        .select('value')
        .eq('key', 'system_feedback_data')
        .single();

      if (error) {
        console.error('Error fetching feedback data:', error);
        return {
          totalFeedback: 0,
          confirmations: 0,
          rejections: 0,
          averageConfidence: 0,
          improvementTrend: 'stable'
        };
      }

      const feedback = feedbackData?.value || {};

      if (!feedback) {
        return {
          totalFeedback: 0,
          confirmations: 0,
          rejections: 0,
          averageConfidence: 0,
          improvementTrend: 'stable'
        };
      }

      const confirmations = feedback.filter((f: any) => f.system_data?.event_type === 'confirmed').length;
      const rejections = feedback.filter((f: any) => f.system_data?.event_type === 'rejected').length;
      const totalFeedback = feedback.length;

      // Calculate average confidence from confirmed feedback
      const confirmedFeedback = feedback.filter((f: any) => f.system_data?.event_type === 'confirmed');
      const averageConfidence = confirmedFeedback.length > 0 
        ? confirmedFeedback.reduce((sum: number, f: any) => sum + (f.system_data?.ai_confidence || 0), 0) / confirmedFeedback.length
        : 0;

      // Determine improvement trend (simplified logic)
      const rejectionRate = rejections / totalFeedback;
      let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
      
      if (rejectionRate < 0.1) improvementTrend = 'improving';
      else if (rejectionRate > 0.3) improvementTrend = 'declining';

      return {
        totalFeedback,
        confirmations,
        rejections,
        averageConfidence,
        improvementTrend
      };

    } catch (error) {
      console.error('Error getting feedback statistics:', error);
      return {
        totalFeedback: 0,
        confirmations: 0,
        rejections: 0,
        averageConfidence: 0,
        improvementTrend: 'stable'
      };
    }
  }

  // Revert a progress update based on user feedback
  async revertProgressUpdate(historyId: string): Promise<boolean> {
    
    try {
      // Get history entry from games.session_data
      const gameId = historyId.split('_')[0];
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('session_data')
        .eq('id', gameId)
        .single();

      if (gameError || !gameData) return false;

      const sessionData = gameData.session_data || {};
      const progressHistory = sessionData.progressHistory || [];
      
      const historyEntry = progressHistory.find((h: any) => h.id === historyId);
      if (!historyEntry) return false;

      // Revert the game progress
      const { error: revertError } = await supabase
        .from('games')
        .update({
          current_progress_level: historyEntry.old_level,
          completed_events: supabase.rpc('array_remove', { arr: historyEntry.completed_events || [], element: historyEntry.event_id }),
          last_progress_update: new Date().toISOString()
        })
        .eq('user_id', historyEntry.user_id)
        .eq('game_id', historyEntry.game_id);

      if (revertError) {
        console.error('Error reverting game progress:', revertError);
        return false;
      }

      // Mark the history entry as reverted
      const historyIndex = progressHistory.findIndex((h: any) => h.id === historyId);
      if (historyIndex !== -1) {
        progressHistory[historyIndex] = {
          ...progressHistory[historyIndex],
          user_feedback: 'reverted',
          feedback_timestamp: new Date().toISOString()
        };
        
        const updatedSessionData = {
          ...sessionData,
          progressHistory: progressHistory
        };
        
        const { error: historyError } = await supabase
          .from('games')
          .update({ session_data: updatedSessionData })
          .eq('id', gameId);
        
        if (historyError) {
          console.error('Error updating history entry:', historyError);
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Error reverting progress update:', error);
      return false;
    }
  }
}

export const feedbackLearningEngine = new FeedbackLearningEngine();
