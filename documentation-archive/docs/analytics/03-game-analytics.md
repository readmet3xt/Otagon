# 🎮 Game Analytics Implementation Guide for Otakon

This document explains how to implement and use the comprehensive game analytics tracking system that tracks all game-related activities, insights, API calls, and user interactions at both user and global levels.

## 🎯 **What We're Tracking**

### **1. Game Activities (Pills, Insights, Modifications)**
- **Pill creation/deletion/modification** - All game pill interactions
- **Insight creation/deletion/modification** - Insight management
- **Insight tab operations** - Tab creation, updates, deletion
- **Game progress updates** - Progress tracking and changes
- **Inventory changes** - Item additions/removals
- **Objective setting** - Goal creation and completion

### **2. API Usage Tracking**
- **All API calls** - Endpoint, method, response time, success/failure
- **Global API patterns** - Usage by tier, success rates, data transfer
- **Performance metrics** - Response times, error rates
- **Tier comparison** - Free vs Pro vs Vanguard usage patterns

### **3. User Query & AI Response Tracking**
- **Query details** - Type, content, images, length, tokens
- **AI responses** - Length, tokens, response time
- **Success/failure** - Error tracking and analysis
- **Game context** - Game identification, genre, progress

### **4. User Feedback & Engagement**
- **AI response feedback** - Thumbs up/down on responses
- **Insight feedback** - User ratings on insights
- **Engagement patterns** - User interaction preferences

## 🚀 **Quick Start**

### **Step 1: Apply Enhanced Database Schema**
```bash
# Run the enhanced game analytics schema
psql -h your-host -U your-user -d your-db -f supabase-schema-game-analytics.sql
```

### **Step 2: Import Game Analytics Hook**
```tsx
import { useGameAnalytics } from '../hooks/useGameAnalytics';

const MyComponent = () => {
  const { 
    trackPillCreated, 
    trackInsightCreated, 
    trackUserQuery,
    trackApiCall 
  } = useGameAnalytics();
  
  // Use analytics functions...
};
```

### **Step 3: Start Tracking Game Activities**
```tsx
// Track pill creation
const handlePillCreate = () => {
  trackPillCreated(
    'game-id', 
    'Game Title', 
    'conversation-id', 
    'pill-id', 
    pillContent,
    { source: 'user_creation' }
  );
};

// Track insight creation
const handleInsightCreate = () => {
  trackInsightCreated(
    'game-id',
    'Game Title', 
    'conversation-id',
    'insight-id',
    insightContent,
    { source: 'ai_generated' }
  );
};
```

## 📋 **Implementation Examples**

### **Game Pill Tracking**

#### **Track Pill Creation:**
```tsx
const { trackPillCreated } = useGameAnalytics();

const handlePillCreate = (pillContent: any) => {
  trackPillCreated(
    gameId,
    gameTitle,
    conversationId,
    pillId,
    pillContent,
    { 
      source: 'user_creation',
      pillType: 'hint',
      gameProgress: currentProgress 
    }
  );
};
```

#### **Track Pill Modification:**
```tsx
const { trackPillModified } = useGameAnalytics();

const handlePillEdit = (oldContent: any, newContent: any) => {
  trackPillModified(
    gameId,
    gameTitle,
    conversationId,
    pillId,
    oldContent,
    newContent,
    { 
      source: 'user_edit',
      changeType: 'content_update',
      timestamp: Date.now()
    }
  );
};
```

#### **Track Pill Deletion:**
```tsx
const { trackPillDeleted } = useGameAnalytics();

const handlePillDelete = (pillContent: any) => {
  trackPillDeleted(
    gameId,
    gameTitle,
    conversationId,
    pillId,
    pillContent,
    { 
      source: 'user_deletion',
      reason: 'no_longer_needed',
      pillAge: Date.now() - pillCreatedAt
    }
  );
};
```

### **Insight Tracking**

#### **Track Insight Creation:**
```tsx
const { trackInsightCreated } = useGameAnalytics();

const handleInsightCreate = (title: string, content: string) => {
  trackInsightCreated(
    gameId,
    gameTitle,
    conversationId,
    insightId,
    { title, content, status: 'active' },
    { 
      source: 'ai_generated',
      insightType: 'objective',
      gameProgress: currentProgress
    }
  );
};
```

#### **Track Insight Tab Operations:**
```tsx
const { trackInsightTabCreated, trackInsightTab } = useGameAnalytics();

const handleTabCreate = (tabData: any) => {
  trackInsightTabCreated(
    conversationId,
    tabData.id,
    tabData.title,
    tabData.type,
    { 
      source: 'user_creation',
      tabOrder: tabData.order,
      isPinned: tabData.isPinned
    }
  );
};

const handleTabUpdate = (tabData: any, action: 'updated' | 'deleted') => {
  trackInsightTab(tabData, action);
};
```

### **API Usage Tracking**

#### **Track API Calls with Timing:**
```tsx
const { startApiCallTimer, stopApiCallTimer } = useGameAnalytics();

const makeApiCall = async () => {
  startApiCallTimer('/api/chat');
  
  try {
    const response = await fetch('/api/chat', { method: 'POST', body: data });
    const responseData = await response.json();
    
    stopApiCallTimer(
      '/api/chat',
      'POST',
      true,
      JSON.stringify(data).length,
      JSON.stringify(responseData).length
    );
    
    return responseData;
  } catch (error) {
    stopApiCallTimer(
      '/api/chat',
      'POST',
      false,
      JSON.stringify(data).length,
      0,
      error.message
    );
    throw error;
  }
};
```

#### **Track API Calls Directly:**
```tsx
const { trackApiCall } = useGameAnalytics();

const handleApiCall = (endpoint: string, method: string, success: boolean) => {
  trackApiCall({
    apiEndpoint: endpoint,
    apiMethod: method,
    responseTimeMs: responseTime,
    success,
    requestSizeBytes: requestSize,
    responseSizeBytes: responseSize,
    metadata: { 
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    }
  });
};
```

### **User Query Tracking**

#### **Track Query with Timer:**
```tsx
const { startQueryTimer, stopQueryTimer } = useGameAnalytics();

const handleUserQuery = async (query: string, images?: File[]) => {
  const queryId = crypto.randomUUID();
  startQueryTimer(queryId);
  
  try {
    const response = await sendQuery(query, images);
    
    stopQueryTimer(queryId, {
      conversationId: 'conv-id',
      queryType: images?.length ? 'image' : 'text',
      queryText: query,
      hasImages: !!images?.length,
      imageCount: images?.length || 0,
      queryLength: query.length,
      aiResponseLength: response.length,
      success: true,
      gameContext: { gameId: 'game-id', gameTitle: 'Game Title' }
    });
    
    return response;
  } catch (error) {
    stopQueryTimer(queryId, {
      conversationId: 'conv-id',
      queryType: images?.length ? 'image' : 'text',
      queryText: query,
      hasImages: !!images?.length,
      imageCount: images?.length || 0,
      queryLength: query.length,
      success: false,
      errorMessage: error.message,
      gameContext: { gameId: 'game-id', gameTitle: 'Game Title' }
    });
    throw error;
  }
};
```

### **User Feedback Tracking**

#### **Track AI Response Feedback:**
```tsx
const { trackAIResponseFeedback } = useGameAnalytics();

const handleResponseFeedback = (messageId: string, feedbackType: 'up' | 'down') => {
  trackAIResponseFeedback(
    conversationId,
    messageId,
    feedbackType,
    undefined, // No feedback text for thumbs up/down
    { 
      responseType: 'ai_message',
      feedbackType,
      gameId: currentGameId,
      gameTitle: currentGameTitle
    },
    { 
      userTier: currentTier,
      source: 'message_feedback'
    }
  );
};
```

#### **Track Insight Feedback:**
```tsx
const { trackInsightFeedback } = useGameAnalytics();

const handleInsightFeedback = (insightId: string, feedbackType: 'helpful' | 'not_helpful') => {
  trackInsightFeedback(
    conversationId,
    insightId,
    feedbackType,
    'This insight was very helpful!',
    { 
      insightTitle: insightTitle,
      insightContent: insightContent,
      feedbackType,
      gameId: currentGameId,
      gameTitle: currentGameTitle
    }
  );
};
```

## 📊 **Analytics Dashboard Integration**

### **Add Game Analytics to Dashboard:**
```tsx
import { useGameAnalytics } from '../hooks/useGameAnalytics';

const GameAnalyticsSection = () => {
  const { getUserGameSummary, getGlobalApiUsageStats, getTierUsageComparison } = useGameAnalytics();
  const [gameStats, setGameStats] = useState(null);
  const [apiStats, setApiStats] = useState([]);
  const [tierStats, setTierStats] = useState([]);

  useEffect(() => {
    const loadGameAnalytics = async () => {
      const [game, api, tier] = await Promise.all([
        getUserGameSummary(),
        getGlobalApiUsageStats(),
        getTierUsageComparison()
      ]);
      
      setGameStats(game);
      setApiStats(api);
      setTierStats(tier);
    };

    loadGameAnalytics();
  }, []);

  return (
    <div className="game-analytics-section">
      {/* Game Activity Summary */}
      {gameStats && (
        <div className="stats-card">
          <h3>Game Activity Summary</h3>
          <p>Total Activities: {gameStats.totalActivities}</p>
          <p>Pills Created: {gameStats.pillsCreated}</p>
          <p>Insights Created: {gameStats.insightsCreated}</p>
          <p>Avg Response Time: {gameStats.avgResponseTimeMs}ms</p>
        </div>
      )}

      {/* API Usage Stats */}
      <div className="stats-card">
        <h3>API Usage by Endpoint</h3>
        {apiStats.map(stat => (
          <div key={stat.apiEndpoint}>
            <strong>{stat.apiEndpoint}</strong>
            <p>Success Rate: {stat.successRate}%</p>
            <p>Avg Response: {stat.avgResponseTimeMs}ms</p>
          </div>
        ))}
      </div>

      {/* Tier Comparison */}
      <div className="stats-card">
        <h3>Tier Usage Comparison</h3>
        {tierStats.map(stat => (
          <div key={stat.userTier}>
            <strong>{stat.userTier}</strong>
            <p>Users: {stat.totalUsers}</p>
            <p>Avg Queries: {stat.avgQueriesPerUser}</p>
            <p>Response Time: {stat.avgResponseTimeMs}ms</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🔧 **Advanced Usage**

### **Custom Game Context Extraction:**
```tsx
// Override the default game context extraction
const customGameContext = {
  gameId: conversation.customGameId || conversation.id,
  gameTitle: conversation.customTitle || conversation.title,
  gameGenre: conversation.genre,
  gameProgress: conversation.progress,
  gameVersion: conversation.version
};

// Use in tracking calls
trackPillCreated(
  customGameContext.gameId,
  customGameContext.gameTitle,
  conversationId,
  pillId,
  pillContent,
  { gameContext: customGameContext }
);
```

### **Batch Analytics Tracking:**
```tsx
const trackGameSession = async (sessionData: any) => {
  const { trackGameActivity, trackUserQuery } = useGameAnalytics();
  
  // Track multiple activities at once
  await Promise.all([
    trackGameActivity({
      activityType: 'game_progress_updated',
      gameId: sessionData.gameId,
      gameTitle: sessionData.gameTitle,
      conversationId: sessionData.conversationId,
      oldValue: sessionData.oldProgress,
      newValue: sessionData.newProgress
    }),
    
    trackGameActivity({
      activityType: 'inventory_changed',
      gameId: sessionData.gameId,
      gameTitle: sessionData.gameTitle,
      conversationId: sessionData.conversationId,
      oldValue: sessionData.oldInventory,
      newValue: sessionData.newInventory
    })
  ]);
};
```

### **Error Tracking and Monitoring:**
```tsx
const trackGameError = async (error: Error, context: any) => {
  const { trackGameActivity } = useGameAnalytics();
  
  await trackGameActivity({
    activityType: 'game_error',
    gameId: context.gameId,
    gameTitle: context.gameTitle,
    conversationId: context.conversationId,
    metadata: {
      errorType: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      context: context,
      timestamp: Date.now()
    }
  });
};
```

## 📈 **Analytics Queries**

### **Get User Game Summary:**
```sql
-- Get comprehensive game activity summary for a user
SELECT * FROM get_user_game_summary(
  'user-uuid',
  NOW() - INTERVAL '30 days',
  NOW()
);
```

### **Get Global API Usage:**
```sql
-- Get API usage statistics across all users
SELECT * FROM get_global_api_usage_stats(
  NOW() - INTERVAL '7 days',
  NOW()
);
```

### **Get Tier Usage Comparison:**
```sql
-- Compare usage patterns across different user tiers
SELECT * FROM get_tier_usage_comparison(
  NOW() - INTERVAL '30 days',
  NOW()
);
```

### **Custom Analytics Queries:**
```sql
-- Find most active games
SELECT 
  game_id,
  game_title,
  COUNT(*) as activity_count,
  COUNT(DISTINCT user_id) as unique_users
FROM game_activities
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY game_id, game_title
ORDER BY activity_count DESC;

-- Find insight creation patterns
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as insights_created,
  COUNT(DISTINCT user_id) as active_users
FROM game_activities
WHERE activity_type = 'insight_created'
GROUP BY day
ORDER BY day DESC;

-- Analyze API performance by tier
SELECT 
  user_tier,
  api_endpoint,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) as total_calls,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls
FROM api_calls
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_tier, api_endpoint
ORDER BY avg_response_time DESC;
```

## 🎨 **Integration with Existing Components**

### **Already Integrated:**
- ✅ **useChat Hook** - Tracks all user queries and AI responses
- ✅ **Insight Management** - Tracks creation, modification, deletion
- ✅ **Feedback System** - Tracks user feedback on AI responses and insights
- ✅ **Game Context** - Automatically extracts game information

### **Components to Integrate Next:**
- 🔄 **VoiceChatInput** - Track voice query patterns
- 🔄 **HandsFreeModal** - Track hands-free mode usage
- 🔄 **Screenshot Analysis** - Track image analysis patterns
- 🔄 **Game News Features** - Track news API usage

## 🚨 **Best Practices**

### **1. Consistent Game Context:**
```tsx
// Always provide consistent game context
const gameContext = {
  gameId: conversation.gameId || conversation.id,
  gameTitle: conversation.title || conversation.gameTitle,
  gameGenre: conversation.genre,
  gameProgress: conversation.progress
};

// Use in all tracking calls
trackPillCreated(
  gameContext.gameId,
  gameContext.gameTitle,
  conversationId,
  pillId,
  pillContent,
  { gameContext }
);
```

### **2. Meaningful Metadata:**
```tsx
// Include relevant context in metadata
trackInsightCreated(
  gameId,
  gameTitle,
  conversationId,
  insightId,
  insightContent,
  {
    source: 'ai_generated',
    insightType: 'objective',
    gameProgress: currentProgress,
    userTier: currentTier,
    timestamp: Date.now(),
    context: 'game_session'
  }
);
```

### **3. Error Handling:**
```tsx
// Always handle analytics errors gracefully
try {
  await trackGameActivity(activity);
} catch (error) {
  console.warn('Game analytics tracking failed:', error);
  // Don't break user experience
}
```

### **4. Performance Optimization:**
```tsx
// Use analytics hooks efficiently
const { trackPillCreated } = useGameAnalytics();

// Don't recreate functions on every render
const handlePillCreate = useCallback((pillData) => {
  trackPillCreated(
    pillData.gameId,
    pillData.gameTitle,
    pillData.conversationId,
    pillData.pillId,
    pillData.content
  );
}, [trackPillCreated]);
```

## 🔍 **Monitoring & Debugging**

### **Console Logs:**
The game analytics service provides detailed console logging:
- 🎮 `Game activity tracked: pill_created for game-id`
- 📊 `Insight tab created: Tab Title`
- ✏️ `Insight modification tracked: updated`
- 👍 `User feedback tracked: up on ai_response`
- 🌐 `API call tracked: POST /api/chat (150ms)`
- 💬 `User query tracked: text (200ms)`

### **Database Verification:**
```sql
-- Check if data is being collected
SELECT COUNT(*) FROM game_activities;
SELECT COUNT(*) FROM insight_tabs;
SELECT COUNT(*) FROM api_calls;
SELECT COUNT(*) FROM user_queries;

-- Verify user data
SELECT 
  user_id, 
  activity_type, 
  game_id, 
  created_at
FROM game_activities
ORDER BY created_at DESC
LIMIT 10;
```

## 🎯 **Next Steps**

1. **Apply the enhanced database schema** to enable comprehensive tracking
2. **Test the tracking** in development mode
3. **Integrate remaining components** using the examples above
4. **Monitor the analytics** to identify optimization opportunities
5. **Set up alerts** for critical game activity patterns

## 📞 **Support**

If you encounter any issues with the game analytics implementation:
1. Check the browser console for error messages
2. Verify the database schema is applied correctly
3. Ensure the game analytics service is properly imported
4. Check that user authentication is working
5. Verify game context extraction is working correctly

The game analytics system is designed to be **comprehensive**, **performant**, and **easy to use**. It provides deep insights into user behavior, game engagement, and system performance without affecting your app's user experience.
