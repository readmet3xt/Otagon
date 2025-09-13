import { authStateManager } from './authStateManager';

/**
 * 🔔 NOTIFICATION SERVICE
 * 
 * This service provides user notifications for persistence events,
 * errors, and important state changes with proper retry logic.
 * 
 * Features:
 * 1. Toast notifications with different types
 * 2. Retry logic with exponential backoff
 * 3. User-friendly error messages
 * 4. Integration with auth state
 * 5. Persistent notification queue
 */

export interface Notification {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: number;
    duration?: number;
    actions?: NotificationAction[];
    persistent?: boolean;
    retryable?: boolean;
    retryCount?: number;
    maxRetries?: number;
}

export interface NotificationAction {
    label: string;
    action: () => void;
    type?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationQueue {
    notifications: Notification[];
    lastProcessed: number;
}

class NotificationService {
    private static instance: NotificationService;
    private notifications: Map<string, Notification> = new Map();
    private queue: Notification[] = [];
    private isProcessing = false;
    private readonly MAX_QUEUE_SIZE = 50;
    private readonly DEFAULT_DURATION = 5000;
    private readonly RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Exponential backoff

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    constructor() {
        this.initialize();
    }

    /**
     * Initialize the notification service
     */
    private initialize(): void {
        // Subscribe to auth state changes
        authStateManager.subscribe((event) => {
            this.handleAuthStateChange(event);
        });

        // Load persistent notifications from localStorage
        this.loadPersistentNotifications();

        // Start processing queue
        this.processQueue();
    }

    /**
     * Show a notification
     */
    show(notification: Omit<Notification, 'id' | 'timestamp'>): string {
        const id = this.generateId();
        const fullNotification: Notification = {
            id,
            timestamp: Date.now(),
            duration: this.DEFAULT_DURATION,
            retryCount: 0,
            maxRetries: 3,
            ...notification
        };

        // Add to queue
        this.queue.push(fullNotification);
        
        // Limit queue size
        if (this.queue.length > this.MAX_QUEUE_SIZE) {
            this.queue.shift(); // Remove oldest
        }

        // Process queue
        this.processQueue();

        return id;
    }

    /**
     * Show success notification
     */
    success(title: string, message: string, options?: Partial<Notification>): string {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    /**
     * Show warning notification
     */
    warning(title: string, message: string, options?: Partial<Notification>): string {
        return this.show({
            type: 'warning',
            title,
            message,
            duration: 7000, // Longer duration for warnings
            ...options
        });
    }

    /**
     * Show error notification
     */
    error(title: string, message: string, options?: Partial<Notification>): string {
        return this.show({
            type: 'error',
            title,
            message,
            duration: 10000, // Longer duration for errors
            persistent: true, // Errors are persistent by default
            retryable: true,
            ...options
        });
    }

    /**
     * Show info notification
     */
    info(title: string, message: string, options?: Partial<Notification>): string {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    /**
     * Show persistence-specific notifications
     */
    showPersistenceNotification(
        type: 'save_success' | 'save_failed' | 'load_failed' | 'conflict_resolved' | 'retry_attempt',
        details?: any
    ): string {
        switch (type) {
            case 'save_success':
                return this.success(
                    'Conversations Saved',
                    'Your conversations have been saved successfully.',
                    { duration: 3000 }
                );

            case 'save_failed':
                return this.error(
                    'Save Failed',
                    'Failed to save your conversations. They are stored locally and will be synced when possible.',
                    {
                        actions: [
                            {
                                label: 'Retry Now',
                                action: () => this.retrySave(),
                                type: 'primary'
                            }
                        ]
                    }
                );

            case 'load_failed':
                return this.error(
                    'Load Failed',
                    'Failed to load your conversations. Using local backup.',
                    {
                        actions: [
                            {
                                label: 'Reload',
                                action: () => window.location.reload(),
                                type: 'primary'
                            }
                        ]
                    }
                );

            case 'conflict_resolved':
                return this.warning(
                    'Conflicts Resolved',
                    'Conversation conflicts were detected and resolved automatically.',
                    { duration: 5000 }
                );

            case 'retry_attempt':
                const retryCount = details?.retryCount || 0;
                const maxRetries = details?.maxRetries || 3;
                return this.info(
                    'Retrying Save',
                    `Attempting to save conversations... (${retryCount + 1}/${maxRetries})`,
                    { duration: 2000 }
                );

            default:
                return this.info('Persistence Update', 'Your data has been updated.');
        }
    }

    /**
     * Dismiss a notification
     */
    dismiss(id: string): void {
        this.notifications.delete(id);
        this.queue = this.queue.filter(n => n.id !== id);
        this.savePersistentNotifications();
    }

    /**
     * Dismiss all notifications
     */
    dismissAll(): void {
        this.notifications.clear();
        this.queue = [];
        this.savePersistentNotifications();
    }

    /**
     * Retry a failed operation
     */
    async retrySave(): Promise<void> {
        try {
            // Import atomic conversation service
            const { secureConversationService } = await import('./atomicConversationService');
            
            // Get current conversations from localStorage
            const conversations = this.getCurrentConversations();
            
            if (conversations) {
                // Save each conversation individually since saveConversations doesn't exist
                for (const [conversationId, conversation] of Object.entries(conversations)) {
                    const conv = conversation as any; // Type assertion for localStorage data
                    await secureConversationService.saveConversation(conversationId, conv.title, conv.messages, conv.insights, conv.context, conv.game_id || conv.gameId, conv.is_pinned || conv.isPinned, false);
                }
                
                this.success('Save Retry Successful', 'Your conversations have been saved successfully.');
            } else {
                this.warning('No Data to Save', 'No conversations found to save.');
            }
        } catch (error) {
            this.error('Retry Failed', 'Failed to save conversations. Please try again later.');
        }
    }

    /**
     * Process notification queue
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const notification = this.queue.shift()!;
            
            try {
                await this.displayNotification(notification);
                this.notifications.set(notification.id, notification);
            } catch (error) {
                console.error('Failed to display notification:', error);
                
                // Retry if retryable
                if (notification.retryable && (notification.retryCount || 0) < (notification.maxRetries || 3)) {
                    notification.retryCount = (notification.retryCount || 0) + 1;
                    const delay = this.RETRY_DELAYS[Math.min(notification.retryCount - 1, this.RETRY_DELAYS.length - 1)];
                    
                    setTimeout(() => {
                        this.queue.push(notification);
                        this.processQueue();
                    }, delay);
                }
            }
        }

        this.isProcessing = false;
        this.savePersistentNotifications();
    }

    /**
     * Display a notification
     */
    private async displayNotification(notification: Notification): Promise<void> {
        // This would integrate with your UI notification system
        // For now, we'll use console logging and could integrate with a toast library
        
        const emoji = this.getEmojiForType(notification.type);
        const timestamp = new Date(notification.timestamp).toLocaleTimeString();
        
        console.log(`${emoji} [${timestamp}] ${notification.title}: ${notification.message}`);
        
        // In a real implementation, you would:
        // 1. Create a toast notification element
        // 2. Add it to the DOM
        // 3. Set up auto-dismiss timer
        // 4. Handle user interactions
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Get emoji for notification type
     */
    private getEmojiForType(type: string): string {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    }

    /**
     * Handle auth state changes
     */
    private handleAuthStateChange(event: any): void {
        switch (event.type) {
            case 'SIGNED_IN':
                this.success('Welcome Back!', 'You have been signed in successfully.');
                break;
            case 'SIGNED_OUT':
                this.info('Signed Out', 'You have been signed out successfully.');
                this.dismissAll(); // Clear notifications on sign out
                break;
            case 'ERROR':
                this.error('Authentication Error', event.newState.error || 'An authentication error occurred.');
                break;
        }
    }

    /**
     * Get current conversations from localStorage
     */
    private getCurrentConversations(): any {
        try {
            const saved = localStorage.getItem('otakon_conversations_v2');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Load persistent notifications from localStorage
     */
    private loadPersistentNotifications(): void {
        try {
            const saved = localStorage.getItem('otakon_notifications');
            if (saved) {
                const queue: NotificationQueue = JSON.parse(saved);
                
                // Only load notifications from the last 24 hours
                const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
                const recentNotifications = queue.notifications.filter(n => n.timestamp > dayAgo);
                
                this.queue = recentNotifications;
            }
        } catch (error) {
            console.warn('Failed to load persistent notifications:', error);
        }
    }

    /**
     * Save persistent notifications to localStorage
     */
    private savePersistentNotifications(): void {
        try {
            const persistentNotifications = this.queue.filter(n => n.persistent);
            const queue: NotificationQueue = {
                notifications: persistentNotifications,
                lastProcessed: Date.now()
            };
            
            localStorage.setItem('otakon_notifications', JSON.stringify(queue));
        } catch (error) {
            console.warn('Failed to save persistent notifications:', error);
        }
    }

    /**
     * Generate unique notification ID
     */
    private generateId(): string {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get notification statistics
     */
    getStats(): {
        activeNotifications: number;
        queueLength: number;
        isProcessing: boolean;
    } {
        return {
            activeNotifications: this.notifications.size,
            queueLength: this.queue.length,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Clean up resources
     */
    cleanup(): void {
        this.dismissAll();
        this.isProcessing = false;
    }
}

export const notificationService = NotificationService.getInstance();

