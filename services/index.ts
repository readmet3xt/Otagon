/**
 * Barrel exports for services
 * 
 * This file provides centralized exports for all services,
 * making imports cleaner and more maintainable.
 */

// Core Services
export { ServiceFactory, Service, BaseService } from './ServiceFactory';

// Data Services
export { unifiedStorageService, UnifiedStorageService } from './unifiedStorageService';
export { supabaseDataService } from './supabaseDataService';
export { unifiedDataService } from './unifiedDataService';
export { databaseService } from './databaseService';
// Legacy storage services (deprecated - use unifiedStorageService)
export { offlineStorageService } from './offlineStorageService';

// Cache Services
export { unifiedCacheService } from './unifiedCacheService';

// AI Services
export { unifiedAIService, UnifiedAIService } from './unifiedAIService';
export { aiContextService } from './aiContextService';
export { progressiveInsightService } from './progressiveInsightService';
export { gameKnowledgeService } from './gameKnowledgeService';
export { characterDetectionService } from './characterDetectionService';
export { taskDetectionService } from './taskDetectionService';
export { contextManagementService } from './contextManagementService';

// Analytics Services
export { unifiedAnalyticsService, UnifiedAnalyticsService } from './unifiedAnalyticsService';
export { performanceMonitoringService } from './performanceMonitoringService';
export { performanceService } from './performanceService';

// User Services
export { authService, supabase } from './supabase';
export { profileService } from './profileService';
export { playerProfileService } from './playerProfileService';
export { userPreferencesService } from './userPreferencesService';
export { tierService } from './tierService';

// Usage Services
export { unifiedUsageService } from './unifiedUsageService';
export { apiCostService } from './apiCostService';

// Communication Services
export * from './websocketService';
export { ttsService } from './ttsService';
export { voiceService } from './voiceService';
export { pushNotificationService } from './pushNotificationService';
export { smartNotificationService } from './smartNotificationService';

// PWA Services
export { pwaInstallService } from './pwaInstallService';
export { pwaNavigationService } from './pwaNavigationService';
export { appShortcutsService } from './appShortcutsService';

// Content Services
export { suggestedPromptsService } from './suggestedPromptsService';
export { otakuDiaryService } from './otakuDiaryService';
export { otakuDiarySupabaseService } from './otakuDiarySupabaseService';
export { wishlistService } from './wishlistService';
export { githubReleasesService } from './githubReleasesService';

// Engagement Services
export { DailyEngagementService } from './dailyEngagementService';
export { progressTrackingService } from './progressTrackingService';

// Feedback Services
export * from './feedbackService';
export { feedbackLearningEngine } from './feedbackLearningEngine';
export { contactService } from './contactService';

// Utility Services
export { requestBatchingService } from './requestBatchingService';
export { TabManagementService } from './tabManagementService';
export { waitlist_entriesService as waitlistService } from './waitlistService';

// Storage - removed redundant storage service

// Types
export * from './types';
