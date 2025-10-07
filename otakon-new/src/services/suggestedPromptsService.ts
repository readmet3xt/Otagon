// src/services/suggestedPromptsService.ts

import { newsPrompts } from '../types';

class SuggestedPromptsService {
  public getStaticNewsPrompts(): string[] {
    // Returns a shuffled array of 4 news prompts
    return [...newsPrompts].sort(() => 0.5 - Math.random());
  }
}

export const suggestedPromptsService = new SuggestedPromptsService();
