// src/services/aiService.ts

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { parseOtakonTags } from './otakonTags';
import { AIResponse, Conversation, User } from '../types';
import { getPromptForPersona } from './promptSystem';
import { cacheService } from './cacheService';

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

class AIService {
  private genAI: GoogleGenerativeAI;
  private flashModel: GenerativeModel;
  private proModel: GenerativeModel;

  constructor() {
    if (!API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY is not set in the environment variables.");
    }
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.flashModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    this.proModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  }

  /**
   * The main method to get a chat response. It determines the persona and calls the AI.
   */
  public async getChatResponse(
    conversation: Conversation,
    user: User,
    userMessage: string,
    isActiveSession: boolean,
    hasImages: boolean = false
  ): Promise<AIResponse> {
    // Generate the master prompt using the persona system
    const masterPrompt = await getPromptForPersona(conversation, userMessage, user, isActiveSession, hasImages);
    
    // Create cache key from the prompt
    const cacheKey = cacheService.createPromptCacheKey(masterPrompt);
    
    // 1. Check cache first
    const cachedResponse = await cacheService.getAIResponse<AIResponse>(cacheKey);
    if (cachedResponse) {
      return { ...cachedResponse, metadata: { ...cachedResponse.metadata, fromCache: true } };
    }
    
    // In a real scenario, you'd also pass image data if `hasImages` is true
    // For now, we're focusing on the text logic

    try {
      const result = await this.flashModel.generateContent(masterPrompt);
      const rawContent = await result.response.text();
      const { cleanContent, tags } = parseOtakonTags(rawContent);

      const aiResponse: AIResponse = {
        content: cleanContent,
        suggestions: tags.get('SUGGESTIONS') || [],
        otakonTags: tags,
        rawContent: rawContent,
        metadata: {
          model: 'gemini-2.5-flash',
          timestamp: Date.now(),
          cost: 0, // Placeholder
          tokens: 0, // Placeholder
        }
      };
      
      // 3. Store the new response in cache before returning
      await cacheService.setAIResponse(cacheKey, aiResponse);
      return aiResponse;

    } catch (error) {
      console.error("AI Service Error:", error);
      // Return a structured error response
      throw new Error("Failed to get response from AI service.");
    }
  }

  /**
   * Generates the structured JSON for the initial insight sub-tabs for a new game.
   * This method exclusively uses the Gemini 2.5 Pro model.
   */
  public async generateInitialInsights(gameTitle: string, genre: string): Promise<Record<string, string>> {
    const cacheKey = `insights-${gameTitle.toLowerCase().replace(/\s+/g, '-')}`;

    // 1. Check cache first
    const cachedInsights = await cacheService.getAIResponse<Record<string, string>>(cacheKey);
    if (cachedInsights) {
      return cachedInsights;
    }

    const { insightTabsConfig } = await import('../types');
    const subTabInstructions = (insightTabsConfig[genre] || insightTabsConfig['Default'])
        .map(tab => `- ${tab.title} (${tab.id}): ${tab.instruction}`)
        .join('\n');

    const proPrompt = `
      **Task:** Generate initial content for the insight tabs of the game "${gameTitle}", which is a/an "${genre}" game.
      **Format:** Respond with a single, minified JSON object. The keys of the object MUST be the tab IDs, and the values should be the generated content as a string.
      
      **Instructions for each tab:**
      ${subTabInstructions}

      **Rules:**
      - The content must be concise, spoiler-free, and suitable for a new player.
      - The output MUST be a valid, single-line JSON object with no extra formatting. Example: {"walkthrough":"Start by heading to the main gate...","tips":"Don't forget to save your game..."}
    `;

    try {
      const result = await this.proModel.generateContent(proPrompt);
      const rawJson = await result.response.text();
      // Clean up potential markdown code block fences
      const cleanedJson = rawJson.replace(/```json\n?|\n?```/g, '').trim();
      const insights = JSON.parse(cleanedJson);
      
      // 3. Store the new insights in cache
      await cacheService.setAIResponse(cacheKey, insights);
      return insights;
    } catch (error) {
      console.error("AI Service (Pro) Error generating initial insights:", error);
      // Return an empty object on failure so the app doesn't crash
      return {};
    }
  }
}

export const aiService = new AIService();
