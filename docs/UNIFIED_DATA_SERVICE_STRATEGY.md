# Unified Data Service Strategy

## Overview

The Unified Data Service implements a consistent "Supabase-first with localStorage fallback" pattern across the entire application to ensure all features can be tested in developer mode while maintaining data consistency between localStorage and Supabase tables.

## Core Principles

### 1. **Developer Mode vs. Authenticated Mode**
- **Developer Mode** (unauthenticated): Supabase-first, then localStorage fallback
- **Authenticated Mode**: Supabase only (no localStorage fallback)

### 2. **Data Consistency**
- localStorage keys align with Supabase table structures
- All data operations use the same unified interface
- Automatic synchronization between storage layers

### 3. **Graceful Degradation**
- Supabase failures don't break app functionality
- localStorage provides reliable fallback for testing
- Comprehensive error logging and recovery

## Architecture

### UnifiedDataService Class

```typescript
class UnifiedDataService {
  // Core methods
  async getData<T>(key, supabaseGetter, localStorageKey, defaultValue): Promise<UnifiedDataResult<T>>
  async setData<T>(key, value, supabaseSetter, localStorageKey): Promise<UnifiedDataResult<void>>
  
  // Specific data operations
  async getUserUsageData(): Promise<UnifiedDataResult<UserUsageData>>
  async updateUserUsage(field, value): Promise<UnifiedDataResult<void>>
  async getUserAppState(): Promise<UnifiedDataResult<UserAppState>>
  async updateUserAppState(field, value): Promise<UnifiedDataResult<void>>
  // ... more methods
}
```

### Data Flow Patterns

#### GET Operations (Developer Mode)
1. Try Supabase first
2. If successful, sync to localStorage for consistency
3. If Supabase fails, use localStorage fallback
4. Return data with source information

#### SET Operations (Developer Mode)
1. Update localStorage immediately for instant effect
2. Attempt Supabase update
3. If Supabase fails, log warning but continue
4. Return success status with source information

#### GET Operations (Authenticated Mode)
1. Supabase only
2. No localStorage fallback
3. Fail fast on errors

#### SET Operations (Authenticated Mode)
1. Supabase only
2. No localStorage backup
3. Fail fast on errors

## Storage Key Alignment

### User Usage Data (user_usage table)
```typescript
STORAGE_KEYS.USER_TIER = 'otakonUserTier'
STORAGE_KEYS.TEXT_COUNT = 'otakonTextQueryCount'
STORAGE_KEYS.IMAGE_COUNT = 'otakonImageQueryCount'
STORAGE_KEYS.LAST_USAGE_DATE = 'otakonLastUsageDate'
```

### User App State (users_new.app_state JSONB)
```typescript
STORAGE_KEYS.APP_STATE = 'otakonAppState'
STORAGE_KEYS.LAST_VISITED = 'otakonLastVisited'
STORAGE_KEYS.UI_PREFERENCES = 'otakonUIPreferences'
STORAGE_KEYS.FEATURE_FLAGS = 'otakonFeatureFlags'
STORAGE_KEYS.APP_SETTINGS = 'otakonAppSettings'
STORAGE_KEYS.LAST_INTERACTION = 'otakonLastInteraction'
STORAGE_KEYS.PWA_ANALYTICS = 'otakonPWAAnalytics'
STORAGE_KEYS.WISHLIST = 'otakonWishlist'
STORAGE_KEYS.OTAKU_DIARY = 'otakonOtakuDiary'
STORAGE_KEYS.API_COST_RECORDS = 'otakonAPICostRecords'
STORAGE_KEYS.PROACTIVE_INSIGHTS = 'otakonProactiveInsights'
STORAGE_KEYS.PWA_INSTALLED = 'otakonPWAInstalled'
STORAGE_KEYS.PWA_GLOBAL_INSTALLED = 'otakonPWAGlobalInstalled'
```

### User Preferences (users_new.preferences JSONB)
```typescript
STORAGE_KEYS.USER_PREFERENCES = 'otakonUserPreferences'
STORAGE_KEYS.GAME_GENRE = 'otakonGameGenre'
STORAGE_KEYS.DETAIL_LEVEL = 'otakonDetailLevel'
STORAGE_KEYS.AI_PERSONALITY = 'otakonAIPersonality'
STORAGE_KEYS.PREFERRED_RESPONSE_FORMAT = 'otakonPreferredResponseFormat'
STORAGE_KEYS.SKILL_LEVEL = 'otakonSkillLevel'
STORAGE_KEYS.NOTIFICATION_PREFERENCES = 'otakonNotificationPreferences'
STORAGE_KEYS.ACCESSIBILITY_SETTINGS = 'otakonAccessibilitySettings'
STORAGE_KEYS.TTS_SETTINGS = 'otakonTTSSettings'
STORAGE_KEYS.PWA_SETTINGS = 'otakonPWASettings'
STORAGE_KEYS.PROFILE_NAME = 'otakonProfileName'
```

### Daily Engagement (daily_engagement table)
```typescript
STORAGE_KEYS.DAILY_ENGAGEMENT = 'otakonDailyEngagement'
STORAGE_KEYS.DAILY_GOALS = 'otakonDailyGoals'
STORAGE_KEYS.DAILY_STREAKS = 'otakonDailyStreaks'
STORAGE_KEYS.CHECKIN_COMPLETED = 'otakonCheckinCompleted'
STORAGE_KEYS.LAST_SESSION_TIME = 'otakonLastSessionTime'
```

### App Cache (app_cache table)
```typescript
STORAGE_KEYS.APP_CACHE = 'otakonAppCache'
```

### Otaku Diary (users_new.app_state.otakuDiary)
```typescript
STORAGE_KEYS.TASKS_PREFIX = 'otakon_tasks_'
STORAGE_KEYS.FAVORITES_PREFIX = 'otakon_favorites_'
```

### PWA Specific
```typescript
STORAGE_KEYS.PWA_INSTALLS = 'otakon_pwa_installs'
STORAGE_KEYS.PWA_ENGAGEMENT = 'otakon_pwa_engagement'
```

## Implementation Examples

### Basic Usage

```typescript
import { unifiedDataService } from './services/unifiedDataService';

// Get user usage data
const result = await unifiedDataService.getUserUsageData();
console.log(`Data from: ${result.source}, Authenticated: ${result.authenticated}`);
console.log('Tier:', result.data.tier);

// Update user usage
await unifiedDataService.updateUserUsage('tier', 'pro');
```

### Service Integration

```typescript
// In a service class
class MyService {
  async getData() {
    return unifiedDataService.getData(
      'myData',
      () => supabaseDataService.getMyData(),
      STORAGE_KEYS.MY_DATA,
      { defaultValue: 'default' }
    );
  }
  
  async setData(value) {
    return unifiedDataService.setData(
      'myData',
      value,
      () => supabaseDataService.setMyData(value),
      STORAGE_KEYS.MY_DATA
    );
  }
}
```

## Migration Strategy

### Phase 1: Core Services ✅
- [x] `unifiedUsageService.ts` - User tier and usage management
- [x] `otakuDiaryService.ts` - Game tasks and favorites
- [x] `pwaAnalyticsService.ts` - PWA analytics tracking
- [x] `apiCostService.ts` - API cost tracking
- [x] `pwaInstallService.ts` - PWA installation tracking
- [x] `pwaNavigationService.ts` - PWA navigation state

### Phase 2: Additional Services
- [ ] `wishlistService.ts` - User wishlist management
- [ ] `proactiveInsightsService.ts` - AI insights
- [ ] `dailyEngagementService.ts` - Daily engagement tracking
- [ ] `userPreferencesService.ts` - User preferences management

### Phase 3: Component Updates
- [ ] Update all components to use unified data service
- [ ] Remove direct localStorage calls
- [ ] Implement consistent error handling

## Benefits

### 1. **Developer Experience**
- All features testable in developer mode
- Consistent data handling patterns
- Clear error messages and fallbacks

### 2. **Data Consistency**
- localStorage aligns with Supabase schema
- Automatic synchronization between layers
- Reduced data drift issues

### 3. **Maintainability**
- Single source of truth for data operations
- Consistent error handling
- Easy to debug and monitor

### 4. **Production Reliability**
- Authenticated users get full Supabase benefits
- No localStorage overhead in production
- Graceful degradation on network issues

## Error Handling

### Supabase Failures (Developer Mode)
```typescript
try {
  await supabaseDataService.updateUserUsage('tier', 'pro');
} catch (error) {
  console.warn('⚠️ Supabase update failed, but localStorage was updated:', error);
  // Continue with localStorage-only operation
}
```

### localStorage Failures
```typescript
try {
  localStorage.setItem(key, value);
} catch (error) {
  console.warn('Failed to set localStorage for ${key}:', error);
  // Continue with Supabase-only operation
}
```

## Monitoring and Debugging

### Console Logging
- All data operations log their source
- Clear indication of fallback usage
- Authentication status tracking

### Data Source Tracking
```typescript
interface UnifiedDataResult<T> {
  data: T;
  source: 'supabase' | 'localStorage' | 'fallback';
  authenticated: boolean;
}
```

### Performance Monitoring
- Track data operation success rates
- Monitor fallback usage patterns
- Identify authentication issues

## Best Practices

### 1. **Always Use Unified Service**
```typescript
// ❌ Don't do this
localStorage.setItem('key', value);

// ✅ Do this
await unifiedDataService.setData('key', value, setter, localStorageKey);
```

### 2. **Handle Results Properly**
```typescript
const result = await unifiedDataService.getData(...);
if (result.source === 'fallback') {
  console.warn('Using fallback data, may be stale');
}
```

### 3. **Provide Meaningful Defaults**
```typescript
const result = await unifiedDataService.getData(
  'key',
  getter,
  localStorageKey,
  { defaultValue: 'meaningful default' } // Always provide good defaults
);
```

### 4. **Log Data Sources**
```typescript
console.log(`Data loaded from ${result.source} (authenticated: ${result.authenticated})`);
```

## Future Enhancements

### 1. **Automatic Sync**
- Background synchronization between localStorage and Supabase
- Conflict resolution strategies
- Data versioning

### 2. **Offline Support**
- Enhanced offline functionality
- Queue-based sync when online
- Conflict resolution UI

### 3. **Performance Optimization**
- Caching strategies
- Lazy loading
- Batch operations

### 4. **Analytics Integration**
- Track data source usage patterns
- Monitor fallback frequency
- Performance metrics

## Conclusion

The Unified Data Service provides a robust foundation for consistent data handling across the application. It ensures that all features can be tested in developer mode while maintaining data integrity and providing a seamless experience for authenticated users.

By following the established patterns and using the unified service for all data operations, developers can build features that work reliably in both development and production environments.
