import { useState, useEffect, useCallback, useRef } from 'react';
import { globalContentCache, CachedContent } from '../services/globalContentCache';
import { unifiedUsageService } from '../services/unifiedUsageService';

export interface GlobalContentOptions {
  contentType: 'welcome_prompts' | 'suggested_prompts' | 'game_news' | 'trending_topics';
  fallbackContent?: any;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

export interface GlobalContentResult<T = any> {
  content: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  expiresAt: Date | null;
  usageCount: number;
  refresh: () => Promise<void>;
  cacheStats: Record<string, any>;
}

/**
 * Hook for accessing global cached content
 * Reduces API calls by using one user's daily query for all users
 */
export const useGlobalContent = <T = any>(options: GlobalContentOptions): GlobalContentResult<T> => {
  const { contentType, fallbackContent, autoRefresh = true, refreshInterval = 30 } = options;
  
  const [content, setContent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [cacheStats, setCacheStats] = useState<Record<string, any>>({});

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // ===== CONTENT LOADING =====

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const startTime = Date.now();
      const cachedContent = await globalContentCache.getCachedContent(contentType);
      
      if (cachedContent) {
        setContent(cachedContent);
        setLastUpdated(new Date());
        setExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours from now
        setUsageCount(0); // Will be updated by the cache service
        
        // Track cache hit
        await trackCacheUsage(true, Date.now() - startTime);
      } else {
        // Use fallback content if available
        if (fallbackContent) {
          setContent(fallbackContent);
          setError('Using fallback content - cache unavailable');
        } else {
          setError('No cached content available');
        }
        
        // Track cache miss
        await trackCacheUsage(false, Date.now() - startTime);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cached content';
      setError(errorMessage);
      
      // Use fallback content if available
      if (fallbackContent) {
        setContent(fallbackContent);
      }
    } finally {
      setIsLoading(false);
    }
  }, [contentType, fallbackContent]);

  // ===== CACHE USAGE TRACKING =====

  const trackCacheUsage = useCallback(async (cacheHit: boolean, responseTimeMs: number) => {
    try {
      const userTier = unifiedUsageService.getTier();
      
      // This would typically be tracked in the database
      // For now, we'll just log it
      console.log(`📊 Cache ${cacheHit ? 'HIT' : 'MISS'} for ${contentType} (${responseTimeMs}ms) - Tier: ${userTier}`);
      
      // You can implement database tracking here if needed
      // await supabase.from('cache_usage_stats').insert({...});
    } catch (error) {
      console.warn('Failed to track cache usage:', error);
    }
  }, [contentType]);

  // ===== REFRESH FUNCTION =====

  const refresh = useCallback(async () => {
    await loadContent();
  }, [loadContent]);

  // ===== AUTO REFRESH =====

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalMs = refreshInterval * 60 * 1000;
    
    refreshTimerRef.current = setInterval(async () => {
      // Check if content is about to expire (within 1 hour)
      if (expiresAt && expiresAt.getTime() - Date.now() < 60 * 60 * 1000) {
        console.log(`🔄 Auto-refreshing ${contentType} content (expires soon)`);
        await loadContent();
      }
    }, intervalMs);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, expiresAt, contentType, loadContent]);

  // ===== INITIAL LOAD =====

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // ===== CACHE STATS =====

  useEffect(() => {
    const updateCacheStats = () => {
      const stats = globalContentCache.getCacheStats();
      setCacheStats(stats);
    };

    // Update stats initially
    updateCacheStats();

    // Update stats periodically
    const statsTimer = setInterval(updateCacheStats, 60000); // Every minute

    return () => clearInterval(statsTimer);
  }, []);

  // ===== CLEANUP =====

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  return {
    content,
    isLoading,
    error,
    lastUpdated,
    expiresAt,
    usageCount,
    refresh,
    cacheStats
  };
};

// ===== SPECIALIZED HOOKS =====

/**
 * Hook for welcome prompts with smart rotation
 */
export const useWelcomePrompts = () => {
  const fallbackPrompts = [
    "Tell me about your current game progress",
    "What challenges are you facing in your game?",
    "Share a screenshot of your current situation",
    "What would you like to achieve next?",
    "How can I help you with your gaming journey?"
  ];

  return useGlobalContent({
    contentType: 'welcome_prompts',
    fallbackContent: fallbackPrompts,
    autoRefresh: true,
    refreshInterval: 60 // Refresh every hour for variety
  });
};

/**
 * Hook for suggested prompts with variety
 */
export const useSuggestedPrompts = () => {
  const fallbackPrompts = [
    { title: "Game Progress", description: "Tell me about your current progress" },
    { title: "Screenshot Help", description: "Share a screenshot for assistance" },
    { title: "Strategy Advice", description: "Get help with game strategy" },
    { title: "Lore Questions", description: "Learn about game world and story" },
    { title: "Technical Issues", description: "Get help with game problems" }
  ];

  return useGlobalContent({
    contentType: 'suggested_prompts',
    fallbackContent: fallbackPrompts,
    autoRefresh: true,
    refreshInterval: 120 // Refresh every 2 hours
  });
};

/**
 * Hook for game news with freshness
 */
export const useGameNews = () => {
  const fallbackNews = [
    { title: "Gaming Industry Updates", summary: "Stay tuned for the latest gaming news", relevance: 0.8 },
    { title: "New Game Releases", summary: "Discover upcoming and recent game releases", relevance: 0.9 },
    { title: "Community Highlights", summary: "See what's trending in the gaming community", relevance: 0.7 }
  ];

  return useGlobalContent({
    contentType: 'game_news',
    fallbackContent: fallbackNews,
    autoRefresh: true,
    refreshInterval: 30 // Refresh every 30 minutes for fresh news
  });
};

/**
 * Hook for trending topics
 */
export const useTrendingTopics = () => {
  const fallbackTopics = [
    { topic: "Open World Games", description: "Popular open world gaming discussions", popularity: "high" },
    { topic: "Indie Game Spotlight", description: "Rising indie game community interest", popularity: "medium" },
    { topic: "Gaming Technology", description: "Latest in gaming tech and innovation", popularity: "high" }
  ];

  return useGlobalContent({
    contentType: 'trending_topics',
    fallbackContent: fallbackTopics,
    autoRefresh: true,
    refreshInterval: 180 // Refresh every 3 hours
  });
};

// ===== UTILITY HOOKS =====

/**
 * Hook for managing global content cache
 */
export const useGlobalContentManagement = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const forceRefreshAll = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await globalContentCache.forceRefresh();
      console.log('✅ All global content refreshed');
    } catch (error) {
      console.error('Failed to refresh global content:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const clearExpiredCache = useCallback(async () => {
    try {
      await globalContentCache.clearExpiredCache();
      console.log('🗑️ Expired cache cleared');
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }, []);

  const getCacheStats = useCallback(() => {
    return globalContentCache.getCacheStats();
  }, []);

  return {
    forceRefreshAll,
    clearExpiredCache,
    getCacheStats,
    isRefreshing
  };
};
