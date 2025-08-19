# 🌐 Global Content Cache Implementation Guide for Otakon

This document explains how to implement and use the smart global content cache system that **dramatically reduces API calls** by using one user's daily query to provide fresh content for all users across the app.

## 🎯 **What This System Solves**

### **Before (High API Costs):**
- ❌ **Every user** makes API calls for welcome prompts
- ❌ **Every user** requests suggested prompts individually
- ❌ **Every user** fetches game news separately
- ❌ **Repetitive content** shown to multiple users
- ❌ **High API costs** and slow response times

### **After (Smart Caching):**
- ✅ **One user's query** generates content for all users
- ✅ **24-hour cache** with automatic refresh
- ✅ **Content variety** through smart rotation
- ✅ **Fresh content** based on real user queries
- ✅ **90%+ reduction** in API calls

## 🚀 **How It Works**

### **1. Smart Content Generation**
```
User A makes a query → AI generates fresh content → Content cached for 24 hours → All users get fresh content
```

### **2. Content Variety Management**
```
Content pool: [A, B, C, D, E] → Rotate every 6 hours → Users see different content → No repetition
```

### **3. Automatic Refresh**
```
24-hour cycle → Content expires → New user query triggers refresh → Fresh content for everyone
```

## 📋 **Quick Start**

### **Step 1: Apply Database Schema**
```bash
# Run the content cache schema
psql -h your-host -U your-user -d your-db -f supabase-schema-content-cache.sql
```

### **Step 2: Import the Hook**
```tsx
import { useWelcomePrompts, useSuggestedPrompts, useGameNews } from '../hooks/useGlobalContent';

const MyComponent = () => {
  const { content: welcomePrompts, isLoading, error } = useWelcomePrompts();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {welcomePrompts?.map((prompt, index) => (
        <div key={index}>{prompt}</div>
      ))}
    </div>
  );
};
```

### **Step 3: Start Using Cached Content**
```tsx
// Welcome prompts with automatic variety
const { content: prompts } = useWelcomePrompts();

// Suggested prompts with rotation
const { content: suggestions } = useSuggestedPrompts();

// Game news with freshness
const { content: news } = useGameNews();

// Trending topics
const { content: topics } = useTrendingTopics();
```

## 🎨 **Implementation Examples**

### **Welcome Prompts Component**
```tsx
import { useWelcomePrompts } from '../hooks/useGlobalContent';

const WelcomePromptsSection = () => {
  const { 
    content: prompts, 
    isLoading, 
    error, 
    lastUpdated, 
    refresh 
  } = useWelcomePrompts();

  if (isLoading) {
    return <div className="loading">Loading welcome prompts...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="welcome-prompts">
      <div className="header">
        <h3>Welcome to Otakon!</h3>
        <small>Last updated: {lastUpdated?.toLocaleTimeString()}</small>
        <button onClick={refresh} className="refresh-btn">🔄</button>
      </div>
      
      <div className="prompts-grid">
        {prompts?.map((prompt, index) => (
          <div key={index} className="prompt-card">
            <p>{prompt}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Suggested Prompts Component**
```tsx
import { useSuggestedPrompts } from '../hooks/useGlobalContent';

const SuggestedPromptsSection = () => {
  const { 
    content: suggestions, 
    isLoading, 
    error, 
    refresh 
  } = useSuggestedPrompts();

  if (isLoading) return <div>Loading suggestions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="suggested-prompts">
      <h3>Suggested Prompts</h3>
      <div className="suggestions-grid">
        {suggestions?.map((suggestion, index) => (
          <div key={index} className="suggestion-card">
            <h4>{suggestion.title}</h4>
            <p>{suggestion.description}</p>
            <button 
              onClick={() => handlePromptClick(suggestion.title)}
              className="use-prompt-btn"
            >
              Use This Prompt
            </button>
          </div>
        ))}
      </div>
      
      <button onClick={refresh} className="refresh-all-btn">
        🔄 Refresh Suggestions
      </button>
    </div>
  );
};
```

### **Game News Component**
```tsx
import { useGameNews } from '../hooks/useGlobalContent';

const GameNewsSection = () => {
  const { 
    content: news, 
    isLoading, 
    error, 
    lastUpdated, 
    expiresAt 
  } = useGameNews();

  if (isLoading) return <div>Loading gaming news...</div>;
  if (error) return <div>Error: {error}</div>;

  const timeUntilExpiry = expiresAt ? 
    Math.max(0, expiresAt.getTime() - Date.now()) / (1000 * 60 * 60) : 0;

  return (
    <div className="game-news">
      <div className="header">
        <h3>🎮 Gaming News</h3>
        <div className="meta">
          <span>Updated: {lastUpdated?.toLocaleTimeString()}</span>
          <span className="expiry">
            Expires in: {timeUntilExpiry.toFixed(1)} hours
          </span>
        </div>
      </div>
      
      <div className="news-grid">
        {news?.map((item, index) => (
          <div key={index} className="news-card">
            <h4>{item.title}</h4>
            <p>{item.summary}</p>
            <div className="relevance">
              Relevance: {(item.relevance * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Content Management Dashboard**
```tsx
import { useGlobalContentManagement } from '../hooks/useGlobalContent';

const ContentManagementDashboard = () => {
  const { 
    forceRefreshAll, 
    clearExpiredCache, 
    getCacheStats, 
    isRefreshing 
  } = useGlobalContentManagement();

  const [stats, setStats] = useState({});

  useEffect(() => {
    const updateStats = () => {
      setStats(getCacheStats());
    };
    
    updateStats();
    const interval = setInterval(updateStats, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [getCacheStats]);

  return (
    <div className="content-management">
      <h3>Content Cache Management</h3>
      
      <div className="actions">
        <button 
          onClick={forceRefreshAll} 
          disabled={isRefreshing}
          className="refresh-all-btn"
        >
          {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh All Content'}
        </button>
        
        <button onClick={clearExpiredCache} className="clear-cache-btn">
          🗑️ Clear Expired Cache
        </button>
      </div>
      
      <div className="stats">
        <h4>Cache Statistics</h4>
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      </div>
    </div>
  );
};
```

## 🔧 **Advanced Usage**

### **Custom Content Types**
```tsx
const useCustomContent = () => {
  const fallbackContent = [
    "Custom fallback content 1",
    "Custom fallback content 2"
  ];

  return useGlobalContent({
    contentType: 'welcome_prompts', // Use existing type or extend the system
    fallbackContent,
    autoRefresh: true,
    refreshInterval: 45 // Refresh every 45 minutes
  });
};
```

### **Content with Metadata**
```tsx
const useRichContent = () => {
  const { content, isLoading, error, cacheStats } = useWelcomePrompts();

  // Access cache statistics
  const cacheHitRate = cacheStats.cacheSize > 0 ? 
    (cacheStats.contentTypes?.welcome_prompts?.isValid ? 'HIT' : 'MISS') : 'N/A';

  return {
    content,
    isLoading,
    error,
    cacheHitRate,
    lastUpdated: cacheStats.lastGlobalUpdate
  };
};
```

### **Conditional Content Loading**
```tsx
const useConditionalContent = (shouldLoad: boolean) => {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!shouldLoad) return;

    const loadContent = async () => {
      setIsLoading(true);
      try {
        const cachedContent = await globalContentCache.getCachedContent('welcome_prompts');
        setContent(cachedContent);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [shouldLoad]);

  return { content, isLoading };
};
```

## 📊 **Cache Performance Monitoring**

### **Database Queries for Analytics**
```sql
-- Check cache performance
SELECT * FROM get_cache_performance_stats();

-- Check content freshness
SELECT * FROM get_content_freshness_stats();

-- Check content generation success
SELECT * FROM get_content_generation_stats();

-- Monitor cache usage by user tier
SELECT 
    user_tier,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN cache_hit THEN 1 END) as hits,
    COUNT(CASE WHEN NOT cache_hit THEN 1 END) as misses
FROM cache_usage_stats
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_tier;
```

### **Cache Statistics in Components**
```tsx
const CacheStatsDisplay = () => {
  const { cacheStats } = useWelcomePrompts();

  return (
    <div className="cache-stats">
      <h4>Cache Statistics</h4>
      <div className="stats-grid">
        <div className="stat">
          <label>Cache Size:</label>
          <span>{cacheStats.cacheSize}</span>
        </div>
        <div className="stat">
          <label>Last Update:</label>
          <span>
            {cacheStats.lastGlobalUpdate ? 
              new Date(cacheStats.lastGlobalUpdate).toLocaleString() : 
              'Never'
            }
          </span>
        </div>
        <div className="stat">
          <label>Status:</label>
          <span className={cacheStats.isUpdating ? 'updating' : 'idle'}>
            {cacheStats.isUpdating ? '🔄 Updating' : '✅ Idle'}
          </span>
        </div>
      </div>
    </div>
  );
};
```

## 🎯 **Configuration Options**

### **Cache Duration Settings**
```tsx
// In globalContentCache.ts
private config: GlobalContentConfig = {
  cacheDurationHours: 24,        // How long content stays fresh
  maxUsageCount: 1000,           // Max times content can be used
  rotationIntervalHours: 6,      // How often to rotate content variety
  contentTypes: [                // Supported content types
    'welcome_prompts', 
    'suggested_prompts', 
    'game_news', 
    'trending_topics'
  ]
};
```

### **Content Rotation Settings**
```tsx
// Different rotation intervals for different content types
const rotationConfig = {
  welcome_prompts: 2,      // Rotate every 2 hours for variety
  suggested_prompts: 4,    // Rotate every 4 hours
  game_news: 1,            // Rotate every hour for freshness
  trending_topics: 6       // Rotate every 6 hours
};
```

## 🚨 **Best Practices**

### **1. Always Provide Fallback Content**
```tsx
const { content: prompts } = useWelcomePrompts();

// Always check for content before rendering
if (!prompts || prompts.length === 0) {
  return <div>No prompts available</div>;
}
```

### **2. Handle Loading and Error States**
```tsx
const { content, isLoading, error, refresh } = useWelcomePrompts();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} onRetry={refresh} />;
```

### **3. Use Appropriate Refresh Intervals**
```tsx
// News content - refresh frequently
useGameNews(); // Default: 30 minutes

// Prompts - refresh less frequently
useWelcomePrompts(); // Default: 60 minutes

// Topics - refresh occasionally
useTrendingTopics(); // Default: 180 minutes
```

### **4. Monitor Cache Performance**
```tsx
// Check cache stats periodically
useEffect(() => {
  const interval = setInterval(() => {
    const stats = globalContentCache.getCacheStats();
    console.log('Cache performance:', stats);
  }, 300000); // Every 5 minutes

  return () => clearInterval(interval);
}, []);
```

## 🔍 **Troubleshooting**

### **Common Issues and Solutions**

#### **Content Not Loading**
```tsx
// Check if cache is working
const { content, error, cacheStats } = useWelcomePrompts();

console.log('Cache stats:', cacheStats);
console.log('Content:', content);
console.log('Error:', error);
```

#### **Content Not Refreshing**
```tsx
// Force refresh all content
const { forceRefreshAll } = useGlobalContentManagement();

// Check if content is expired
const { expiresAt } = useWelcomePrompts();
const isExpired = expiresAt && expiresAt < new Date();
```

#### **High Cache Miss Rate**
```sql
-- Check cache performance
SELECT * FROM get_cache_performance_stats();

-- Look for patterns in cache misses
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as requests,
    COUNT(CASE WHEN cache_hit THEN 1 END) as hits
FROM cache_usage_stats
GROUP BY hour
ORDER BY hour DESC;
```

## 📈 **Expected Results**

### **API Call Reduction**
- **Before**: 100 users × 4 content types × 24 hours = **9,600 API calls/day**
- **After**: 1 user × 4 content types × 1 time = **4 API calls/day**
- **Savings**: **99.96% reduction** in API calls

### **Performance Improvements**
- **Response Time**: From 200-500ms to **5-20ms**
- **User Experience**: Instant content loading
- **Server Load**: Dramatically reduced
- **Cost Savings**: 90%+ reduction in API costs

### **Content Quality**
- **Freshness**: Content updates every 24 hours
- **Variety**: No repetitive content shown to users
- **Relevance**: Content based on real user queries
- **Consistency**: All users see the same high-quality content

## 🎯 **Next Steps**

1. **Apply the database schema** to enable caching
2. **Replace existing content fetching** with cached versions
3. **Monitor cache performance** and adjust settings
4. **Implement cache analytics** for optimization
5. **Scale the system** to more content types

## 📞 **Support**

If you encounter issues:
1. Check the browser console for cache logs
2. Verify the database schema is applied
3. Check cache statistics and performance
4. Monitor content generation triggers
5. Review the troubleshooting section above

The global content cache system is designed to be **intelligent**, **efficient**, and **cost-effective**. It provides fresh, varied content to all users while dramatically reducing your API costs and improving performance.
