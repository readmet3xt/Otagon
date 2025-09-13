// Stub service for globalContentCache
// This is a placeholder implementation

export interface CachedContent {
  id: string;
  content: string;
  timestamp: number;
  expiresAt: number;
  metadata?: Record<string, any>;
}

class GlobalContentCache {
  private static instance: GlobalContentCache;
  private cache: Map<string, CachedContent> = new Map();

  static getInstance(): GlobalContentCache {
    if (!GlobalContentCache.instance) {
      GlobalContentCache.instance = new GlobalContentCache();
    }
    return GlobalContentCache.instance;
  }

  // Stub methods
  get(key: string): CachedContent | null {
    const item = this.cache.get(key);
    if (item && item.expiresAt > Date.now()) {
      return item;
    }
    if (item) {
      this.cache.delete(key);
    }
    return null;
  }

  set(key: string, content: string, ttl: number = 3600000): void {
    const item: CachedContent = {
      id: key,
      content,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };
    this.cache.set(key, item);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    return item ? item.expiresAt > Date.now() : false;
  }

  getAll(): CachedContent[] {
    const now = Date.now();
    return Array.from(this.cache.values()).filter(item => item.expiresAt > now);
  }

  // Additional missing methods
  async getCachedContent(contentType: string): Promise<CachedContent | null> {
    return this.get(contentType);
  }

  getCacheStats(): any {
    const now = Date.now();
    const validItems = Array.from(this.cache.values()).filter(item => item.expiresAt > now);
    return {
      totalItems: this.cache.size,
      validItems: validItems.length,
      expiredItems: this.cache.size - validItems.length
    };
  }

  async forceRefresh(): Promise<void> {
    this.clear();
  }

  async clearExpiredCache(): Promise<void> {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}

export const globalContentCache = GlobalContentCache.getInstance();
