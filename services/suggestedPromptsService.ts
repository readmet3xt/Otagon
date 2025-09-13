class SuggestedPromptsService {
  private readonly STORAGE_KEY = 'otakon_used_suggested_prompts';
  private readonly LAST_RESET_KEY = 'otakon_suggested_prompts_last_reset';
  private readonly RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private usedPrompts: Set<string> = new Set();

  constructor() {
    this.loadUsedPrompts();
    this.checkAndResetIfNeeded();
  }

  private loadUsedPrompts(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const prompts = JSON.parse(stored);
        this.usedPrompts = new Set(prompts);
      }
    } catch (error) {
      console.warn('Failed to load used suggested prompts:', error);
      this.usedPrompts = new Set();
    }
  }

  private saveUsedPrompts(): void {
    try {
      const prompts = Array.from(this.usedPrompts);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prompts));
    } catch (error) {
      console.warn('Failed to save used suggested prompts:', error);
    }
  }

  /**
   * Check if 24 hours have passed since last reset and reset if needed
   */
  private checkAndResetIfNeeded(): void {
    try {
      const lastResetTime = localStorage.getItem(this.LAST_RESET_KEY);
      const now = Date.now();
      
      if (!lastResetTime || (now - parseInt(lastResetTime)) >= this.RESET_INTERVAL_MS) {
        console.log('🔄 24 hours passed - resetting suggested prompts for fresh daily news');
        this.resetUsedPrompts();
        localStorage.setItem(this.LAST_RESET_KEY, now.toString());
      }
    } catch (error) {
      console.warn('Failed to check/reset suggested prompts:', error);
    }
  }

  /**
   * Mark a prompt as used
   */
  markPromptAsUsed(prompt: string): void {
    this.usedPrompts.add(prompt);
    this.saveUsedPrompts();
  }

  /**
   * Check if a prompt has been used
   */
  isPromptUsed(prompt: string): boolean {
    return this.usedPrompts.has(prompt);
  }

  /**
   * Get all unused prompts from a list
   */
  getUnusedPrompts(prompts: string[]): string[] {
    return prompts.filter(prompt => !this.isPromptUsed(prompt));
  }

  /**
   * Check if all prompts have been used
   */
  areAllPromptsUsed(prompts: string[]): boolean {
    return prompts.every(prompt => this.isPromptUsed(prompt));
  }

  /**
   * Reset used prompts (called on app restart, login, or 24-hour interval)
   */
  resetUsedPrompts(): void {
    this.usedPrompts.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🔄 Suggested prompts reset - all 4 prompts will be available again');
  }

  /**
   * Get count of used prompts
   */
  getUsedCount(): number {
    return this.usedPrompts.size;
  }

  /**
   * Get count of total prompts
   */
  getTotalCount(prompts: string[]): number {
    return prompts.length;
  }

  /**
   * Get time until next reset (in milliseconds)
   */
  getTimeUntilNextReset(): number {
    try {
      const lastResetTime = localStorage.getItem(this.LAST_RESET_KEY);
      if (!lastResetTime) return 0;
      
      const nextResetTime = parseInt(lastResetTime) + this.RESET_INTERVAL_MS;
      return Math.max(0, nextResetTime - Date.now());
    } catch (error) {
      console.warn('Failed to calculate time until next reset:', error);
      return 0;
    }
  }
}

export const suggestedPromptsService = new SuggestedPromptsService();
