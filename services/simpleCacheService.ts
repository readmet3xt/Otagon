/**
 * 🚀 SIMPLE CACHE SERVICE
 * 
 * Replaces the over-engineered unifiedCacheService with a simple localStorage-based cache.
 * 
 * Features:
 * - Simple localStorage caching
 * - Automatic expiration (24 hours)
 * - Type-safe cache keys
 * - Minimal overhead
 */

interface CacheEntry {
  content: string;
  timestamp: number;
  expiresAt: number;
}

class SimpleCacheService {
  private static instance: SimpleCacheService;
  private readonly CACHE_PREFIX = 'otakon_cache_';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): SimpleCacheService {
    if (!SimpleCacheService.instance) {
      SimpleCacheService.instance = new SimpleCacheService();
    }
    return SimpleCacheService.instance;
  }

  // Generate cache key
  private getCacheKey(query: string, contentType: string, gameName?: string): string {
    const gamePart = gameName ? `_${gameName}` : '';
    return `${this.CACHE_PREFIX}${contentType}${gamePart}_${this.hashString(query)}`;
  }

  // Simple string hash function
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Get cached content
  async getCachedContent(params: {
    query: string;
    contentType: string;
    gameName?: string;
  }): Promise<string | null> {
    try {
      const key = this.getCacheKey(params.query, params.contentType, params.gameName);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }

      return entry.content;
    } catch (error) {
      console.warn('Failed to get cached content:', error);
      return null;
    }
  }

  // Cache content
  async cacheContent(params: {
    query: string;
    content: string;
    contentType: string;
    gameName?: string;
  }): Promise<void> {
    try {
      const key = this.getCacheKey(params.query, params.contentType, params.gameName);
      const now = Date.now();
      
      const entry: CacheEntry = {
        content: params.content,
        timestamp: now,
        expiresAt: now + this.DEFAULT_TTL
      };

      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to cache content:', error);
    }
  }

  // Clear expired cache entries
  clearExpired(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const entry: CacheEntry = JSON.parse(cached);
              if (now > entry.expiresAt) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Remove invalid entries
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }

  // Clear all cache
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }

  // Get cache stats
  getCacheStats(): { entries: number; totalSize: number } {
    try {
      const keys = Object.keys(localStorage);
      let entries = 0;
      let totalSize = 0;

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          entries++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      });

      return { entries, totalSize };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { entries: 0, totalSize: 0 };
    }
  }
}

export const simpleCacheService = SimpleCacheService.getInstance();
export { SimpleCacheService };
