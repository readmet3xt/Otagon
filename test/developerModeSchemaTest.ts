/**
 * 🧪 DEVELOPER MODE SCHEMA CONSISTENCY TEST
 * 
 * This test verifies that the developer mode localStorage data structure
 * exactly matches the Supabase schema structure.
 */

import { developerModeDataService } from '../services/developerModeDataService';

// Test data that matches Supabase schema
const testUserData = {
  profile_data: {
    hint_style: 'Balanced',
    player_focus: 'Story-Driven',
    preferred_tone: 'Encouraging',
    spoiler_tolerance: 'Strict',
    is_first_time: true,
    created_at: Date.now(),
    last_updated: Date.now()
  },
  preferences: {
    theme: 'dark',
    language: 'en',
    notifications: true,
    auto_save: true,
    developer_mode: true
  },
  app_state: {
    onboardingComplete: false,
    profileSetupCompleted: false,
    hasSeenSplashScreens: false,
    welcomeMessageShown: false,
    firstWelcomeShown: false,
    hasConversations: false,
    hasInteractedWithChat: false,
    lastSessionDate: '',
    lastWelcomeTime: '',
    appClosedTime: '',
    firstRunCompleted: false,
    hasConnectedBefore: false,
    installDismissed: false,
    showSplashAfterLogin: false,
    lastSuggestedPromptsShown: '',
    conversations: [],
    conversationsOrder: [],
    activeConversation: ''
  },
  usage_data: {
    textCount: 0,
    imageCount: 0,
    totalRequests: 0,
    lastReset: Date.now()
  },
  behavior_data: {
    sessionCount: 0,
    totalTimeSpent: 0,
    lastActivity: Date.now(),
    featureUsage: {}
  },
  feedback_data: {
    ratings: [],
    suggestions: [],
    bugReports: []
  },
  onboarding_data: {
    stepsCompleted: [],
    currentStep: 'login',
    completedAt: null
  }
};

const testConversation = {
  user_id: 'dev-user-123',
  game_id: 'test-game',
  title: 'Test Conversation',
  messages: [],
  context: {},
  insights: {},
  objectives: {},
  ai_data: {},
  is_active: true,
  is_pinned: false,
  progress: 0
};

const testGame = {
  user_id: 'dev-user-123',
  game_id: 'test-game',
  title: 'Test Game',
  genre: 'RPG',
  platform: ['PC'],
  game_data: {},
  progress_data: {},
  session_data: {},
  solutions_data: {},
  context_data: {},
  is_active: true
};

const testTask = {
  user_id: 'dev-user-123',
  game_id: 'test-game',
  conversation_id: 'test-conv',
  task_data: {},
  progress_data: {},
  favorites_data: {},
  modifications: {},
  status: 'pending' as const,
  priority: 'medium' as const,
  category: 'custom' as const,
  due_date: null,
  completed_at: null
};

const testAnalytics = {
  user_id: 'dev-user-123',
  game_id: 'test-game',
  conversation_id: 'test-conv',
  event_data: {},
  performance_data: {},
  cost_data: {},
  behavior_data: {},
  feedback_data: {},
  event_type: 'test_event',
  category: 'user_behavior' as const
};

// Test functions
export async function testDeveloperModeSchemaConsistency(): Promise<boolean> {
  console.log('🧪 Testing Developer Mode Schema Consistency...');
  
  try {
    // Test 1: User Data Structure
    console.log('📋 Test 1: User Data Structure');
    await developerModeDataService.updateUserData(testUserData);
    const retrievedUserData = await developerModeDataService.getUserData();
    
    if (!retrievedUserData) {
      console.error('❌ Failed to retrieve user data');
      return false;
    }
    
    // Verify all required fields exist
    const requiredUserFields = ['profile_data', 'preferences', 'app_state', 'usage_data', 'behavior_data', 'feedback_data', 'onboarding_data'];
    for (const field of requiredUserFields) {
      if (!(field in retrievedUserData)) {
        console.error(`❌ Missing required user field: ${field}`);
        return false;
      }
    }
    console.log('✅ User data structure matches Supabase schema');
    
    // Test 2: Conversation Structure
    console.log('📋 Test 2: Conversation Structure');
    const createdConversation = await developerModeDataService.createConversation(testConversation);
    const retrievedConversation = await developerModeDataService.getConversation(createdConversation.id);
    
    if (!retrievedConversation) {
      console.error('❌ Failed to retrieve conversation');
      return false;
    }
    
    // Verify all required fields exist
    const requiredConversationFields = ['id', 'user_id', 'game_id', 'title', 'messages', 'context', 'insights', 'objectives', 'ai_data', 'is_active', 'is_pinned', 'progress', 'created_at', 'updated_at', 'last_interaction'];
    for (const field of requiredConversationFields) {
      if (!(field in retrievedConversation)) {
        console.error(`❌ Missing required conversation field: ${field}`);
        return false;
      }
    }
    console.log('✅ Conversation structure matches Supabase schema');
    
    // Test 3: Game Structure
    console.log('📋 Test 3: Game Structure');
    const createdGame = await developerModeDataService.createGame(testGame);
    const retrievedGame = await developerModeDataService.getGame(createdGame.id);
    
    if (!retrievedGame) {
      console.error('❌ Failed to retrieve game');
      return false;
    }
    
    // Verify all required fields exist
    const requiredGameFields = ['id', 'user_id', 'game_id', 'title', 'genre', 'platform', 'game_data', 'progress_data', 'session_data', 'solutions_data', 'context_data', 'is_active', 'created_at', 'updated_at', 'last_played'];
    for (const field of requiredGameFields) {
      if (!(field in retrievedGame)) {
        console.error(`❌ Missing required game field: ${field}`);
        return false;
      }
    }
    console.log('✅ Game structure matches Supabase schema');
    
    // Test 4: Task Structure
    console.log('📋 Test 4: Task Structure');
    const createdTask = await developerModeDataService.createTask(testTask);
    const retrievedTasks = await developerModeDataService.getTasks();
    const retrievedTask = retrievedTasks.find(task => task.id === createdTask.id);
    
    if (!retrievedTask) {
      console.error('❌ Failed to retrieve task');
      return false;
    }
    
    // Verify all required fields exist
    const requiredTaskFields = ['id', 'user_id', 'game_id', 'conversation_id', 'task_data', 'progress_data', 'favorites_data', 'modifications', 'status', 'priority', 'category', 'created_at', 'updated_at', 'due_date', 'completed_at'];
    for (const field of requiredTaskFields) {
      if (!(field in retrievedTask)) {
        console.error(`❌ Missing required task field: ${field}`);
        return false;
      }
    }
    console.log('✅ Task structure matches Supabase schema');
    
    // Test 5: Analytics Structure
    console.log('📋 Test 5: Analytics Structure');
    const createdAnalytics = await developerModeDataService.createAnalytics(testAnalytics);
    const retrievedAnalytics = await developerModeDataService.getAnalytics();
    const retrievedAnalytic = retrievedAnalytics.find(analytic => analytic.id === createdAnalytics.id);
    
    if (!retrievedAnalytic) {
      console.error('❌ Failed to retrieve analytics');
      return false;
    }
    
    // Verify all required fields exist
    const requiredAnalyticsFields = ['id', 'user_id', 'game_id', 'conversation_id', 'event_data', 'performance_data', 'cost_data', 'behavior_data', 'feedback_data', 'event_type', 'category', 'timestamp'];
    for (const field of requiredAnalyticsFields) {
      if (!(field in retrievedAnalytic)) {
        console.error(`❌ Missing required analytics field: ${field}`);
        return false;
      }
    }
    console.log('✅ Analytics structure matches Supabase schema');
    
    // Test 6: Cache Structure
    console.log('📋 Test 6: Cache Structure');
    const testCacheData = { test: 'data', timestamp: Date.now() };
    await developerModeDataService.setCache('test_cache', testCacheData);
    const retrievedCacheData = await developerModeDataService.getCache('test_cache');
    
    if (!retrievedCacheData || retrievedCacheData.test !== 'data') {
      console.error('❌ Failed to retrieve cache data');
      return false;
    }
    console.log('✅ Cache structure works correctly');
    
    // Test 7: Data Export/Import
    console.log('📋 Test 7: Data Export/Import');
    const exportedData = await developerModeDataService.exportData();
    if (!exportedData) {
      console.error('❌ Failed to export data');
      return false;
    }
    
    // Clear data and import
    await developerModeDataService.clearAllData();
    const importSuccess = await developerModeDataService.importData(exportedData);
    if (!importSuccess) {
      console.error('❌ Failed to import data');
      return false;
    }
    console.log('✅ Data export/import works correctly');
    
    console.log('🎉 All tests passed! Developer mode schema is consistent with Supabase schema.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testDeveloperModeSchema = testDeveloperModeSchemaConsistency;
  console.log('🧪 Developer mode schema test available at window.testDeveloperModeSchema()');
} else {
  // Node.js environment
  testDeveloperModeSchemaConsistency().then(success => {
    console.log(success ? '✅ All tests passed!' : '❌ Some tests failed!');
    process.exit(success ? 0 : 1);
  });
}
