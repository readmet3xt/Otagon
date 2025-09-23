import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dailyNewsCacheService } from '../dailyNewsCacheService';

// Mock Supabase service
vi.mock('../supabaseDataService', () => ({
  supabaseDataService: {
    getAppCache: vi.fn(),
    setAppCache: vi.fn(),
  }
}));

describe('DailyNewsCacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getCacheStatus', () => {
    it('should return cache status for all prompt keys', () => {
      const status = dailyNewsCacheService.getCacheStatus();
      
      expect(status).toHaveProperty('LATEST_NEWS');
      expect(status).toHaveProperty('UPCOMING_RELEASES');
      expect(status).toHaveProperty('LATEST_REVIEWS');
      expect(status).toHaveProperty('HOT_TRAILERS');
      
      expect(status.LATEST_NEWS?.hasCache).toBe(false);
      expect(status.LATEST_NEWS?.age).toBe('No Cache');
    });
  });

  describe('clearCache', () => {
    it('should clear all cache and localStorage', () => {
      // Set some test data
      localStorage.setItem('otakon_daily_news_cache', JSON.stringify({
        latestNews: { content: 'test', timestamp: Date.now() }
      }));

      dailyNewsCacheService.clearCache();

      const status = dailyNewsCacheService.getCacheStatus();
      expect(status.LATEST_NEWS?.hasCache).toBe(false);
      // Check that localStorage was updated (it should be '{}' or undefined if not set)
      const stored = localStorage.getItem('otakon_daily_news_cache');
      console.log('Stored value:', stored);
      expect(stored === '{}' || stored === null || stored === undefined).toBe(true);
    });
  });

  describe('isInFreeUserWindow', () => {
    it('should return true when in free user window', async () => {
      const { supabaseDataService } = await import('../supabaseDataService');
      const now = Date.now();
      vi.mocked(supabaseDataService.getAppCache).mockResolvedValue({
        cacheData: {
          startTime: now - 1000, // Started 1 second ago
          endTime: now + 24 * 60 * 60 * 1000 // Ends in 24 hours
        },
        expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString()
      });

      const result = await dailyNewsCacheService.isInFreeUserWindow('latestNews');
      expect(result).toBe(true);
    });

    it('should return false when not in free user window', async () => {
      const { supabaseDataService } = await import('../supabaseDataService');
      vi.mocked(supabaseDataService.getAppCache).mockResolvedValue(null);

      const result = await dailyNewsCacheService.isInFreeUserWindow('latestNews');
      expect(result).toBe(false);
    });
  });
});
