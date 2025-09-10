import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/supabase';
import { databaseService } from '../services/databaseService';
import { performanceService } from '../services/performanceService';

export interface MigrationState {
  isMigrating: boolean;
  hasMigrated: boolean;
  error: string | null;
  progress: number;
}

export const useMigration = () => {
  const [migrationState, setMigrationState] = useState<MigrationState>({
    isMigrating: false,
    hasMigrated: false,
    error: null,
    progress: 0,
  });

  const [authState, setAuthState] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const checkMigrationStatus = useCallback(async () => {
    if (!authState?.user) return;

    try {
      // Check if user has data in Supabase
      const conversations = await databaseService.loadConversations(authState.user.id);
      const hasBackendData = Object.keys(conversations).length > 0;

      if (hasBackendData) {
        setMigrationState(prev => ({ ...prev, hasMigrated: true }));
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  }, [authState?.user]);

  useEffect(() => {
    checkMigrationStatus();
  }, [checkMigrationStatus]);

  const migrateData = useCallback(async () => {
    if (!authState?.user) {
      setMigrationState(prev => ({ 
        ...prev, 
        error: 'User not authenticated' 
      }));
      return;
    }

    setMigrationState(prev => ({ 
      ...prev, 
      isMigrating: true, 
      error: null,
      progress: 0 
    }));

    try {
      // Step 1: Check localStorage data
      setMigrationState(prev => ({ ...prev, progress: 10 }));
      
      // Check if localStorage is available before accessing it
      const conversationsData = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('otakonConversations') : null;
      const usageData = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('otakonUsage') : null;
      
      if (!conversationsData && !usageData) {
        setMigrationState(prev => ({ 
          ...prev, 
          hasMigrated: true, 
          isMigrating: false,
          progress: 100 
        }));
        return;
      }

      // Step 2: Migrate conversations
      setMigrationState(prev => ({ ...prev, progress: 30 }));
      
      if (conversationsData) {
        await performanceService.measureAsync('migration_conversations', () =>
          databaseService.migrateFromLocalStorage(authState.user.id)
        );
      }

      // Step 3: Verify migration
      setMigrationState(prev => ({ ...prev, progress: 70 }));
      
      const conversations = await databaseService.loadConversations(authState.user.id);
      const hasMigratedData = Object.keys(conversations).length > 0;

      if (hasMigratedData) {
        // Step 4: Clean up localStorage
        setMigrationState(prev => ({ ...prev, progress: 90 }));
        
        await databaseService.cleanupLocalStorage();
        
        setMigrationState(prev => ({ 
          ...prev, 
          hasMigrated: true, 
          isMigrating: false,
          progress: 100 
        }));

        // Record successful migration
        performanceService.recordInteraction('data_migration', true, undefined, {
          conversationsCount: Object.keys(conversations).length,
          userId: authState.user.id,
        });
      } else {
        throw new Error('Migration verification failed');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      
      setMigrationState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Migration failed',
        isMigrating: false 
      }));

      // Record failed migration
      performanceService.recordInteraction('data_migration', false, undefined, {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: authState.user.id,
      });
    }
  }, [authState?.user]);

  const retryMigration = useCallback(() => {
    setMigrationState(prev => ({ ...prev, error: null }));
    migrateData();
  }, [migrateData]);

  const skipMigration = useCallback(() => {
    setMigrationState(prev => ({ ...prev, hasMigrated: true }));
  }, []);

  return {
    migrationState,
    migrateData,
    retryMigration,
    skipMigration,
    checkMigrationStatus,
  };
};
