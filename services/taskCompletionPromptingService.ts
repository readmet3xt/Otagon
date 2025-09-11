import { Conversation, ChatMessage, DiaryTask, TaskCompletionPrompt } from './types';

export interface TaskCompletionResponse {
  taskId: string;
  completed: boolean;
  timestamp: number;
  conversationId: string;
}

class TaskCompletionPromptingService {
  private static instance: TaskCompletionPromptingService;
  private responseCounters: Map<string, number> = new Map();
  private pendingCompletions: Map<string, TaskCompletionResponse[]> = new Map();

  static getInstance(): TaskCompletionPromptingService {
    if (!TaskCompletionPromptingService.instance) {
      TaskCompletionPromptingService.instance = new TaskCompletionPromptingService();
    }
    return TaskCompletionPromptingService.instance;
  }

  /**
   * Check if we should show a task completion prompt
   */
  shouldShowCompletionPrompt(
    conversationId: string,
    userTier: 'free' | 'pro' | 'vanguard_pro',
    centralTasks: DiaryTask[],
    aiGeneratedTasks: DiaryTask[]
  ): boolean {
    const currentCount = this.responseCounters.get(conversationId) || 0;
    this.responseCounters.set(conversationId, currentCount + 1);

    // Free users logic
    if (userTier === 'free') {
      if (centralTasks.length === 0) {
        return false; // Show nothing if no central tasks
      }
      // Ask every 2-3 responses if central tasks exist
      return (currentCount + 1) % 3 === 0; // Every 3rd response
    }

    // Pro/Vanguard users logic
    if (userTier === 'pro' || userTier === 'vanguard_pro') {
      if (centralTasks.length > 0) {
        // Ask every 2-3 responses if central tasks exist
        return (currentCount + 1) % 3 === 0; // Every 3rd response
      } else {
        // Ask every 5-7 responses if no central tasks (about AI-generated tasks)
        return (currentCount + 1) % 6 === 0; // Every 6th response
      }
    }

    return false;
  }

  /**
   * Generate task completion prompt
   */
  generateCompletionPrompt(
    conversationId: string,
    userTier: 'free' | 'pro' | 'vanguard_pro',
    centralTasks: DiaryTask[],
    aiGeneratedTasks: DiaryTask[]
  ): TaskCompletionPrompt | null {
    if (!this.shouldShowCompletionPrompt(conversationId, userTier, centralTasks, aiGeneratedTasks)) {
      return null;
    }

    let tasksToAsk: DiaryTask[] = [];
    let promptText = '';

    if (userTier === 'free') {
      if (centralTasks.length === 0) {
        return null; // Show nothing for free users with no central tasks
      }
      // Select 1-2 manual tasks
      tasksToAsk = this.selectRelevantTasks(centralTasks, 2);
      promptText = `Have you completed any of these tasks?`;
    } else {
      // Pro/Vanguard users
      if (centralTasks.length > 0) {
        // Select 1-2 tasks from central (manual + AI-generated they added)
        tasksToAsk = this.selectRelevantTasks(centralTasks, 2);
        promptText = `Have you completed any of these tasks?`;
      } else {
        // Select 1-2 latest AI-generated tasks
        tasksToAsk = this.selectRelevantTasks(aiGeneratedTasks, 2);
        promptText = `Have you completed any of these recent objectives?`;
      }
    }

    if (tasksToAsk.length === 0) {
      return null;
    }

    return {
      id: `completion-prompt-${Date.now()}`,
      tasks: tasksToAsk,
      promptText,
      timestamp: Date.now(),
      conversationId,
      userTier
    };
  }

  /**
   * Select relevant tasks to ask about
   */
  private selectRelevantTasks(tasks: DiaryTask[], maxCount: number): DiaryTask[] {
    // Filter out completed tasks
    const incompleteTasks = tasks.filter(task => task.status !== 'completed');
    
    // Sort by priority: recent tasks first, then by category
    const sortedTasks = incompleteTasks.sort((a, b) => {
      // Prioritize recent tasks
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      if (Math.abs(aTime - bTime) > 24 * 60 * 60 * 1000) { // More than 1 day difference
        return bTime - aTime;
      }
      
      // Within same day, prioritize by category
      const categoryPriority = { 'boss': 1, 'quest': 2, 'exploration': 3, 'item': 4, 'character': 5, 'custom': 6 };
      return (categoryPriority[a.category] || 7) - (categoryPriority[b.category] || 7);
    });

    return sortedTasks.slice(0, maxCount);
  }

  /**
   * Record task completion response
   */
  recordCompletionResponse(
    conversationId: string,
    taskId: string,
    completed: boolean
  ): void {
    const response: TaskCompletionResponse = {
      taskId,
      completed,
      timestamp: Date.now(),
      conversationId
    };

    if (!this.pendingCompletions.has(conversationId)) {
      this.pendingCompletions.set(conversationId, []);
    }

    this.pendingCompletions.get(conversationId)!.push(response);
    console.log(`📝 Recorded completion response: ${taskId} - ${completed ? 'completed' : 'not completed'}`);
  }

  /**
   * Get pending completion responses for a conversation
   */
  getPendingCompletions(conversationId: string): TaskCompletionResponse[] {
    return this.pendingCompletions.get(conversationId) || [];
  }

  /**
   * Clear pending completions after processing
   */
  clearPendingCompletions(conversationId: string): void {
    this.pendingCompletions.delete(conversationId);
  }

  /**
   * Reset response counter for a conversation
   */
  resetResponseCounter(conversationId: string): void {
    this.responseCounters.delete(conversationId);
  }

  /**
   * Get current response count for a conversation
   */
  getResponseCount(conversationId: string): number {
    return this.responseCounters.get(conversationId) || 0;
  }

  /**
   * Format completion responses for AI context
   */
  formatCompletionContext(conversationId: string): string {
    const completions = this.getPendingCompletions(conversationId);
    if (completions.length === 0) {
      return '';
    }

    const completionTexts = completions.map(completion => {
      const status = completion.completed ? 'completed' : 'not completed';
      return `Task ${completion.taskId}: ${status}`;
    });

    return `[TASK_COMPLETION_UPDATES] User has provided the following task completion updates: ${completionTexts.join(', ')}. Use this information to update your understanding of the player's progress and avoid suggesting already completed tasks.`;
  }
}

export const taskCompletionPromptingService = TaskCompletionPromptingService.getInstance();
