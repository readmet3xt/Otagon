import { createClient } from '@supabase/supabase-js';

export interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  release_dates?: Array<{
    human: string;
    y: number;
    m: number;
    d: number;
  }>;
  platforms?: Array<{
    name: string;
    id: number;
  }>;
  genres?: Array<{
    name: string;
    id: number;
  }>;
  themes?: Array<{
    name: string;
    id: number;
  }>;
  developer?: {
    name: string;
    id: number;
  };
  publisher?: {
    name: string;
    id: number;
  };
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  screenshots?: Array<{
    url: string;
    id: number;
  }>;
  cover?: {
    url: string;
    id: number;
  };
  artworks?: Array<{
    url: string;
    id: number;
  }>;
  videos?: Array<{
    name: string;
    video_id: string;
    id: number;
  }>;
  websites?: Array<{
    url: string;
    category: number;
    id: number;
  }>;
  franchise?: {
    name: string;
    id: number;
  };
  game_modes?: Array<{
    name: string;
    id: number;
  }>;
  characters?: Array<{
    name: string;
    description?: string;
    id: number;
  }>;
}

export interface IGDBGameSearchResult {
  success: boolean;
  data?: IGDBGame[];
  error?: string;
  totalResults?: number;
}

export class IGDBService {
  private static instance: IGDBService;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private rateLimitReset: number = 0;
  private requestCount: number = 0;
  private readonly MAX_REQUESTS_PER_SECOND = 4; // IGDB free tier limit

  private constructor() {
    this.clientId = process.env.IGDB_CLIENT_ID || '';
    this.clientSecret = process.env.IGDB_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('IGDB credentials not found. Please set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET environment variables.');
    }
  }

  public static getInstance(): IGDBService {
    if (!IGDBService.instance) {
      IGDBService.instance = new IGDBService();
    }
    return IGDBService.instance;
  }

  /**
   * Get IGDB access token with automatic refresh
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`
      });

      if (!response.ok) {
        throw new Error(`IGDB token request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      console.log('🔑 IGDB access token refreshed successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get IGDB access token:', error);
      throw new Error('IGDB authentication failed');
    }
  }

  /**
   * Rate limiting to respect IGDB's 4 requests/second limit
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
   * Search games with comprehensive data
   */
  async searchGames(query: string, includeStory: boolean = false): Promise<IGDBGameSearchResult> {
    try {
      await this.checkRateLimit();
      
      if (!this.clientId || !this.clientSecret) {
        return {
          success: false,
          error: 'IGDB credentials not configured'
        };
      }

      const token = await this.getAccessToken();
      
      const fields = [
        'name', 'summary', 'storyline', 'release_dates.human', 'release_dates.y', 'release_dates.m', 'release_dates.d',
        'platforms.name', 'platforms.id', 'genres.name', 'genres.id', 'themes.name', 'themes.id',
        'developer.name', 'developer.id', 'publisher.name', 'publisher.id', 'rating', 'rating_count',
        'aggregated_rating', 'aggregated_rating_count', 'screenshots.url', 'screenshots.id',
        'cover.url', 'cover.id', 'artworks.url', 'artworks.id', 'videos.name', 'videos.video_id', 'videos.id',
        'websites.url', 'websites.category', 'websites.id', 'franchise.name', 'franchise.id',
        'game_modes.name', 'game_modes.id'
      ];

      if (includeStory) {
        fields.push('characters.name', 'characters.description', 'characters.id');
      }

      const searchQuery = `search "${query}"; fields ${fields.join(',')}; limit 10;`;
      
      console.log(`🔍 IGDB Search: "${query}"`);
      
      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: searchQuery
      });

      if (!response.ok) {
        throw new Error(`IGDB API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ IGDB Search successful: ${data.length} results for "${query}"`);
      
      return {
        success: true,
        data: data as IGDBGame[],
        totalResults: data.length
      };

    } catch (error) {
      console.error('❌ IGDB search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get game by ID for detailed info
   */
  async getGameById(gameId: number): Promise<IGDBGameSearchResult> {
    try {
      await this.checkRateLimit();
      
      if (!this.clientId || !this.clientSecret) {
        return {
          success: false,
          error: 'IGDB credentials not configured'
        };
      }

      const token = await this.getAccessToken();
      
      console.log(`🔍 IGDB Get Game: ID ${gameId}`);
      
      const response = await fetch(`https://api.igdb.com/v4/games/${gameId}`, {
        method: 'POST',
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: 'fields *;'
      });

      if (!response.ok) {
        throw new Error(`IGDB API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ IGDB Get Game successful: ${data[0]?.name || 'Unknown'}`);
      
      return {
        success: true,
        data: data as IGDBGame[],
        totalResults: data.length
      };

    } catch (error) {
      console.error('❌ IGDB get game failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get top games by year
   */
  async getTopGamesByYear(year: number, limit: number = 100): Promise<IGDBGameSearchResult> {
    try {
      await this.checkRateLimit();
      
      if (!this.clientId || !this.clientSecret) {
        return {
          success: false,
          error: 'IGDB credentials not configured'
        };
      }

      const token = await this.getAccessToken();
      
      console.log(`🔍 IGDB Top Games: Year ${year}, Limit ${limit}`);
      
      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: `fields name,summary,release_dates.human,release_dates.y,platforms.name,platforms.id,rating,rating_count,genres.name,genres.id; where release_dates.y = ${year} & rating_count > 10; sort rating desc; limit ${limit};`
      });

      if (!response.ok) {
        throw new Error(`IGDB API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ IGDB Top Games successful: ${data.length} results for year ${year}`);
      
      return {
        success: true,
        data: data as IGDBGame[],
        totalResults: data.length
      };

    } catch (error) {
      console.error('❌ IGDB top games failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get games by platform
   */
  async getGamesByPlatform(platformName: string, limit: number = 50): Promise<IGDBGameSearchResult> {
    try {
      await this.checkRateLimit();
      
      if (!this.clientId || !this.clientSecret) {
        return {
          success: false,
          error: 'IGDB credentials not configured'
        };
      }

      const token = await this.getAccessToken();
      
      console.log(`🔍 IGDB Platform Games: ${platformName}, Limit ${limit}`);
      
      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: `fields name,summary,release_dates.human,rating,rating_count,genres.name,genres.id; where platforms.name ~ *"${platformName}"* & rating_count > 5; sort rating desc; limit ${limit};`
      });

      if (!response.ok) {
        throw new Error(`IGDB API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ IGDB Platform Games successful: ${data.length} results for ${platformName}`);
      
      return {
        success: true,
        data: data as IGDBGame[],
        totalResults: data.length
      };

    } catch (error) {
      console.error('❌ IGDB platform games failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get games by genre
   */
  async getGamesByGenre(genreName: string, limit: number = 50): Promise<IGDBGameSearchResult> {
    try {
      await this.checkRateLimit();
      
      if (!this.clientId || !this.clientSecret) {
        return {
          success: false,
          error: 'IGDB credentials not configured'
        };
      }

      const token = await this.getAccessToken();
      
      console.log(`🔍 IGDB Genre Games: ${genreName}, Limit ${limit}`);
      
      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: `fields name,summary,release_dates.human,rating,rating_count,platforms.name,platforms.id; where genres.name ~ *"${genreName}"* & rating_count > 5; sort rating desc; limit ${limit};`
      });

      if (!response.ok) {
        throw new Error(`IGDB API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ IGDB Genre Games successful: ${data.length} results for ${genreName}`);
      
      return {
        success: true,
        data: data as IGDBGame[],
        totalResults: data.length
      };

    } catch (error) {
      console.error('❌ IGDB genre games failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Health check for IGDB service
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      if (!this.clientId || !this.clientSecret) {
        return {
          healthy: false,
          message: 'IGDB credentials not configured'
        };
      }

      const token = await this.getAccessToken();
      
      if (!token) {
        return {
          healthy: false,
          message: 'Failed to obtain IGDB access token'
        };
      }

      return {
        healthy: true,
        message: 'IGDB service is healthy and ready'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `IGDB service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const igdbService = IGDBService.getInstance();
