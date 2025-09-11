import React, { useState, useEffect } from 'react';
// Dynamic import to avoid circular dependency
// import { universalContentCacheService } from '../services/universalContentCacheService';

/**
 * 🎯 Universal Cache Status Component
 * 
 * Displays real-time status of the universal content cache system
 * Shows cache statistics for all content types: game help, insights, tasks, etc.
 */

interface CacheStats {
  totalEntries: number;
  entriesByType: Record<string, number>;
  oldestEntry: number;
  newestEntry: number;
  totalSize: number;
}

export const UniversalCacheStatus: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadCacheStats = async () => {
    setIsLoading(true);
    try {
      const { universalContentCacheService } = await import('../services/universalContentCacheService');
      const stats = await universalContentCacheService.getCacheStats();
      setCacheStats(stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async (contentType?: string) => {
    try {
      const { universalContentCacheService } = await import('../services/universalContentCacheService');
      await universalContentCacheService.clearCache(contentType);
      await loadCacheStats(); // Reload stats after clearing
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  useEffect(() => {
    loadCacheStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadCacheStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getContentTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'game_help': '🎮',
      'insight': '💡',
      'task': '✅',
      'game_info': '📚',
      'general': '🌐',
      'unreleased_game': '🚀'
    };
    return icons[type] || '📄';
  };

  const getContentTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'game_help': 'bg-blue-600',
      'insight': 'bg-purple-600',
      'task': 'bg-green-600',
      'game_info': 'bg-yellow-600',
      'general': 'bg-gray-600',
      'unreleased_game': 'bg-red-600'
    };
    return colors[type] || 'bg-gray-600';
  };

  if (!cacheStats) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-gray-400">Loading cache status...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          🎯 Universal Content Cache Status
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadCacheStats}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-xs rounded transition-colors"
          >
            {isLoading ? '🔄' : '🔄 Refresh'}
          </button>
          <button
            onClick={() => clearCache()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{cacheStats.totalEntries}</div>
          <div className="text-xs text-gray-300">Total Entries</div>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{formatBytes(cacheStats.totalSize)}</div>
          <div className="text-xs text-gray-300">Total Size</div>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{formatDate(cacheStats.oldestEntry)}</div>
          <div className="text-xs text-gray-300">Oldest Entry</div>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{formatDate(cacheStats.newestEntry)}</div>
          <div className="text-xs text-gray-300">Newest Entry</div>
        </div>
      </div>

      {/* Entries by Type */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-white">Cache Entries by Type</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(cacheStats.entriesByType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between bg-gray-700 rounded p-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getContentTypeIcon(type)}</span>
                <span className="text-white capitalize">
                  {type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getContentTypeColor(type)} text-white`}>
                  {count}
                </span>
                <button
                  onClick={() => clearCache(type)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  title={`Clear ${type} cache`}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-400 text-center">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Cache Info */}
      <div className="bg-gray-700 rounded p-3">
        <h4 className="text-sm font-medium text-white mb-2">Cache Information</h4>
        <div className="text-xs text-gray-300 space-y-1">
          <div>• Cache duration: 7 days</div>
          <div>• Similarity threshold: 85%</div>
          <div>• Max entries per type: 1,000</div>
          <div>• Automatic cleanup: Enabled</div>
        </div>
      </div>
    </div>
  );
};
