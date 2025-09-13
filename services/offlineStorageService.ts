import { Conversation, Usage } from './types';

export interface OfflineData {
  conversations: Conversation[];
  usage: Usage;
  lastSync: number;
  offline: boolean;
}

export interface OfflineStorageService {
  // Conversation management
  saveConversation(conversation: Conversation): Promise<void>;
  getConversation(id: string): Promise<Conversation | null>;
  getAllConversations(): Promise<Conversation[]>;
  deleteConversation(id: string): Promise<void>;
  
  // Usage management
  saveUsage(usage: Usage): Promise<void>;
  getUsage(): Promise<Usage | null>;
  
  // Sync management
  markForSync(): Promise<void>;
  getOfflineData(): Promise<OfflineData>;
  clearOfflineData(): Promise<void>;
  
  // Database management
  initialize(): Promise<void>;
  isAvailable(): boolean;
}

class IndexedDBOfflineStorage implements OfflineStorageService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'OtakonOfflineDB';
  private readonly DB_VERSION = 1;
  private readonly STORES = {
    conversations: 'conversations',
    usage: 'usage',
    sync: 'sync'
  };

  async initialize(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('IndexedDB not available');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create conversations store
        if (!db.objectStoreNames.contains(this.STORES.conversations)) {
          const conversationsStore = db.createObjectStore(this.STORES.conversations, { keyPath: 'id' });
          conversationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Create usage store
        if (!db.objectStoreNames.contains(this.STORES.usage)) {
          db.createObjectStore(this.STORES.usage, { keyPath: 'id' });
        }
        
        // Create sync store
        if (!db.objectStoreNames.contains(this.STORES.sync)) {
          db.createObjectStore(this.STORES.sync, { keyPath: 'id' });
        }
      };
    });
  }

  isAvailable(): boolean {
    return 'indexedDB' in window;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.conversations], 'readwrite');
      const store = transaction.objectStore(this.STORES.conversations);
      
      const request = store.put(conversation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConversation(id: string): Promise<Conversation | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.conversations], 'readonly');
      const store = transaction.objectStore(this.STORES.conversations);
      
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllConversations(): Promise<Conversation[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.conversations], 'readonly');
      const store = transaction.objectStore(this.STORES.conversations);
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.conversations], 'readwrite');
      const store = transaction.objectStore(this.STORES.conversations);
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveUsage(usage: Usage): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.usage], 'readwrite');
      const store = transaction.objectStore(this.STORES.usage);
      
      const request = store.put(usage);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUsage(): Promise<Usage | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.usage], 'readonly');
      const store = transaction.objectStore(this.STORES.usage);
      
      const request = store.get('current');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async markForSync(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.sync], 'readwrite');
      const store = transaction.objectStore(this.STORES.sync);
      
      const syncMarker = {
        id: 'sync-required',
        timestamp: Date.now(),
        type: 'offline-data'
      };
      
      const request = store.put(syncMarker);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineData(): Promise<OfflineData> {
    const conversations = await this.getAllConversations();
    const usage = await this.getUsage();
    
    return {
      conversations,
              usage: usage || { 
                tier: 'free', 
                textQueries: 0,
                imageQueries: 0,
                insights: 0,
                textCount: 0, 
                imageCount: 0, 
                textLimit: 55, 
                imageLimit: 25 
              },
      lastSync: Date.now(),
      offline: true
    };
  }

  async clearOfflineData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([
        this.STORES.conversations, 
        this.STORES.usage, 
        this.STORES.sync
      ], 'readwrite');
      
      const conversationsStore = transaction.objectStore(this.STORES.conversations);
      const usageStore = transaction.objectStore(this.STORES.usage);
      const syncStore = transaction.objectStore(this.STORES.sync);
      
      conversationsStore.clear();
      usageStore.clear();
      syncStore.clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Export singleton instance
export const offlineStorageService = new IndexedDBOfflineStorage();
