import { supabase } from './supabase';


export interface CachedContent {
  id: string;
  contentType: 'welcome_prompts' | 'suggested_prompts' | 'game_news' | 'trending_topics';
  content: any;
  contentHash: string;
  lastUpdated: Date;
  expiresAt: Date;
  usageCount: number;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface ContentVariety {
  contentType: string;
  lastUsedIndex: number;
  contentPool: any[];
  lastRotation: Date;
  rotationInterval: number; // in hours
}

export interface GlobalContentConfig {
  cacheDurationHours: number;
  maxUsageCount: number;
  rotationIntervalHours: number;
  contentTypes: string[];
}

class GlobalContentCache {
  private static instance: GlobalContentCache;
  private cache: Map<string, CachedContent> = new Map();
  private contentVariety: Map<string, ContentVariety> = new Map();
  private lastGlobalUpdate: Date | null = null;
  private isUpdating: boolean = false;

  // Configuration
  private config: GlobalContentConfig = {
    cacheDurationHours: 24,
    maxUsageCount: 1000,
    rotationIntervalHours: 6,
    contentTypes: ['welcome_prompts', 'suggested_prompts', 'game_news', 'trending_topics']
  };

  static getInstance(): GlobalContentCache {
    if (!GlobalContentCache.instance) {
      GlobalContentCache.instance = new GlobalContentCache();
    }
    return GlobalContentCache.instance;
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Get cached content for a specific type
   */
  async getCachedContent(contentType: string): Promise<any | null> {
    try {
      // Check if we have valid cached content
      const cached = this.cache.get(contentType);
      if (cached && this.isContentValid(cached)) {
        // Increment usage count
        cached.usageCount++;
        
        // Check if we need to rotate content for variety
        if (this.shouldRotateContent(contentType)) {
          await this.rotateContent(contentType);
        }
        
        return this.getVariedContent(contentType);
      }

      // If no valid cache, try to get from database
      const dbContent = await this.getFromDatabase(contentType);
      if (dbContent && this.isContentValid(dbContent)) {
        this.cache.set(contentType, dbContent);
        return this.getVariedContent(contentType);
      }

      // If still no valid content, trigger global update
      if (!this.isUpdating && this.shouldTriggerGlobalUpdate()) {
        await this.triggerGlobalUpdate();
      }

      return null;
    } catch (error) {
      console.error('Error getting cached content:', error);
      return null;
    }
  }

  /**
   * Check if cached content is still valid
   */
  private isContentValid(content: CachedContent): boolean {
    const now = new Date();
    return (
      content.isActive &&
      content.expiresAt > now &&
      content.usageCount < this.config.maxUsageCount
    );
  }

  /**
   * Check if we should trigger a global update
   */
  private shouldTriggerGlobalUpdate(): boolean {
    if (!this.lastGlobalUpdate) return true;
    
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - this.lastGlobalUpdate.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceUpdate >= this.config.cacheDurationHours;
  }

  // ===== CONTENT VARIETY MANAGEMENT =====

  /**
   * Check if content should be rotated for variety
   */
  private shouldRotateContent(contentType: string): boolean {
    const variety = this.contentVariety.get(contentType);
    if (!variety) return false;

    const now = new Date();
    const hoursSinceRotation = (now.getTime() - variety.lastRotation.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceRotation >= variety.rotationInterval;
  }

  /**
   * Rotate content to provide variety
   */
  private async rotateContent(contentType: string): Promise<void> {
    try {
      const variety = this.contentVariety.get(contentType);
      if (!variety || variety.contentPool.length <= 1) return;

      // Move to next content item
      variety.lastUsedIndex = (variety.lastUsedIndex + 1) % variety.contentPool.length;
      variety.lastRotation = new Date();

      // Update database
      await this.updateContentVariety(contentType, variety);
    } catch (error) {
      console.error('Error rotating content:', error);
    }
  }

  /**
   * Get varied content to avoid repetition
   */
  private getVariedContent(contentType: string): any {
    const variety = this.contentVariety.get(contentType);
    if (!variety || variety.contentPool.length === 0) {
      return this.cache.get(contentType)?.content;
    }

    return variety.contentPool[variety.lastUsedIndex];
  }

  // ===== GLOBAL UPDATE TRIGGER =====

  /**
   * Trigger global content update using one user's query
   */
  private async triggerGlobalUpdate(): Promise<void> {
    if (this.isUpdating) return;

    this.isUpdating = true;
    try {
      console.log('🔄 Triggering global content update...');

      // Get a sample user query to generate fresh content
      const sampleQuery = await this.getSampleUserQuery();
      if (!sampleQuery) {
        console.log('No sample user query available for global update');
        return;
      }

      // Generate fresh content for all types
      await Promise.all([
        this.generateWelcomePrompts(sampleQuery),
        this.generateSuggestedPrompts(sampleQuery),
        this.generateGameNews(sampleQuery),
        this.generateTrendingTopics(sampleQuery)
      ]);

      this.lastGlobalUpdate = new Date();
      console.log('✅ Global content update completed');
    } catch (error) {
      console.error('Error in global content update:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Get a sample user query for content generation
   */
  private async getSampleUserQuery(): Promise<string | null> {
    try {
      // Get a recent user query from the database
      const { data, error } = await supabase
        .from('user_queries')
        .select('query_text, game_context')
        .eq('success', true)
        .not('query_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      // Combine query text with game context for better content generation
      const context = data.game_context ? `Game: ${JSON.stringify(data.game_context)}` : '';
      return `${data.query_text} ${context}`.trim();
    } catch (error) {
      console.error('Error getting sample user query:', error);
      return null;
    }
  }

  // ===== CONTENT GENERATION =====

  /**
   * Generate fresh welcome prompts
   */
  private async generateWelcomePrompts(sampleQuery: string): Promise<void> {
    try {
      // For now, use mock data instead of AI generation to avoid complex dependencies
      const mockPrompts = [
        "What games are you playing lately? I'd love to help you with strategies!",
        "Need help with a boss fight? I'm your gaming companion!",
        "Looking for game recommendations? I know all the latest releases!",
        "Stuck on a puzzle? Let me give you some hints!",
        "Want to discuss your favorite game? I'm all ears!"
      ];
      
      await this.updateCachedContent('welcome_prompts', mockPrompts, {
        source: 'mock_generated',
        sampleQuery: sampleQuery.substring(0, 100)
      });
    } catch (error) {
      console.error('Error generating welcome prompts:', error);
    }
  }

  /**
   * Generate fresh suggested prompts
   */
  private async generateSuggestedPrompts(sampleQuery: string): Promise<void> {
    try {
      // For now, use mock data instead of AI generation to avoid complex dependencies
      const mockPrompts = [
        { title: "Game Strategy Help", description: "Get tips for difficult levels or boss fights" },
        { title: "Game Recommendations", description: "Find new games based on your preferences" },
        { title: "Walkthrough Assistance", description: "Get help with specific game sections" },
        { title: "Gaming News", description: "Stay updated with latest gaming developments" },
        { title: "Community Discussion", description: "Discuss games with other players" },
        { title: "Performance Tips", description: "Optimize your gaming setup and settings" },
        { title: "Achievement Guide", description: "Help unlocking difficult achievements" },
        { title: "Multiplayer Strategy", description: "Improve your team play and tactics" }
      ];
      
      await this.updateCachedContent('suggested_prompts', mockPrompts, {
        source: 'mock_generated',
        sampleQuery: sampleQuery.substring(0, 100)
      });
    } catch (error) {
      console.error('Error generating suggested prompts:', error);
    }
  }

  /**
   * Generate fresh game news
   */
  private async generateGameNews(sampleQuery: string): Promise<void> {
    try {
      // For now, use mock data instead of AI generation to avoid complex dependencies
      const mockNews = [
        { title: "New Gaming Console Announced", summary: "Major gaming company reveals next-gen console", relevanceScore: 0.9 },
        { title: "Popular Game Gets Major Update", summary: "Beloved title receives significant content expansion", relevanceScore: 0.8 },
        { title: "Esports Tournament Results", summary: "Championship finals conclude with surprising outcome", relevanceScore: 0.7 },
        { title: "Indie Game Success Story", summary: "Small studio's game becomes unexpected hit", relevanceScore: 0.6 },
        { title: "Gaming Industry Trends", summary: "New report shows changing player preferences", relevanceScore: 0.5 },
        { title: "Upcoming Game Releases", summary: "Exciting titles scheduled for next quarter", relevanceScore: 0.8 }
      ];
      
      await this.updateCachedContent('game_news', mockNews, {
        source: 'mock_generated',
        sampleQuery: sampleQuery.substring(0, 100)
      });
    } catch (error) {
      console.error('Error generating game news:', error);
    }
  }

  /**
   * Generate fresh trending topics
   */
  private async generateTrendingTopics(sampleQuery: string): Promise<void> {
    try {
      // For now, use mock data instead of AI generation to avoid complex dependencies
      const mockTopics = [
        { topic: "Open World Games", description: "Players discussing latest open world experiences", popularityIndicator: "High" },
        { topic: "Retro Gaming Revival", description: "Classic games making a comeback", popularityIndicator: "Medium" },
        { topic: "Mobile Gaming Evolution", description: "Mobile games becoming more sophisticated", popularityIndicator: "High" },
        { topic: "VR Gaming Future", description: "Virtual reality gaming developments", popularityIndicator: "Medium" }
      ];
      
      await this.updateCachedContent('trending_topics', mockTopics, {
        source: 'mock_generated',
        sampleQuery: sampleQuery.substring(0, 100)
      });
    } catch (error) {
      console.error('Error generating trending topics:', error);
    }
  }

  // ===== DATABASE OPERATIONS =====

  /**
   * Update cached content in database
   */
  private async updateCachedContent(
    contentType: string, 
    content: any, 
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const contentHash = this.generateContentHash(content);
      const expiresAt = new Date(Date.now() + this.config.cacheDurationHours * 60 * 60 * 1000);

      const cachedContent: CachedContent = {
        id: crypto.randomUUID(),
        contentType: contentType as any,
        content,
        contentHash,
        lastUpdated: new Date(),
        expiresAt,
        usageCount: 0,
        isActive: true,
        metadata
      };

      // Update cache
      this.cache.set(contentType, cachedContent);

      // Update content variety
      await this.updateContentVariety(contentType, {
        contentType,
        lastUsedIndex: 0,
        contentPool: Array.isArray(content) ? content : [content],
        lastRotation: new Date(),
        rotationInterval: this.config.rotationIntervalHours
      });

      // Save to database
      await this.saveToDatabase(cachedContent);

      console.log(`✅ Updated cached content for ${contentType}`);
    } catch (error) {
      console.error('Error updating cached content:', error);
    }
  }

  /**
   * Get content from database
   */
  private async getFromDatabase(contentType: string): Promise<CachedContent | null> {
    try {
      const { data, error } = await supabase
        .from('global_content_cache')
        .select('*')
        .eq('content_type', contentType)
        .eq('is_active', true)
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        contentType: data.content_type,
        content: data.content,
        contentHash: data.content_hash,
        lastUpdated: new Date(data.last_updated),
        expiresAt: new Date(data.expires_at),
        usageCount: data.usage_count,
        isActive: data.is_active,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error getting content from database:', error);
      return null;
    }
  }

  /**
   * Save content to database
   */
  private async saveToDatabase(content: CachedContent): Promise<void> {
    try {
      const { error } = await supabase
        .from('global_content_cache')
        .upsert({
          id: content.id,
          content_type: content.contentType,
          content: content.content,
          content_hash: content.contentHash,
          last_updated: content.lastUpdated.toISOString(),
          expires_at: content.expiresAt.toISOString(),
          usage_count: content.usageCount,
          is_active: content.isActive,
          metadata: content.metadata
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error saving to database:', error);
      }
    } catch (error) {
      console.error('Error in saveToDatabase:', error);
    }
  }

  /**
   * Update content variety in database
   */
  private async updateContentVariety(
    contentType: string, 
    variety: ContentVariety
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_variety')
        .upsert({
          content_type: contentType,
          last_used_index: variety.lastUsedIndex,
          content_pool: variety.contentPool,
          last_rotation: variety.lastRotation.toISOString(),
          rotation_interval_hours: variety.rotationInterval
        }, {
          onConflict: 'content_type'
        });

      if (error) {
        console.error('Error updating content variety:', error);
      }
    } catch (error) {
      console.error('Error in updateContentVariety:', error);
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Parse JSON response from AI
   */
  private parseJSONResponse(response: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[.*\]|\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: try to parse the entire response
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      // Return fallback content
      return this.getFallbackContent();
    }
  }

  /**
   * Get fallback content if AI generation fails
   */
  private getFallbackContent(): any {
    return [
      "Tell me about your current game progress",
      "What challenges are you facing in your game?",
      "Share a screenshot of your current situation",
      "What would you like to achieve next?"
    ];
  }

  /**
   * Generate content hash for change detection
   */
  private generateContentHash(content: any): string {
    const contentString = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [type, content] of this.cache.entries()) {
      stats[type] = {
        isActive: content.isActive,
        usageCount: content.usageCount,
        lastUpdated: content.lastUpdated,
        expiresAt: content.expiresAt,
        isValid: this.isContentValid(content)
      };
    }

    return {
      cacheSize: this.cache.size,
      lastGlobalUpdate: this.lastGlobalUpdate,
      isUpdating: this.isUpdating,
      contentTypes: stats
    };
  }

  /**
   * Clear expired cache
   */
  async clearExpiredCache(): Promise<void> {
    const now = new Date();
    const expiredTypes: string[] = [];

    for (const [type, content] of this.cache.entries()) {
      if (content.expiresAt <= now || content.usageCount >= this.config.maxUsageCount) {
        expiredTypes.push(type);
      }
    }

    for (const type of expiredTypes) {
      this.cache.delete(type);
      this.contentVariety.delete(type);
    }

    if (expiredTypes.length > 0) {
      console.log(`🗑️ Cleared expired cache for: ${expiredTypes.join(', ')}`);
    }
  }

  /**
   * Force refresh of all content
   */
  async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing all content...');
    this.cache.clear();
    this.contentVariety.clear();
    this.lastGlobalUpdate = null;
    await this.triggerGlobalUpdate();
  }
}

export const globalContentCache = GlobalContentCache.getInstance();
