import { Conversation as UseChatConversation, Conversations as UseChatConversations } from './types';

// ========================================
// 🔄 DEV MODE MIGRATION SERVICE
// ========================================
// Handles seamless migration between developer mode and production mode
// Ensures data consistency and provides migration utilities

export interface MigrationResult {
  success: boolean;
  migratedConversations: number;
  errors: string[];
  warnings: string[];
}

export interface DevModeData {
  conversations: UseChatConversations;
  conversationsOrder: string[];
  userPreferences?: Record<string, any>;
  userTier?: string;
  lastSync?: number;
}

class DevModeMigrationService {
  private static instance: DevModeMigrationService;
  private readonly DEV_DATA_KEY = 'otakon_dev_data';
  private readonly DEV_MODE_KEY = 'otakon_developer_mode';

  static getInstance(): DevModeMigrationService {
    if (!DevModeMigrationService.instance) {
      DevModeMigrationService.instance = new DevModeMigrationService();
    }
    return DevModeMigrationService.instance;
  }

  /**
   * Initialize developer mode with proper schema
   */
  async initializeDeveloperMode(): Promise<MigrationResult> {
    try {
      console.log('🔄 Initializing developer mode...');
      
      // Check if dev data exists
      const existingData = localStorage.getItem(this.DEV_DATA_KEY);
      let devData: DevModeData;

      if (existingData) {
        try {
          devData = JSON.parse(existingData);
          console.log('📁 Found existing developer data, validating schema...');
          
          // Validate and migrate existing data
          const migrationResult = await this.migrateExistingData(devData);
          if (!migrationResult.success) {
            console.warn('⚠️ Migration issues found:', migrationResult.warnings);
          }
          
          devData = migrationResult.migratedData;
        } catch (error) {
          console.warn('⚠️ Failed to parse existing dev data, creating fresh data');
          devData = this.createFreshDevData();
        }
      } else {
        console.log('🆕 Creating fresh developer data...');
        devData = this.createFreshDevData();
      }

      // Save the validated/migrated data
      localStorage.setItem(this.DEV_DATA_KEY, JSON.stringify(devData));
      localStorage.setItem(this.DEV_MODE_KEY, 'true');

      console.log('✅ Developer mode initialized successfully');
      return {
        success: true,
        migratedConversations: Object.keys(devData.conversations).length,
        errors: [],
        warnings: []
      };

    } catch (error) {
      console.error('❌ Failed to initialize developer mode:', error);
      return {
        success: false,
        migratedConversations: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };
    }
  }

  /**
   * Migrate existing developer data to new schema
   */
  private async migrateExistingData(data: any): Promise<{ success: boolean; migratedData: DevModeData; warnings: string[] }> {
    const warnings: string[] = [];
    const migratedData: DevModeData = {
      conversations: {},
      conversationsOrder: []
    };

    try {
      // Migrate conversations
      if (data.conversations) {
        for (const [id, conversation] of Object.entries(data.conversations)) {
          try {
            const migratedConversation = this.migrateConversation(conversation as any);
            migratedData.conversations[id] = migratedConversation;
          } catch (error) {
            warnings.push(`Failed to migrate conversation ${id}: ${error}`);
          }
        }
      }

      // Migrate conversations order
      if (data.conversationsOrder && Array.isArray(data.conversationsOrder)) {
        migratedData.conversationsOrder = data.conversationsOrder;
      } else {
        migratedData.conversationsOrder = Object.keys(migratedData.conversations);
        warnings.push('Missing conversationsOrder, regenerated from conversations');
      }

      // Migrate user preferences
      if (data.userPreferences) {
        migratedData.userPreferences = data.userPreferences;
      }

      // Migrate user tier
      if (data.userTier) {
        migratedData.userTier = data.userTier;
      }

      // Migrate last sync
      if (data.lastSync) {
        migratedData.lastSync = data.lastSync;
      }

      return {
        success: true,
        migratedData,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        migratedData: this.createFreshDevData(),
        warnings: [`Migration failed: ${error}`]
      };
    }
  }

  /**
   * Migrate a single conversation to the new schema
   */
  private migrateConversation(conversation: any): UseChatConversation {
    // Handle different conversation formats
    if (conversation.messages && conversation.title) {
      // Already in correct format
      return {
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages || [],
        createdAt: conversation.createdAt || conversation.created_at || Date.now(),
        progress: conversation.progress,
        inventory: conversation.inventory,
        lastTrailerTimestamp: conversation.lastTrailerTimestamp,
        lastInteractionTimestamp: conversation.lastInteractionTimestamp,
        genre: conversation.genre,
        insights: conversation.insights || {},
        insightsOrder: conversation.insightsOrder || [],
        isPinned: conversation.isPinned || conversation.is_pinned || false,
        activeObjective: conversation.activeObjective,
        // Legacy properties
        gameId: conversation.gameId || conversation.game_id,
        game_id: conversation.gameId || conversation.game_id,
        lastModified: conversation.lastModified || conversation.last_modified || Date.now(),
        context: conversation.context,
        version: conversation.version || 1
      };
    } else {
      // Legacy format - create minimal conversation
      return {
        id: conversation.id || crypto.randomUUID(),
        title: conversation.title || 'Untitled Conversation',
        messages: [],
        createdAt: Date.now(),
        progress: 0,
        inventory: [],
        genre: undefined,
        insights: {},
        insightsOrder: [],
        isPinned: false,
        activeObjective: null,
        version: 1
      };
    }
  }

  /**
   * Create fresh developer data with proper schema
   */
  private createFreshDevData(): DevModeData {
    return {
      conversations: {},
      conversationsOrder: [],
      userPreferences: {},
      userTier: 'vanguard_pro',
      lastSync: Date.now()
    };
  }

  /**
   * Export developer data for backup
   */
  exportDeveloperData(): string {
    try {
      const devData = localStorage.getItem(this.DEV_DATA_KEY);
      if (!devData) {
        throw new Error('No developer data found');
      }

      const parsedData = JSON.parse(devData);
      const exportData = {
        ...parsedData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(`Failed to export developer data: ${error}`);
    }
  }

  /**
   * Import developer data from backup
   */
  async importDeveloperData(jsonData: string): Promise<MigrationResult> {
    try {
      const importedData = JSON.parse(jsonData);
      
      // Validate imported data
      if (!importedData.conversations || !importedData.conversationsOrder) {
        throw new Error('Invalid data format: missing conversations or conversationsOrder');
      }

      // Migrate the imported data
      const migrationResult = await this.migrateExistingData(importedData);
      
      if (migrationResult.success) {
        // Save the migrated data
        localStorage.setItem(this.DEV_DATA_KEY, JSON.stringify(migrationResult.migratedData));
        
        return {
          success: true,
          migratedConversations: Object.keys(migrationResult.migratedData.conversations).length,
          errors: [],
          warnings: migrationResult.warnings
        };
      } else {
        throw new Error('Migration failed');
      }

    } catch (error) {
      return {
        success: false,
        migratedConversations: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };
    }
  }

  /**
   * Clear developer data
   */
  clearDeveloperData(): void {
    localStorage.removeItem(this.DEV_DATA_KEY);
    localStorage.removeItem(this.DEV_MODE_KEY);
    localStorage.removeItem('otakonAuthMethod');
    localStorage.removeItem('otakon_dev_session_start');
    console.log('🗑️ Developer data cleared');
  }

  /**
   * Get developer data info
   */
  getDeveloperDataInfo(): { conversations: number; lastModified: number; size: number } {
    try {
      const devData = localStorage.getItem(this.DEV_DATA_KEY);
      if (!devData) {
        return { conversations: 0, lastModified: 0, size: 0 };
      }

      const parsedData = JSON.parse(devData);
      return {
        conversations: Object.keys(parsedData.conversations || {}).length,
        lastModified: parsedData.lastSync || 0,
        size: devData.length
      };
    } catch (error) {
      return { conversations: 0, lastModified: 0, size: 0 };
    }
  }

  /**
   * Check if developer mode is active
   */
  isDeveloperMode(): boolean {
    return localStorage.getItem(this.DEV_MODE_KEY) === 'true';
  }

  /**
   * Switch to production mode (clear dev data)
   */
  switchToProductionMode(): void {
    this.clearDeveloperData();
    console.log('🔄 Switched to production mode');
  }

  /**
   * Switch to developer mode
   */
  async switchToDeveloperMode(): Promise<MigrationResult> {
    return this.initializeDeveloperMode();
  }
}

export const devModeMigrationService = DevModeMigrationService.getInstance();
