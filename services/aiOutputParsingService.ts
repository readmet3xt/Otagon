import { z } from 'zod';

// Schema definitions for AI output validation
export const GameDataSchema = z.object({
  game_name: z.string().min(1, 'Game name is required'),
  igdb_id: z.union([z.string(), z.number()]).optional(),
  platform: z.string().optional(),
  release_date: z.string().optional(),
  genre: z.string().optional()
});

export const AITaskSchema = z.array(z.string().min(1, 'Task description is required'));

export const InsightUpdateSchema = z.object({
  id: z.string().min(1, 'Insight ID is required'),
  content: z.string().min(1, 'Content is required'),
  source: z.string().optional(),
  last_updated: z.string().optional()
});

export const InsightModifyPendingSchema = z.object({
  id: z.string().min(1, 'Insight ID is required'),
  title: z.string().optional(),
  content: z.string().optional()
});

export const InsightDeleteRequestSchema = z.object({
  id: z.string().min(1, 'Insight ID is required')
});

export const ObjectiveSetSchema = z.object({
  description: z.string().min(1, 'Objective description is required')
});

export type GameData = z.infer<typeof GameDataSchema>;
export type AITask = z.infer<typeof AITaskSchema>;
export type InsightUpdate = z.infer<typeof InsightUpdateSchema>;
export type InsightModifyPending = z.infer<typeof InsightModifyPendingSchema>;
export type InsightDeleteRequest = z.infer<typeof InsightDeleteRequestSchema>;
export type ObjectiveSet = z.infer<typeof ObjectiveSetSchema>;

export interface ParsedAIOutput {
  gameData?: GameData;
  aiTasks?: AITask;
  insightUpdate?: InsightUpdate;
  insightModifyPending?: InsightModifyPending;
  insightDeleteRequest?: InsightDeleteRequest;
  objectiveSet?: ObjectiveSet;
  objectiveComplete?: boolean;
  suggestions?: string[];
  rawText?: string;
  parsingErrors?: string[];
}

export class AIOutputParsingService {
  private static instance: AIOutputParsingService;

  private constructor() {}

  public static getInstance(): AIOutputParsingService {
    if (!AIOutputParsingService.instance) {
      AIOutputParsingService.instance = new AIOutputParsingService();
    }
    return AIOutputParsingService.instance;
  }

  /**
   * Layer 1: Robust regex extraction with fallbacks
   */
  private extractWithRegex(text: string, pattern: RegExp): string | null {
    try {
      const match = text.match(pattern);
      return match ? match[1]?.trim() || null : null;
    } catch (error) {
      console.warn('Regex extraction failed:', error);
      return null;
    }
  }

  /**
   * Layer 2: Safe JSON parsing with error handling
   */
  private safeJsonParse(jsonString: string, context: string): any {
    try {
      // Clean the JSON string
      const cleaned = jsonString
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\r/g, ' ') // Replace carriage returns with spaces
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .trim();

      return JSON.parse(cleaned);
    } catch (error) {
      console.warn(`JSON parsing failed for ${context}:`, error);
      console.warn('Raw JSON string:', jsonString);
      return null;
    }
  }

  /**
   * Layer 3: Schema validation with Zod
   */
  private validateWithSchema<T>(data: any, schema: z.ZodSchema<T>, context: string): T | null {
    try {
      const result = schema.safeParse(data);
      if (result.success) {
        return result.data;
      } else {
        console.warn(`Schema validation failed for ${context}:`, result.error.errors);
        return null;
      }
    } catch (error) {
      console.warn(`Schema validation error for ${context}:`, error);
      return null;
    }
  }

  /**
   * Parse AI output with multi-layered approach
   */
  parseAIOutput(rawText: string): ParsedAIOutput {
    const result: ParsedAIOutput = {
      rawText,
      parsingErrors: []
    };

    try {
      // 1. Parse Game Data
      const gameDataMatch = this.extractWithRegex(
        rawText,
        /\[OTAKON_GAME_DATA:\s*(\{.*?\})\]/s
      );
      
      if (gameDataMatch) {
        const parsedGameData = this.safeJsonParse(gameDataMatch, 'Game Data');
        if (parsedGameData) {
          const validatedGameData = this.validateWithSchema(parsedGameData, GameDataSchema, 'Game Data');
          if (validatedGameData) {
            result.gameData = validatedGameData;
          } else {
            result.parsingErrors?.push('Game data schema validation failed');
          }
        } else {
          result.parsingErrors?.push('Game data JSON parsing failed');
        }
      }

      // 2. Parse AI Tasks
      const aiTasksMatch = this.extractWithRegex(
        rawText,
        /\[OTAKON_AI_TASKS:\s*(\[.*?\])\]/s
      );
      
      if (aiTasksMatch) {
        const parsedAITasks = this.safeJsonParse(aiTasksMatch, 'AI Tasks');
        if (parsedAITasks) {
          const validatedAITasks = this.validateWithSchema(parsedAITasks, AITaskSchema, 'AI Tasks');
          if (validatedAITasks) {
            result.aiTasks = validatedAITasks;
          } else {
            result.parsingErrors?.push('AI tasks schema validation failed');
          }
        } else {
          result.parsingErrors?.push('AI tasks JSON parsing failed');
        }
      }

      // 3. Parse Insight Update
      const insightUpdateMatch = this.extractWithRegex(
        rawText,
        /\[OTAKON_INSIGHT_UPDATE:\s*(\{.*?\})\]/s
      );
      
      if (insightUpdateMatch) {
        const parsedInsightUpdate = this.safeJsonParse(insightUpdateMatch, 'Insight Update');
        if (parsedInsightUpdate) {
          const validatedInsightUpdate = this.validateWithSchema(parsedInsightUpdate, InsightUpdateSchema, 'Insight Update');
          if (validatedInsightUpdate) {
            result.insightUpdate = validatedInsightUpdate;
          } else {
            result.parsingErrors?.push('Insight update schema validation failed');
          }
        } else {
          result.parsingErrors?.push('Insight update JSON parsing failed');
        }
      }

      // 4. Parse Insight Modify Pending
      const insightModifyMatch = this.extractWithRegex(
        rawText,
        /\[OTAKON_INSIGHT_MODIFY_PENDING:\s*(\{.*?\})\]/s
      );
      
      if (insightModifyMatch) {
        const parsedInsightModify = this.safeJsonParse(insightModifyMatch, 'Insight Modify Pending');
        if (parsedInsightModify) {
          const validatedInsightModify = this.validateWithSchema(parsedInsightModify, InsightModifyPendingSchema, 'Insight Modify Pending');
          if (validatedInsightModify) {
            result.insightModifyPending = validatedInsightModify;
          } else {
            result.parsingErrors?.push('Insight modify pending schema validation failed');
          }
        } else {
          result.parsingErrors?.push('Insight modify pending JSON parsing failed');
        }
      }

      // 5. Parse Insight Delete Request
      const insightDeleteMatch = this.extractWithRegex(
        rawText,
        /\[OTAKON_INSIGHT_DELETE_REQUEST:\s*(\{.*?\})\]/s
      );
      
      if (insightDeleteMatch) {
        const parsedInsightDelete = this.safeJsonParse(insightDeleteMatch, 'Insight Delete Request');
        if (parsedInsightDelete) {
          const validatedInsightDelete = this.validateWithSchema(parsedInsightDelete, InsightDeleteRequestSchema, 'Insight Delete Request');
          if (validatedInsightDelete) {
            result.insightDeleteRequest = validatedInsightDelete;
          } else {
            result.parsingErrors?.push('Insight delete request schema validation failed');
          }
        } else {
          result.parsingErrors?.push('Insight delete request JSON parsing failed');
        }
      }

      // 6. Parse Objective Set
      const objectiveSetMatch = this.extractWithRegex(
        rawText,
        /\[OTAKON_OBJECTIVE_SET:\s*(\{.*?\})\]/s
      );
      
      if (objectiveSetMatch) {
        const parsedObjectiveSet = this.safeJsonParse(objectiveSetMatch, 'Objective Set');
        if (parsedObjectiveSet) {
          const validatedObjectiveSet = this.validateWithSchema(parsedObjectiveSet, ObjectiveSetSchema, 'Objective Set');
          if (validatedObjectiveSet) {
            result.objectiveSet = validatedObjectiveSet;
          } else {
            result.parsingErrors?.push('Objective set schema validation failed');
          }
        } else {
          result.parsingErrors?.push('Objective set JSON parsing failed');
        }
      }

      // 7. Parse Objective Complete
      if (rawText.includes('[OTAKON_OBJECTIVE_COMPLETE: true]')) {
        result.objectiveComplete = true;
      }

      // 8. Parse Suggestions
      const suggestionsMatch = this.extractWithRegex(
        rawText,
        /\[OTAKON_SUGGESTIONS:\s*(\[.*?\])\]/s
      );
      
      if (suggestionsMatch) {
        try {
          const suggestions = JSON.parse(suggestionsMatch);
          if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
            result.suggestions = suggestions;
          } else {
            result.parsingErrors?.push('Suggestions format invalid');
          }
        } catch (error) {
          result.parsingErrors?.push('Suggestions JSON parsing failed');
        }
      }

      // Log parsing results
      if (result.parsingErrors && result.parsingErrors.length > 0) {
        console.warn('AI Output parsing completed with errors:', result.parsingErrors);
      } else {
        console.log('✅ AI Output parsing completed successfully');
      }

      return result;

    } catch (error) {
      console.error('❌ AI Output parsing failed:', error);
      result.parsingErrors?.push(`Critical parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Parse specific tag with error handling
   */
  parseSpecificTag<T>(
    rawText: string, 
    tagName: string, 
    schema: z.ZodSchema<T>
  ): T | null {
    try {
      const pattern = new RegExp(`\\[${tagName}:\\s*(\\{.*?\\})\\]`, 's');
      const match = this.extractWithRegex(rawText, pattern);
      
      if (!match) return null;
      
      const parsed = this.safeJsonParse(match, tagName);
      if (!parsed) return null;
      
      return this.validateWithSchema(parsed, schema, tagName);
    } catch (error) {
      console.warn(`Failed to parse ${tagName}:`, error);
      return null;
    }
  }

  /**
   * Validate and clean AI output before parsing
   */
  preprocessAIOutput(rawText: string): string {
    try {
      return rawText
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\r/g, '\n') // Convert carriage returns to newlines
        .trim();
    } catch (error) {
      console.warn('AI output preprocessing failed:', error);
      return rawText; // Return original if preprocessing fails
    }
  }

  /**
   * Extract plain text without tags
   */
  extractPlainText(rawText: string): string {
    try {
      // Remove all OTAKON tags
      return rawText
        .replace(/\[OTAKON_[^\]]*\]/g, '') // Remove all OTAKON tags
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();
    } catch (error) {
      console.warn('Plain text extraction failed:', error);
      return rawText;
    }
  }

  /**
   * Health check for parsing service
   */
  healthCheck(): { healthy: boolean; message: string } {
    try {
      // Test parsing with sample data
      const testOutput = `
        [OTAKON_GAME_DATA: {"game_name": "Test Game", "platform": "PC"}]
        [OTAKON_AI_TASKS: ["Task 1", "Task 2"]]
        [OTAKON_SUGGESTIONS: ["Suggestion 1", "Suggestion 2"]]
      `;
      
      const result = this.parseAIOutput(testOutput);
      
      if (result.gameData && result.aiTasks && result.suggestions) {
        return {
          healthy: true,
          message: 'AI Output Parsing service is healthy and ready'
        };
      } else {
        return {
          healthy: false,
          message: 'Test parsing failed - some expected data missing'
        };
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Parsing service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const aiOutputParsingService = AIOutputParsingService.getInstance();
