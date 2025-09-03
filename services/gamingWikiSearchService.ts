export interface WikiSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  relevance: number;
}

export interface WikiSearchResponse {
  success: boolean;
  results?: WikiSearchResult[];
  error?: string;
  totalResults?: number;
  searchTime?: number;
}

export interface GamingWikiSource {
  id: string;
  name: string;
  domain: string;
  category: 'franchise' | 'platform' | 'genre' | 'general';
  year?: number;
  relevance_score: number;
  is_active: boolean;
}

export class GamingWikiSearchService {
  private static instance: GamingWikiSearchService;
  private apiKey: string;
  private searchEngineId: string;
  private rateLimitReset: number = 0;
  private requestCount: number = 0;
  private readonly MAX_REQUESTS_PER_DAY = 10000; // Google Custom Search free tier
  private readonly MAX_REQUESTS_PER_SECOND = 10; // Conservative rate limiting

  // Curated list of trusted gaming wiki domains
  private readonly TRUSTED_WIKI_DOMAINS = [
    // Major Franchise Wikis
    'elderscrolls.fandom.com',
    'witcher.fandom.com',
    'fallout.fandom.com',
    'dragonage.fandom.com',
    'mass_effect.fandom.com',
    'assassinscreed.fandom.com',
    'callofduty.fandom.com',
    'battlefield.fandom.com',
    'fifa.fandom.com',
    'grandtheftauto.fandom.com',
    'zelda.fandom.com',
    'mario.fandom.com',
    'pokemon.fandom.com',
    'finalfantasy.fandom.com',
    'metalgear.fandom.com',
    'residentevil.fandom.com',
    'silenthill.fandom.com',
    'devilmaycry.fandom.com',
    'godofwar.fandom.com',
    'uncharted.fandom.com',
    
    // Platform Wikis
    'nintendo.fandom.com',
    'playstation.fandom.com',
    'xbox.fandom.com',
    'pcgamingwiki.com',
    'steam.fandom.com',
    'origin.fandom.com',
    'uplay.fandom.com',
    
    // Genre Wikis
    'rpg.fandom.com',
    'fps.fandom.com',
    'strategy.fandom.com',
    'adventure.fandom.com',
    'simulation.fandom.com',
    'racing.fandom.com',
    'fighting.fandom.com',
    'sports.fandom.com',
    'puzzle.fandom.com',
    
    // General Gaming Wikis
    'gaming.fandom.com',
    'videogame.fandom.com',
    'gamefaqs.fandom.com',
    'ign.fandom.com',
    'gamespot.fandom.com',
    'metacritic.fandom.com',
    
    // Retro Gaming Wikis
    'retrogaming.fandom.com',
    'classicgaming.fandom.com',
    'arcade.fandom.com',
    'console.fandom.com',
    
    // Indie Gaming Wikis
    'indiegame.fandom.com',
    'indiedb.fandom.com',
    'itchio.fandom.com'
  ];

  private constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Search credentials not found. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.');
    }
  }

  public static getInstance(): GamingWikiSearchService {
    if (!GamingWikiSearchService.instance) {
      GamingWikiSearchService.instance = new GamingWikiSearchService();
    }
    return GamingWikiSearchService.instance;
  }

  /**
   * Rate limiting to respect Google's API limits
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter if we're past the reset time
    if (now > this.rateLimitReset) {
      this.requestCount = 0;
      this.rateLimitReset = now + 1000; // Reset every second
    }

    // Check if we're at the limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_SECOND) {
      const waitTime = this.rateLimitReset - now;
      console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.rateLimitReset = Date.now() + 1000;
    }

    this.requestCount++;
  }

  /**
   * Search gaming wikis using Google Custom Search
   */
  async searchGamingWikis(
    query: string, 
    gameContext?: {
      year?: number;
      platform?: string;
      genre?: string;
      franchise?: string;
    },
    limit: number = 10
  ): Promise<WikiSearchResponse> {
    try {
      await this.checkRateLimit();
      
      if (!this.apiKey || !this.searchEngineId) {
        return {
          success: false,
          error: 'Google Search credentials not configured'
        };
      }

      const startTime = Date.now();
      
      // Build targeted search query
      let searchQuery = query;
      if (gameContext?.year) {
        searchQuery += ` ${gameContext.year}`;
      }
      if (gameContext?.platform) {
        searchQuery += ` ${gameContext.platform}`;
      }
      if (gameContext?.genre) {
        searchQuery += ` ${gameContext.genre}`;
      }
      if (gameContext?.franchise) {
        searchQuery += ` ${gameContext.franchise}`;
      }

      // Add site restrictions for trusted wiki domains
      const siteRestrictions = this.TRUSTED_WIKI_DOMAINS
        .map(domain => `site:${domain}`)
        .join(' OR ');

      const fullQuery = `${searchQuery} (${siteRestrictions})`;
      
      console.log(`🔍 Gaming Wiki Search: "${fullQuery}"`);
      
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('cx', this.searchEngineId);
      url.searchParams.set('q', fullQuery);
      url.searchParams.set('num', Math.min(limit, 10).toString()); // Google limit is 10
      url.searchParams.set('safe', 'active');
      url.searchParams.set('lr', 'lang_en');
      url.searchParams.set('sort', 'relevance');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Google Search API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Google Search API error: ${data.error.message}`);
      }

      const results: WikiSearchResult[] = (data.items || []).map((item: any, index: number) => ({
        title: item.title || 'Untitled',
        link: item.link || '',
        snippet: item.snippet || 'No description available',
        source: this.extractDomain(item.link),
        relevance: this.calculateRelevance(item, gameContext, index)
      }));

      const searchTime = Date.now() - startTime;
      
      console.log(`✅ Gaming Wiki Search successful: ${results.length} results in ${searchTime}ms`);
      
      return {
        success: true,
        results,
        totalResults: parseInt(data.searchInformation?.totalResults || '0'),
        searchTime
      };

    } catch (error) {
      console.error('❌ Gaming Wiki Search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search specific wiki categories
   */
  async searchWikiCategory(
    category: 'franchise' | 'platform' | 'genre' | 'general',
    query: string,
    limit: number = 5
  ): Promise<WikiSearchResponse> {
    try {
      await this.checkRateLimit();
      
      if (!this.apiKey || !this.searchEngineId) {
        return {
          success: false,
          error: 'Google Search credentials not configured'
        };
      }

      // Filter domains by category
      const categoryDomains = this.TRUSTED_WIKI_DOMAINS.filter(domain => {
        if (category === 'franchise') {
          return domain.includes('fandom.com') && !domain.includes('platform') && !domain.includes('genre');
        } else if (category === 'platform') {
          return domain.includes('nintendo') || domain.includes('playstation') || domain.includes('xbox') || domain.includes('pc');
        } else if (category === 'genre') {
          return domain.includes('rpg') || domain.includes('fps') || domain.includes('strategy') || domain.includes('adventure');
        } else {
          return domain.includes('gaming') || domain.includes('game') || domain.includes('videogame');
        }
      });

      const siteRestrictions = categoryDomains
        .map(domain => `site:${domain}`)
        .join(' OR ');

      const fullQuery = `${query} (${siteRestrictions})`;
      
      console.log(`🔍 Wiki Category Search: ${category} - "${fullQuery}"`);
      
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('cx', this.searchEngineId);
      url.searchParams.set('q', fullQuery);
      url.searchParams.set('num', Math.min(limit, 10).toString());
      url.searchParams.set('safe', 'active');
      url.searchParams.set('lr', 'lang_en');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Google Search API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Google Search API error: ${data.error.message}`);
      }

      const results: WikiSearchResult[] = (data.items || []).map((item: any, index: number) => ({
        title: item.title || 'Untitled',
        link: item.link || '',
        snippet: item.snippet || 'No description available',
        source: this.extractDomain(item.link),
        relevance: this.calculateRelevance(item, { genre: category }, index)
      }));

      console.log(`✅ Wiki Category Search successful: ${results.length} results for ${category}`);
      
      return {
        success: true,
        results,
        totalResults: parseInt(data.searchInformation?.totalResults || '0')
      };

    } catch (error) {
      console.error('❌ Wiki Category Search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search for specific game information across wikis
   */
  async searchGameSpecificWikis(
    gameName: string,
    gameContext: {
      year?: number;
      platform?: string;
      genre?: string;
      franchise?: string;
    },
    searchType: 'lore' | 'walkthrough' | 'mechanics' | 'secrets' | 'general' = 'general'
  ): Promise<WikiSearchResponse> {
    try {
      let searchQuery = gameName;
      
      // Add search type context
      switch (searchType) {
        case 'lore':
          searchQuery += ' story lore background world history';
          break;
        case 'walkthrough':
          searchQuery += ' walkthrough guide tips strategy';
          break;
        case 'mechanics':
          searchQuery += ' gameplay mechanics controls systems';
          break;
        case 'secrets':
          searchQuery += ' secrets hidden easter eggs collectibles';
          break;
        default:
          searchQuery += ' guide information';
      }

      // Add game context
      if (gameContext.year) {
        searchQuery += ` ${gameContext.year}`;
      }
      if (gameContext.platform) {
        searchQuery += ` ${gameContext.platform}`;
      }
      if (gameContext.genre) {
        searchQuery += ` ${gameContext.genre}`;
      }
      if (gameContext.franchise) {
        searchQuery += ` ${gameContext.franchise}`;
      }

      console.log(`🔍 Game-Specific Wiki Search: "${gameName}" - ${searchType}`);
      
      return await this.searchGamingWikis(searchQuery, gameContext, 15);

    } catch (error) {
      console.error('❌ Game-Specific Wiki Search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(
    item: any, 
    gameContext?: any, 
    position: number = 0
  ): number {
    let relevance = 100 - (position * 5); // Position-based scoring
    
    // Boost relevance for exact matches
    if (gameContext?.year && item.snippet?.includes(gameContext.year.toString())) {
      relevance += 20;
    }
    if (gameContext?.platform && item.snippet?.toLowerCase().includes(gameContext.platform.toLowerCase())) {
      relevance += 15;
    }
    if (gameContext?.genre && item.snippet?.toLowerCase().includes(gameContext.genre.toLowerCase())) {
      relevance += 15;
    }
    
    // Boost for trusted sources
    if (item.link?.includes('fandom.com')) {
      relevance += 10;
    }
    
    return Math.max(0, Math.min(100, relevance));
  }

  /**
   * Get all trusted wiki domains
   */
  getTrustedWikiDomains(): string[] {
    return [...this.TRUSTED_WIKI_DOMAINS];
  }

  /**
   * Add new wiki domain to trusted list
   */
  addTrustedWikiDomain(domain: string, category: 'franchise' | 'platform' | 'genre' | 'general' = 'general'): void {
    if (!this.TRUSTED_WIKI_DOMAINS.includes(domain)) {
      this.TRUSTED_WIKI_DOMAINS.push(domain);
      console.log(`✅ Added new trusted wiki domain: ${domain} (${category})`);
    }
  }

  /**
   * Remove wiki domain from trusted list
   */
  removeTrustedWikiDomain(domain: string): void {
    const index = this.TRUSTED_WIKI_DOMAINS.indexOf(domain);
    if (index > -1) {
      this.TRUSTED_WIKI_DOMAINS.splice(index, 1);
      console.log(`❌ Removed wiki domain: ${domain}`);
    }
  }

  /**
   * Health check for wiki search service
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      if (!this.apiKey || !this.searchEngineId) {
        return {
          healthy: false,
          message: 'Google Search credentials not configured'
        };
      }

      // Test with a simple search
      const testResult = await this.searchGamingWikis('test', {}, 1);
      
      if (testResult.success) {
        return {
          healthy: true,
          message: 'Gaming Wiki Search service is healthy and ready'
        };
      } else {
        return {
          healthy: false,
          message: `Test search failed: ${testResult.error}`
        };
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Wiki Search service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const gamingWikiSearchService = GamingWikiSearchService.getInstance();
