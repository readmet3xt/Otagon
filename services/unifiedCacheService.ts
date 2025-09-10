import { supabaseDataService } from './supabaseDataService';
import { offlineStorageService } from './offlineStorageService';
import { STORAGE_KEYS, TIMING } from '../utils/constants';
import { ServiceFactory, BaseService } from './ServiceFactory';

/**
 * 🎯 UNIFIED CACHE SERVICE
 * 
 * This service consolidates all caching functionality from:
 * - advancedCacheService.ts
 * - universalContentCacheService.ts
 * - globalContentCache.ts
 * - dailyNewsCacheService.ts
 * 
 * Features:
 * 1. Multi-tier caching (memory, localStorage, Supabase)
 * 2. Intelligent cache strategies and invalidation
 * 3. Content similarity detection
 * 4. Performance monitoring and metrics
 * 5. Tier-based access control
 * 6. Automatic cleanup and expiration
 */

export interface CachedContent {
  id: string;
  query: string;
  queryHash: string;
  content: string;
  contentType: 'game_help' | 'insight' | 'task' | 'game_info' | 'general' | 'unreleased_game' | 'daily_news' | 'global_content';
  gameName?: string;
  genre?: string;
  userTier: string;
  userId?: string;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  metadata: {
    model: string;
    tokens: number;
    cost: number;
    tags: string[];
    relatedQueries: string[];
    strategy: string;
    source: 'memory' | 'localStorage' | 'supabase';
  };
}

export interface CacheStrategy {
  name: string;
  priority: number;
  ttl: number;
  maxSize: number;
  invalidationRules: CacheInvalidationRule[];
}

export interface CacheInvalidationRule {
  type: 'time' | 'dependency' | 'user_action' | 'network_condition';
  condition: string;
  action: 'invalidate' | 'refresh' | 'extend';
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  storageUsage: number;
  lastUpdated: Date;
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
}

export interface CacheQuery {
  query: string;
  gameName?: string;
  genre?: string;
  userTier: string;
  contentType?: CachedContent['contentType'];
}

export interface ContentVariety {
  contentType: string;
  varietyScore: number;
  lastRotation: Date;
  contentCount: number;
  uniqueTopics: string[];
}

export class UnifiedCacheService extends BaseService {
  private memoryCache: Map<string, CachedContent> = new Map();
  private cacheStrategies: Map<string, CacheStrategy> = new Map();
  private performanceMetrics: CachePerformanceMetrics = {
    hitRate: 0,
    missRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    storageUsage: 0,
    lastUpdated: new Date(),
    totalHits: 0,
    totalMisses: 0,
    totalRequests: 0
  };
  private contentVariety: Map<string, ContentVariety> = new Map();
  private lastGlobalUpdate: Date | null = null;
  private isUpdating: boolean = false;

  constructor() {
    super();
    this.initializeDefaultStrategies();
    this.startPerformanceMonitoring();
  }

  // ===== CACHE STRATEGIES =====

  private initializeDefaultStrategies(): void {
    const strategies: CacheStrategy[] = [
      {
        name: 'default',
        priority: 1,
        ttl: TIMING.CACHE_EXPIRATION_MS,
        maxSize: 1000,
        invalidationRules: [
          { type: 'time', condition: '24h', action: 'invalidate' }
        ]
      },
      {
        name: 'daily_news',
        priority: 2,
        ttl: 6 * 60 * 60 * 1000, // 6 hours
        maxSize: 100,
        invalidationRules: [
          { type: 'time', condition: '6h', action: 'refresh' }
        ]
      },
      {
        name: 'global_content',
        priority: 3,
        ttl: 12 * 60 * 60 * 1000, // 12 hours
        maxSize: 500,
        invalidationRules: [
          { type: 'time', condition: '12h', action: 'extend' }
        ]
      },
      {
        name: 'game_help',
        priority: 4,
        ttl: TIMING.CACHE_EXPIRATION_MS,
        maxSize: 2000,
        invalidationRules: [
          { type: 'time', condition: '24h', action: 'invalidate' }
        ]
      }
    ];

    strategies.forEach(strategy => {
      this.cacheStrategies.set(strategy.name, strategy);
    });
  }

  // ===== CORE CACHING METHODS =====

  async get<T>(key: string, strategy: string = 'default'): Promise<T | null> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;

    try {
      // Check memory cache first (fastest)
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult && this.isValid(memoryResult, strategy)) {
        this.updateAccessMetrics(memoryResult);
        this.performanceMetrics.totalHits++;
        this.recordHit('memory', Date.now() - startTime);
        return memoryResult.content as T;
      }

      // Check localStorage cache
      const storageResult = await this.getFromStorage(key);
      if (storageResult && this.isValid(storageResult, strategy)) {
        // Promote to memory cache
        this.memoryCache.set(key, storageResult);
        this.updateAccessMetrics(storageResult);
        this.performanceMetrics.totalHits++;
        this.recordHit('storage', Date.now() - startTime);
        return storageResult.content as T;
      }

      // Check Supabase cache
      const supabaseResult = await this.getFromSupabase(key);
      if (supabaseResult && this.isValid(supabaseResult, strategy)) {
        // Promote to both memory and storage
        this.memoryCache.set(key, supabaseResult);
        await this.setInStorage(key, supabaseResult);
        this.updateAccessMetrics(supabaseResult);
        this.performanceMetrics.totalHits++;
        this.recordHit('supabase', Date.now() - startTime);
        return supabaseResult.content as T;
      }

      this.performanceMetrics.totalMisses++;
      this.recordMiss(Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.performanceMetrics.totalMisses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, strategy: string = 'default', metadata?: Partial<CachedContent['metadata']>): Promise<void> {
    try {
      const strategyConfig = this.cacheStrategies.get(strategy) || this.cacheStrategies.get('default')!;
      const now = Date.now();
      
      const cacheEntry: CachedContent = {
        id: this.generateId(),
        query: key,
        queryHash: this.generateHash(key),
        content: JSON.stringify(value),
        contentType: this.determineContentType(key),
        userTier: 'free', // Will be updated by caller
        timestamp: now,
        expiresAt: now + strategyConfig.ttl,
        accessCount: 0,
        lastAccessed: now,
        metadata: {
          model: 'gemini-2.5-pro',
          tokens: 0,
          cost: 0,
          tags: [],
          relatedQueries: [],
          strategy,
          source: 'memory',
          ...metadata
        }
      };

      // Store in memory cache
      this.memoryCache.set(key, cacheEntry);

      // Store in localStorage
      await this.setInStorage(key, cacheEntry);

      // Store in Supabase (async, don't wait)
      this.setInSupabase(key, cacheEntry).catch(error => {
        console.warn('Failed to store in Supabase cache:', error);
      });

      // Update performance metrics
      this.updateMemoryUsage();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // ===== CONTENT-SPECIFIC METHODS =====

  async getCachedContent(query: string, contentType?: CachedContent['contentType']): Promise<any | null> {
    const key = this.generateContentKey(query, contentType);
    return await this.get(key, contentType === 'daily_news' ? 'daily_news' : 'default');
  }

  async setCachedContent(query: string, content: any, contentType: CachedContent['contentType'], metadata?: Partial<CachedContent['metadata']>): Promise<void> {
    const key = this.generateContentKey(query, contentType);
    const strategy = contentType === 'daily_news' ? 'daily_news' : 
                    contentType === 'global_content' ? 'global_content' : 'default';
    
    await this.set(key, content, strategy, {
      ...metadata,
      source: 'memory'
    });
  }

  // ===== DAILY NEWS CACHE METHODS =====

  async needsGroundingSearch(prompt: string, userTier: string): Promise<{ needsSearch: boolean; reason: string; canUseFreeWindow: boolean }> {
    const promptKey = this.generateHash(prompt);
    const cacheKey = `daily_news_${promptKey}`;
    
    const cached = await this.get(cacheKey, 'daily_news');
    if (cached) {
      return { needsSearch: false, reason: 'Found in cache', canUseFreeWindow: false };
    }

    // Check if user is in free window
    const canUseFreeWindow = await this.isInFreeUserWindow(promptKey);
    
    return {
      needsSearch: true,
      reason: 'Not in cache',
      canUseFreeWindow
    };
  }

  async isInFreeUserWindow(promptKey: string): Promise<boolean> {
    try {
      const freeWindowData = localStorage.getItem(STORAGE_KEYS.USER_TIER);
      if (!freeWindowData) return false;

      const { lastFreeUsage, freeWindowStart } = JSON.parse(freeWindowData);
      const now = Date.now();
      const freeWindowDuration = 24 * 60 * 60 * 1000; // 24 hours

      return (now - lastFreeUsage) < freeWindowDuration && 
             (now - freeWindowStart) < freeWindowDuration;
    } catch (error) {
      console.warn('Error checking free user window:', error);
      return false;
    }
  }

  // ===== GLOBAL CONTENT METHODS =====

  async getGlobalContent(contentType: string): Promise<any | null> {
    const key = `global_${contentType}`;
    return await this.get(key, 'global_content');
  }

  async setGlobalContent(contentType: string, content: any): Promise<void> {
    const key = `global_${contentType}`;
    await this.set(key, content, 'global_content', {
      source: 'memory'
    });
  }

  // ===== STORAGE METHODS =====

  private async getFromStorage(key: string): Promise<CachedContent | null> {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.APP_CACHE_PREFIX}${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to get from localStorage:', error);
      return null;
    }
  }

  private async setInStorage(key: string, content: CachedContent): Promise<void> {
    try {
      localStorage.setItem(`${STORAGE_KEYS.APP_CACHE_PREFIX}${key}`, JSON.stringify(content));
    } catch (error) {
      console.warn('Failed to set in localStorage:', error);
    }
  }

  private async getFromSupabase(key: string): Promise<CachedContent | null> {
    try {
      const appCache = await supabaseDataService.getAppCache(key);
      if (!appCache) return null;
      
      // Convert AppCache to CachedContent
      return {
        id: key,
        query: key,
        queryHash: key,
        content: appCache.cacheData,
        contentType: 'general',
        userTier: 'free',
        timestamp: Date.now(),
        expiresAt: appCache.expiresAt ? new Date(appCache.expiresAt).getTime() : Date.now() + 24 * 60 * 60 * 1000,
        accessCount: 1,
        lastAccessed: Date.now(),
        metadata: {
          model: 'unknown',
          tokens: 0,
          cost: 0,
          tags: [],
          relatedQueries: [],
          strategy: 'supabase',
          source: 'supabase'
        }
      };
    } catch (error) {
      console.warn('Failed to get from Supabase:', error);
      return null;
    }
  }

  private async setInSupabase(key: string, content: CachedContent): Promise<void> {
    try {
      await supabaseDataService.setAppCache(key, content, new Date(content.expiresAt).toISOString());
    } catch (error) {
      console.warn('Failed to set in Supabase:', error);
    }
  }

  // ===== UTILITY METHODS =====

  private isValid(content: CachedContent, strategy: string): boolean {
    const now = Date.now();
    return content.expiresAt > now;
  }

  private updateAccessMetrics(content: CachedContent): void {
    content.accessCount++;
    content.lastAccessed = Date.now();
  }

  private generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private generateContentKey(query: string, contentType?: string): string {
    const hash = this.generateHash(query);
    return contentType ? `${contentType}_${hash}` : hash;
  }

  private determineContentType(key: string): CachedContent['contentType'] {
    if (key.includes('daily_news')) return 'daily_news';
    if (key.includes('global_')) return 'global_content';
    if (key.includes('game_help')) return 'game_help';
    if (key.includes('insight')) return 'insight';
    if (key.includes('task')) return 'task';
    return 'general';
  }

  // ===== PERFORMANCE MONITORING =====

  private recordHit(source: string, responseTime: number): void {
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime + responseTime) / 2;
  }

  private recordMiss(responseTime: number): void {
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime + responseTime) / 2;
  }

  private updateMemoryUsage(): void {
    this.performanceMetrics.memoryUsage = this.memoryCache.size;
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // Update every minute
  }

  private updatePerformanceMetrics(): void {
    const total = this.performanceMetrics.totalRequests;
    if (total > 0) {
      this.performanceMetrics.hitRate = this.performanceMetrics.totalHits / total;
      this.performanceMetrics.missRate = this.performanceMetrics.totalMisses / total;
    }
    this.performanceMetrics.lastUpdated = new Date();
  }

  // ===== PUBLIC API =====

  getPerformanceMetrics(): CachePerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  clearCache(): void {
    this.memoryCache.clear();
    // Clear localStorage cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_KEYS.APP_CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  getCacheSize(): number {
    return this.memoryCache.size;
  }

  // ===== CLEANUP =====

  cleanup(): void {
    console.log('🧹 UnifiedCacheService: Cleanup called');
    this.clearCache();
    this.memoryCache.clear();
    this.cacheStrategies.clear();
    this.contentVariety.clear();
  }
}

// Export singleton instance
export const unifiedCacheService = ServiceFactory.create(UnifiedCacheService);
