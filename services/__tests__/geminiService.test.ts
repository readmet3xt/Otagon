import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the services
vi.mock('./unifiedUsageService', () => ({
  unifiedUsageService: {
    getTier: vi.fn(),
    getUserProfile: vi.fn(),
  }
}));

vi.mock('./supabaseDataService', () => ({
  supabaseDataService: {
    getAppCache: vi.fn(),
    setAppCache: vi.fn(),
  }
}));

vi.mock('./universalContentCacheService', () => ({
  universalContentCacheService: {
    getCachedContent: vi.fn(),
    cacheContent: vi.fn(),
  }
}));

describe('GeminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have exported functions', async () => {
    const geminiService = await import('../geminiService');
    
    // Test that main exported functions exist
    expect(geminiService.sendMessage).toBeDefined();
    expect(geminiService.sendMessageWithImages).toBeDefined();
    expect(geminiService.resetChat).toBeDefined();
    expect(geminiService.isChatActive).toBeDefined();
  });
});
