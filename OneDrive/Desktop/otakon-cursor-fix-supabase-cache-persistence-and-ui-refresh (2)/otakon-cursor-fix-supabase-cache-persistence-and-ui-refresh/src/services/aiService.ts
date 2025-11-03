import { GoogleGenerativeAI, GenerativeModel, SchemaType, HarmCategory, HarmBlockThreshold, SafetySetting } from "@google/generative-ai";
import { parseOtakonTags } from './otakonTags';
import { AIResponse, Conversation, User, insightTabsConfig, PlayerProfile } from '../types';
import { cacheService } from './cacheService';
import { getPromptForPersona } from './promptSystem';
import { errorRecoveryService } from './errorRecoveryService';
import { characterImmersionService } from './characterImmersionService';
import { profileAwareTabService } from './profileAwareTabService';
import { toastService } from './toastService';
import { supabase } from '../lib/supabase';

// ✅ SECURITY FIX: Use Edge Function proxy instead of exposed API key
const USE_EDGE_FUNCTION = true; // Set to true to use secure server-side proxy
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY; // Only used if USE_EDGE_FUNCTION = false

// ✅ FIX 1: Gemini API Safety Settings
const SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

class AIService {
  private genAI: GoogleGenerativeAI;
  private flashModel: GenerativeModel;
  private proModel: GenerativeModel;
  private flashModelWithGrounding: GenerativeModel;
  private edgeFunctionUrl: string;

  constructor() {
    // ✅ SECURITY: Initialize Edge Function URL
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-proxy`;

    if (!USE_EDGE_FUNCTION) {
      // Legacy: Direct API mode (only for development/testing)
      if (!API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY is not set in the environment variables.");
      }
      this.genAI = new GoogleGenerativeAI(API_KEY);
      // Using the latest preview models (September 2025) for enhanced performance
      // ✅ FIX 2: Apply safety settings to all model initializations
      this.flashModel = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite-preview-09-2025",
        safetySettings: SAFETY_SETTINGS
      });
      this.proModel = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-preview-09-2025",
        safetySettings: SAFETY_SETTINGS
      });
      // ✅ NEW: Model with Google Search grounding enabled
      this.flashModelWithGrounding = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite-preview-09-2025",
        safetySettings: SAFETY_SETTINGS,
        tools: [{
          googleSearchRetrieval: {}
        }]
      });
    } else {
      // Edge Function mode: Initialize dummy models (won't be used)
      this.genAI = {} as GoogleGenerativeAI;
      this.flashModel = {} as GenerativeModel;
      this.proModel = {} as GenerativeModel;
      this.flashModelWithGrounding = {} as GenerativeModel;
    }
  }

  /**
   * ✅ SECURITY: Call Edge Function proxy instead of direct API
   */
  private async callEdgeFunction(request: {
    prompt: string;
    image?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    requestType: 'text' | 'image';
    model?: string;
    tools?: any[];
  }): Promise<{ response: string; success: boolean; usage?: any; groundingMetadata?: any }> {
    // Get user's JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call Edge Function (server-side proxy)
    const response = await fetch(this.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI service error');
    }

    return await response.json();
  }

  /**
   * ✅ FIX 3: Check if AI response was blocked by safety filters
   */
  private checkSafetyResponse(result: any): { safe: boolean; reason?: string } {
    // Check if prompt was blocked
    if (result.response.promptFeedback?.blockReason) {
      return {
        safe: false,
        reason: `Content blocked: ${result.response.promptFeedback.blockReason}`
      };
    }
    
    // Check if response was blocked by safety filters
    const candidate = result.response.candidates?.[0];
    if (!candidate) {
      return {
        safe: false,
        reason: 'No response generated'
      };
    }
    
    if (candidate.finishReason === 'SAFETY') {
      return {
        safe: false,
        reason: 'Response blocked by safety filters'
      };
    }
    
    return { safe: true };
  }

  /**
   * Main method to get AI chat response
   */
  public async getChatResponse(
    conversation: Conversation,
    user: User,
    userMessage: string,
    isActiveSession: boolean,
    hasImages: boolean = false,
    imageData?: string,
    abortSignal?: AbortSignal
  ): Promise<AIResponse> {
    // ✅ QUERY LIMIT: Check if user can send this query
    const { ConversationService } = await import('./conversationService');
    const queryCheck = hasImages 
      ? await ConversationService.canSendImageQuery()
      : await ConversationService.canSendTextQuery();
    
    if (!queryCheck.allowed) {
      // Throw error with upgrade prompt
      throw new Error(queryCheck.reason || 'Query limit reached. Please upgrade your tier.');
    }
    
    console.log(`📊 [AIService] Query limit check passed. ${hasImages ? 'Image' : 'Text'} queries: ${queryCheck.used}/${queryCheck.limit}`);
    
    // Create cache key for this request
    const cacheKey = `ai_response_${conversation.id}_${userMessage.substring(0, 50)}_${isActiveSession}`;
    
    // Check cache first (memory only for speed - skip Supabase for real-time operations)
    const cachedResponse = await cacheService.get<AIResponse>(cacheKey, true); // true = memory only
    if (cachedResponse) {
      return { ...cachedResponse, metadata: { ...cachedResponse.metadata, fromCache: true } };
    }

    // Skip session context for now - it's returning null and slowing things down
    // TODO: Implement proper session context when needed
    let sessionContext = '';

    // Get player profile from user preferences
    const playerProfile = user.profileData as any; // PlayerProfile is stored in profileData
    
    // Use the enhanced prompt system with session context and player profile
    const basePrompt = getPromptForPersona(
      conversation, 
      userMessage, 
      user, 
      isActiveSession, 
      hasImages,
      playerProfile
    );
    
    // Add immersion context for game conversations (not Game Hub)
    let immersionContext = '';
    if (!conversation.isGameHub && conversation.gameTitle && conversation.genre) {
      immersionContext = characterImmersionService.generateImmersionContext({
        gameTitle: conversation.gameTitle,
        genre: conversation.genre,
        currentLocation: conversation.activeObjective,
        playerProgress: conversation.gameProgress
      });
    }
    
    const prompt = basePrompt + sessionContext + '\n\n' + immersionContext;
    
    console.log('🤖 [AIService] Processing request:', { 
      hasImages, 
      hasImageData: !!imageData, 
      imageDataLength: imageData?.length,
      conversationId: conversation.id 
    });
    
    // Check if request was aborted before starting
    if (abortSignal?.aborted) {
      throw new DOMException('Request was aborted', 'AbortError');
    }
    
    try {
      // ✅ NEW: Determine if we should use grounding (web search)
      // Use grounding for ANY query that might need current information
      const needsWebSearch = 
        // Keywords that indicate need for current information
        userMessage.toLowerCase().includes('release') ||
        userMessage.toLowerCase().includes('new games') ||
        userMessage.toLowerCase().includes('coming out') ||
        userMessage.toLowerCase().includes('this week') ||
        userMessage.toLowerCase().includes('this month') ||
        userMessage.toLowerCase().includes('latest') ||
        userMessage.toLowerCase().includes('news') ||
        userMessage.toLowerCase().includes('announced') ||
        userMessage.toLowerCase().includes('update') ||
        userMessage.toLowerCase().includes('patch') ||
        userMessage.toLowerCase().includes('current') ||
        userMessage.toLowerCase().includes('recent') ||
        // Check if conversation is for a potentially new/unreleased game
        (conversation.gameTitle && (
          conversation.gameTitle.toLowerCase().includes('2025') ||
          conversation.gameTitle.toLowerCase().includes('2024')
        ));
      
      // Use grounding model for queries that need current information
      // ✅ SECURITY: Use Edge Function if enabled
      let rawContent: string;

      if (USE_EDGE_FUNCTION) {
        // Extract base64 image data if present
        let imageBase64: string | undefined;
        if (hasImages && imageData) {
          imageBase64 = imageData.split(',')[1];
        }

        // Determine which model and tools to use
        const modelName = needsWebSearch && !hasImages 
          ? 'gemini-2.5-flash-lite-preview-09-2025'
          : 'gemini-2.5-flash-lite-preview-09-2025';
        
        const tools = needsWebSearch && !hasImages 
          ? [{ googleSearchRetrieval: {} }]
          : [];

        // Call Edge Function proxy
        const edgeResponse = await this.callEdgeFunction({
          prompt,
          image: imageBase64,
          temperature: 0.7,
          maxTokens: 2048,
          requestType: hasImages ? 'image' : 'text',
          model: modelName,
          tools: tools.length > 0 ? tools : undefined
        });

        if (!edgeResponse.success) {
          throw new Error(edgeResponse.response || 'AI request failed');
        }

        rawContent = edgeResponse.response;

      } else {
        // Legacy: Direct API mode (only for development)
        // Note: Grounding doesn't work with image inputs, so fallback to regular model
        const modelToUse = needsWebSearch && !hasImages 
          ? this.flashModelWithGrounding 
          : this.flashModel;
        
        if (needsWebSearch && !hasImages) {
          console.log('🌐 [AIService] Using Google Search grounding for current information:', {
            gameTitle: conversation.gameTitle,
            query: userMessage.substring(0, 50) + '...'
          });
        }
        
        // Prepare content for Gemini API
        let content: any;
        if (hasImages && imageData) {
          // Extract MIME type from data URL
          const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';
          const base64Data = imageData.split(',')[1];
          
          // For image analysis, we need to send both text and image
          content = [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ];
        } else {
          // For text-only requests
          content = prompt;
        }
        
        const result = await modelToUse.generateContent(content);
        
        // ✅ FIX 4: Check safety response
        const safetyCheck = this.checkSafetyResponse(result);
        if (!safetyCheck.safe) {
          toastService.error('Unable to generate response due to content policy');
          throw new Error(safetyCheck.reason);
        }
        
        // Check if request was aborted after API call but before processing
        if (abortSignal?.aborted) {
          throw new DOMException('Request was aborted', 'AbortError');
        }
        
        rawContent = await result.response.text();
      }
      
      // Check if request was aborted after API call but before processing
      if (abortSignal?.aborted) {
        throw new DOMException('Request was aborted', 'AbortError');
      }
      const { cleanContent, tags } = parseOtakonTags(rawContent);

      const aiResponse: AIResponse = {
        content: cleanContent,
        suggestions: [],
        otakonTags: tags,
        rawContent: rawContent,
        metadata: {
          model: 'gemini-flash',
          timestamp: Date.now(),
          cost: 0, // Placeholder
          tokens: 0, // Placeholder
        }
      };
      
      // ✅ QUERY TRACKING: Record usage in database (non-blocking)
      const { SupabaseService } = await import('./supabaseService');
      const supabaseService = SupabaseService.getInstance();
      supabaseService.recordQuery(user.authUserId, hasImages ? 'image' : 'text')
        .catch(error => console.warn('Failed to record query usage:', error));
      
      // Invalidate user cache so next request gets fresh usage data
      const { authService } = await import('./authService');
      authService.refreshUser()
        .catch(error => console.warn('Failed to refresh user after query:', error));
      
      // Cache the response for 1 hour (non-blocking - fire and forget)
      cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000)
        .catch(error => console.warn('Failed to cache AI response:', error));
      
      return aiResponse;

    } catch (error) {
      console.error("AI Service Error:", error);
      
      // ✅ FIX 4: Enhanced error handling for safety blocks
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('blocked') || errorMessage.includes('SAFETY') || errorMessage.includes('content policy')) {
        toastService.error('Your message contains inappropriate content');
        throw new Error('Content blocked by safety filters');
      }
      
      toastService.error('AI response failed. Please try again.');
      
      // Use error recovery service
      const recoveryAction = await errorRecoveryService.handleAIError(
        error as Error,
        {
          operation: 'getChatResponse',
          conversationId: conversation.id,
          userId: user.id,
          timestamp: Date.now(),
          retryCount: 0
        }
      );
      
      if (recoveryAction.type === 'retry') {
        // Retry the request
        return this.getChatResponse(conversation, user, userMessage, isActiveSession, hasImages, imageData, abortSignal);
      } else if (recoveryAction.type === 'user_notification') {
        // Return a user-friendly error response
        return {
          content: recoveryAction.message || "I'm having trouble thinking right now. Please try again later.",
          suggestions: ["Try again", "Check your connection", "Contact support"],
          otakonTags: new Map(),
          rawContent: recoveryAction.message || "Error occurred",
          metadata: {
            model: 'error',
            timestamp: Date.now(),
            cost: 0,
            tokens: 0
          }
        };
      }
      
      throw new Error("Failed to get response from AI service.");
    }
  }

  /**
   * Enhanced method to get AI chat response with structured data
   * Returns enhanced AIResponse with optional fields for better integration
   * Falls back to OTAKON_TAG parsing if JSON mode fails
   */
  public async getChatResponseWithStructure(
    conversation: Conversation,
    user: User,
    userMessage: string,
    isActiveSession: boolean,
    hasImages: boolean = false,
    imageData?: string,
    abortSignal?: AbortSignal
  ): Promise<AIResponse> {
    // Create cache key for this request
    const cacheKey = `ai_structured_${conversation.id}_${userMessage.substring(0, 50)}_${isActiveSession}`;
    
    // Check cache first
    const cachedResponse = await cacheService.get<AIResponse>(cacheKey, true);
    if (cachedResponse) {
      return { ...cachedResponse, metadata: { ...cachedResponse.metadata, fromCache: true } };
    }

    // Get enhanced prompt with context
    const basePrompt = getPromptForPersona(conversation, userMessage, user, isActiveSession, hasImages);
    
    // Add immersion context for game conversations (not Game Hub)
    let immersionContext = '';
    if (!conversation.isGameHub && conversation.gameTitle && conversation.genre) {
      immersionContext = characterImmersionService.generateImmersionContext({
        gameTitle: conversation.gameTitle,
        genre: conversation.genre,
        currentLocation: conversation.activeObjective,
        playerProgress: conversation.gameProgress
      });
    }

    // Add structured response instructions
    const structuredInstructions = `

**ENHANCED RESPONSE FORMAT:**
In addition to your regular response, provide structured data in the following optional fields:

1. **followUpPrompts** (array of 3-4 strings): Generate contextual follow-up questions directly related to your response content
   ${!conversation.isGameHub ? `
   - Session Mode: ${isActiveSession ? 'PLAYING MODE - User is actively playing' : 'PLANNING MODE - User is preparing/strategizing'}
   - ${isActiveSession 
       ? 'Generate immediate, actionable prompts (e.g., "How do I beat this boss?", "What should I do next?")'
       : 'Generate strategic, planning prompts (e.g., "What should I prepare?", "What builds are recommended?")'
     }` : ''}
2. **progressiveInsightUpdates** (array): If conversation provides new info, update existing subtabs (e.g., story_so_far, characters)
3. **stateUpdateTags** (array): Detect game events (e.g., "OBJECTIVE_COMPLETE: true", "TRIUMPH: Boss Name")
4. **gamePillData** (object): ${conversation.isGameHub ? 'Set shouldCreate: true if user asks about a specific game, and include game details with pre-filled wikiContent' : 'Set shouldCreate: false (already in game tab)'}

Note: These are optional enhancements. If not applicable, omit or return empty arrays.
`;
    
    const prompt = basePrompt + immersionContext + structuredInstructions;
    
    console.log('🤖 [AIService] Processing structured request:', { 
      hasImages, 
      conversationId: conversation.id,
      useStructuredMode: !hasImages // Only use JSON mode for text
    });
    
    // Check if request was aborted
    if (abortSignal?.aborted) {
      throw new DOMException('Request was aborted', 'AbortError');
    }
    
    try {
      // ✅ NEW: Also use grounding for structured requests when appropriate
      const needsWebSearch = 
        userMessage.toLowerCase().includes('release') ||
        userMessage.toLowerCase().includes('new games') ||
        userMessage.toLowerCase().includes('latest') ||
        userMessage.toLowerCase().includes('news') ||
        userMessage.toLowerCase().includes('announced') ||
        userMessage.toLowerCase().includes('update') ||
        userMessage.toLowerCase().includes('patch') ||
        userMessage.toLowerCase().includes('current') ||
        userMessage.toLowerCase().includes('recent') ||
        (conversation.gameTitle && (
          conversation.gameTitle.toLowerCase().includes('2025') ||
          conversation.gameTitle.toLowerCase().includes('2024')
        ));
      
      // ✅ SECURITY: Use Edge Function for structured responses
      if (USE_EDGE_FUNCTION) {
        // Extract base64 image data if present
        let imageBase64: string | undefined;
        if (hasImages && imageData) {
          imageBase64 = imageData.split(',')[1];
        }

        const modelName = needsWebSearch && !hasImages 
          ? 'gemini-2.5-flash-lite-preview-09-2025'
          : 'gemini-2.5-flash-lite-preview-09-2025';
        
        const tools = needsWebSearch && !hasImages 
          ? [{ googleSearchRetrieval: {} }]
          : [];

        const edgeResponse = await this.callEdgeFunction({
          prompt,
          image: imageBase64,
          temperature: 0.7,
          maxTokens: 2048,
          requestType: hasImages ? 'image' : 'text',
          model: modelName,
          tools: tools.length > 0 ? tools : undefined
        });

        if (!edgeResponse.success) {
          throw new Error(edgeResponse.response || 'AI request failed');
        }

        const rawContent = edgeResponse.response;
        const { cleanContent, tags } = parseOtakonTags(rawContent);

        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: tags.get('SUGGESTIONS') || [],
          otakonTags: tags,
          rawContent: rawContent,
          metadata: {
            model: modelName,
            timestamp: Date.now(),
            cost: 0,
            tokens: 0,
          }
        };

        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        return aiResponse;
      }

      // Legacy: Direct API mode
      const modelToUse = needsWebSearch && !hasImages 
        ? this.flashModelWithGrounding 
        : this.flashModel;
      
      if (needsWebSearch && !hasImages) {
        console.log('🌐 [AIService] Using Google Search grounding for structured response:', {
          gameTitle: conversation.gameTitle,
          query: userMessage.substring(0, 50) + '...'
        });
      }
      
      // Prepare content
      let content: any;
      if (hasImages && imageData) {
        const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';
        const base64Data = imageData.split(',')[1];
        
        content = [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ];
        
        // For images, use regular mode (not JSON) because images don't work well with JSON schema
        const result = await modelToUse.generateContent(content);
        const rawContent = await result.response.text();
        const { cleanContent, tags } = parseOtakonTags(rawContent);
        
        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: tags.get('SUGGESTIONS') || [],
          otakonTags: tags,
          rawContent: rawContent,
          metadata: {
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            timestamp: Date.now(),
            cost: 0,
            tokens: 0,
          }
        };
        
        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        return aiResponse;
      }
      
      // For text-only, try JSON schema mode for structured response
      try {
        const result = await modelToUse.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                content: { type: SchemaType.STRING, description: "The main chat response for the user" },
                followUpPrompts: { 
                  type: SchemaType.ARRAY, 
                  items: { type: SchemaType.STRING },
                  description: "3-4 contextual follow-up questions"
                },
                progressiveInsightUpdates: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      tabId: { type: SchemaType.STRING },
                      title: { type: SchemaType.STRING },
                      content: { type: SchemaType.STRING }
                    }
                  }
                },
                stateUpdateTags: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                },
                gamePillData: {
                  type: SchemaType.OBJECT,
                  properties: {
                    shouldCreate: { type: SchemaType.BOOLEAN },
                    gameName: { type: SchemaType.STRING },
                    genre: { type: SchemaType.STRING },
                    wikiContent: { 
                      type: SchemaType.STRING,
                      description: "JSON string containing pre-filled subtab content"
                    }
                  }
                }
              },
              required: ["content"]
            }
          }
        });
        
        // ✅ FIX 5: Check safety response
        const safetyCheck = this.checkSafetyResponse(result);
        if (!safetyCheck.safe) {
          toastService.error('Unable to generate response due to content policy');
          throw new Error(safetyCheck.reason);
        }
        
        const rawResponse = await result.response.text();
        const structuredData = JSON.parse(rawResponse);
        
        // ✅ Clean content: Remove any JSON-like structured data from the main content
        let cleanContent = structuredData.content || '';
        
        // Remove structured fields if AI accidentally includes them in content
        // This handles cases where AI outputs: "Hint: ... followUpPrompts: [...]"
        cleanContent = cleanContent
          // Remove followUpPrompts section
          .replace(/followUpPrompts:\s*\[[\s\S]*?\](?=\s*(?:progressiveInsightUpdates|stateUpdateTags|gamePillData|$))/gi, '')
          // Remove progressiveInsightUpdates section
          .replace(/progressiveInsightUpdates:\s*\[[\s\S]*?\](?=\s*(?:followUpPrompts|stateUpdateTags|gamePillData|$))/gi, '')
          // Remove stateUpdateTags section
          .replace(/stateUpdateTags:\s*\[[\s\S]*?\](?=\s*(?:followUpPrompts|progressiveInsightUpdates|gamePillData|$))/gi, '')
          // Remove gamePillData section (most complex - handles multi-line objects)
          .replace(/gamePillData:\s*\{[\s\S]*?\}(?=\s*$)/gi, '')
          // Clean up any remaining JSON artifacts
          .replace(/\{[\s\S]*?"OTAKON_[A-Z_]+":[\s\S]*?\}/g, '')
          // Remove excessive newlines
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        // Parse wikiContent if it's a JSON string
        let gamePillData = structuredData.gamePillData;
        if (gamePillData && typeof gamePillData.wikiContent === 'string') {
          try {
            gamePillData = {
              ...gamePillData,
              wikiContent: JSON.parse(gamePillData.wikiContent)
            };
          } catch {
            // If parsing fails, keep it as is
            console.warn('Failed to parse wikiContent as JSON');
          }
        }
        
        // Build enhanced AIResponse
        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: structuredData.followUpPrompts || [],
          otakonTags: new Map(), // Empty for JSON mode
          rawContent: rawResponse,
          metadata: {
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            timestamp: Date.now(),
            cost: 0,
            tokens: 0,
          },
          // Enhanced fields
          followUpPrompts: structuredData.followUpPrompts,
          progressiveInsightUpdates: structuredData.progressiveInsightUpdates,
          stateUpdateTags: structuredData.stateUpdateTags,
          gamePillData
        };
        
        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        return aiResponse;
        
      } catch (jsonError) {
        console.warn('JSON mode failed, falling back to OTAKON_TAG parsing:', jsonError);
        
        // Fallback to regular OTAKON_TAG parsing
        let rawContent: string;

        if (USE_EDGE_FUNCTION) {
          // Use Edge Function for fallback
          const edgeResponse = await this.callEdgeFunction({
            prompt,
            temperature: 0.7,
            maxTokens: 2048,
            requestType: 'text',
            model: 'gemini-2.5-flash-lite-preview-09-2025'
          });

          if (!edgeResponse.success) {
            throw new Error(edgeResponse.response || 'AI request failed');
          }

          rawContent = edgeResponse.response;
        } else {
          // Legacy: Direct API
          const result = await modelToUse.generateContent(prompt);
          
          // ✅ FIX 5: Check safety response in fallback
          const safetyCheck = this.checkSafetyResponse(result);
          if (!safetyCheck.safe) {
            toastService.error('Unable to generate response due to content policy');
            throw new Error(safetyCheck.reason);
          }
          
          rawContent = await result.response.text();
        }

        const { cleanContent, tags } = parseOtakonTags(rawContent);
        
        const aiResponse: AIResponse = {
          content: cleanContent,
          suggestions: tags.get('SUGGESTIONS') || [],
          otakonTags: tags,
          rawContent: rawContent,
          metadata: {
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            timestamp: Date.now(),
            cost: 0,
            tokens: 0,
          }
        };
        
        cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000).catch(err => console.warn(err));
        return aiResponse;
      }
      
    } catch (error) {
      console.error("Structured AI Service Error:", error);
      
      // ✅ FIX 5: Enhanced error handling for safety blocks
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('blocked') || errorMessage.includes('SAFETY') || errorMessage.includes('content policy')) {
        toastService.error('Your message contains inappropriate content');
        throw new Error('Content blocked by safety filters');
      }
      
      toastService.error('AI response failed. Please try again.');
      
      // Use error recovery
      const recoveryAction = await errorRecoveryService.handleAIError(
        error as Error,
        {
          operation: 'getChatResponseWithStructure',
          conversationId: conversation.id,
          userId: user.id,
          timestamp: Date.now(),
          retryCount: 0
        }
      );
      
      if (recoveryAction.type === 'retry') {
        return this.getChatResponseWithStructure(conversation, user, userMessage, isActiveSession, hasImages, imageData, abortSignal);
      } else if (recoveryAction.type === 'user_notification') {
        return {
          content: recoveryAction.message || "I'm having trouble thinking right now. Please try again later.",
          suggestions: ["Try again", "Check your connection", "Contact support"],
          otakonTags: new Map(),
          rawContent: recoveryAction.message || "Error occurred",
          metadata: {
            model: 'error',
            timestamp: Date.now(),
            cost: 0,
            tokens: 0
          }
        };
      }
      
      throw new Error("Failed to get structured response from AI service.");
    }
  }

  /**
   * Generates initial sub-tab content for a new game
   */
  public async generateInitialInsights(
    gameTitle: string, 
    genre: string,
    playerProfile?: PlayerProfile,
    conversationContext?: string // ✅ NEW: Actual conversation messages for context-aware generation
  ): Promise<Record<string, string>> {
    // ✅ CRITICAL: Use conversation context in cache key if provided
    const contextHash = conversationContext 
      ? conversationContext.substring(0, 50).replace(/[^a-z0-9]/gi, '') 
      : 'default';
    const cacheKey = `insights_${gameTitle.toLowerCase().replace(/\s+/g, '-')}_${contextHash}`;
    
    // Check cache first
    const cachedInsights = await cacheService.get<Record<string, string>>(cacheKey);
    if (cachedInsights) {
      return cachedInsights;
    }

    const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
    const instructions = config
      .map(tab => `- ${tab.title} (${tab.id}): ${tab.instruction}`)
      .join('\n');

    // Get player profile context if available
    const profile = playerProfile || profileAwareTabService.getDefaultProfile();
    const profileContext = profileAwareTabService.buildProfileContext(profile);

    // ✅ CRITICAL: Include conversation context for relevant subtab generation
    const contextSection = conversationContext 
      ? `\nConversation Context:\n${conversationContext}\n\n✅ USE THIS CONTEXT to generate relevant subtab content based on what was discussed!\n` 
      : '';

    const prompt = `
You are a gaming assistant generating initial content for ${gameTitle} (${genre} game).

Player Profile:
${profileContext}
${contextSection}
Instructions for each tab:
${instructions}

CRITICAL FORMATTING RULES:
1. Return ONLY valid JSON, nothing else
2. Use this exact format: {"tab_id": "content", "tab_id": "content"}
3. Each content value should be 2-3 SHORT paragraphs
4. You MAY use markdown (**bold**, *italic*, ## headers) but MUST properly escape special characters:
   - Use \\" for quotes inside strings
   - Use \\n for newlines (do NOT use literal line breaks)
   - Use \\\\ for backslashes
5. Content must be concise, spoiler-free, and suitable for new players
6. Adapt content style based on the Player Profile above

Example valid JSON:
{
  "story_so_far": "You've just started your journey. The world is vast and mysterious.\\n\\nKey things to know: Stay alert and explore carefully.",
  "tips": "**Combat Tips:**\\n- Block incoming attacks\\n- Time your dodges carefully"
}

Generate the JSON now for these tab IDs: ${config.map(t => t.id).join(', ')}
`;

    try {
      let responseText: string;

      if (USE_EDGE_FUNCTION) {
        // Use Edge Function for insights generation
        const edgeResponse = await this.callEdgeFunction({
          prompt,
          temperature: 0.7,
          maxTokens: 2048,
          requestType: 'text',
          model: 'gemini-2.5-flash-preview-09-2025' // Use pro model for insights
        });

        if (!edgeResponse.success) {
          throw new Error(edgeResponse.response || 'AI request failed');
        }

        responseText = edgeResponse.response;
      } else {
        // Legacy: Direct API
        const result = await this.proModel.generateContent(prompt);
        
        // ✅ FIX 6: Check safety response
        const safetyCheck = this.checkSafetyResponse(result);
        if (!safetyCheck.safe) {
          toastService.error('Unable to generate insights due to content policy');
          throw new Error(safetyCheck.reason);
        }

        responseText = await result.response.text();
      }
      
      const cleanedJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      
      // ✅ FIX: Better JSON parsing with fallback
      let insights: Record<string, string>;
      try {
        insights = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error("JSON parse failed, attempting to fix malformed JSON:", parseError);
        console.error("Raw response (first 500 chars):", responseText.substring(0, 500));
        
        // Try to fix common JSON issues
        let fixedJson = cleanedJson;
        
        // Fix unterminated strings by adding closing quote before newline or end
        fixedJson = fixedJson.replace(/("(?:[^"\\]|\\.)*?)$/gm, '$1"');
        
        // Fix missing commas between properties
        fixedJson = fixedJson.replace(/"\s*\n\s*"/g, '",\n"');
        
        // Fix missing closing brace
        if (!fixedJson.endsWith('}')) {
          fixedJson += '}';
        }
        
        try {
          insights = JSON.parse(fixedJson);
          console.error("✅ Successfully fixed malformed JSON");
        } catch (_secondError) {
          console.error("❌ Could not fix JSON, using fallback content");
          // Return generic welcome content for each tab
          const config = insightTabsConfig[genre] || insightTabsConfig['Default'];
          insights = config.reduce((acc, tab) => {
            acc[tab.id] = `Welcome to **${tab.title}** for ${gameTitle}!\n\nThis section will be populated as you explore and chat about the game.`;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Cache for 24 hours
      await cacheService.set(cacheKey, insights, 24 * 60 * 60 * 1000);
      return insights;

    } catch (error) {
      console.error("Failed to generate initial insights:", error);
      
      // ✅ FIX 6: Enhanced error handling for safety blocks
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('blocked') || errorMessage.includes('SAFETY') || errorMessage.includes('content policy')) {
        toastService.warning('Unable to generate insights due to content policy');
        return {};
      }
      
      toastService.warning('Failed to generate game insights. You can still continue chatting!');
      return {};
    }
  }
}

export const aiService = new AIService();
