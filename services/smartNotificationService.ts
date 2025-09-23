/**
 * 🎯 SMART NOTIFICATION SERVICE
 * 
 * Provides intelligent notification management with:
 * 1. Screen lock detection
 * 2. Context-aware notifications
 * 3. Background processing
 * 4. Notification scheduling
 * 5. User preference management
 */

export interface SmartNotificationService {
  getScreenStatus(): ScreenStatus;
  showNotification(message: string, type: NotificationType): void;
  clearNotifications(): void;
  isScreenLocked(): boolean;
  showAINotification(message: string, conversationId: string): void;
  requestNotificationPermission(): Promise<boolean>;
  scheduleNotification(message: string, delay: number): void;
  setNotificationPreferences(preferences: NotificationPreferences): void;
}

export interface ScreenStatus {
  isActive: boolean;
  lastActivity: number;
  status: 'active' | 'idle' | 'locked';
  visibilityState: DocumentVisibilityState;
}

export interface NotificationPreferences {
  enabled: boolean;
  aiResponses: boolean;
  reminders: boolean;
  updates: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'ai_response' | 'reminder';

class SmartNotificationServiceImpl implements SmartNotificationService {
  private static instance: SmartNotificationServiceImpl;
  private notificationPreferences: NotificationPreferences = {
    enabled: true,
    aiResponses: true,
    reminders: true,
    updates: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  };
  private scheduledNotifications = new Map<string, number>();
  private lastActivity = Date.now();
  private activityTimeout: number | null = null;

  static getInstance(): SmartNotificationServiceImpl {
    if (!SmartNotificationServiceImpl.instance) {
      SmartNotificationServiceImpl.instance = new SmartNotificationServiceImpl();
    }
    return SmartNotificationServiceImpl.instance;
  }

  constructor() {
    this.initializeScreenMonitoring();
    this.loadNotificationPreferences();
  }

  // ===== SCREEN STATUS MONITORING =====

  private initializeScreenMonitoring(): void {
    // Monitor visibility changes
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Monitor user activity
    document.addEventListener('mousedown', () => this.updateActivity());
    document.addEventListener('keydown', () => this.updateActivity());
    document.addEventListener('touchstart', () => this.updateActivity());
    document.addEventListener('scroll', () => this.updateActivity());

    // Monitor focus/blur
    window.addEventListener('focus', () => this.updateActivity());
    window.addEventListener('blur', () => this.handleWindowBlur());

    console.log('📱 Screen monitoring initialized');
  }

  private handleVisibilityChange(): void {
    const status = this.getScreenStatus();
    console.log('📱 Screen status changed:', status);
    
    // Handle notifications when screen becomes visible
    if (status.isActive) {
      this.clearScheduledNotifications();
    }
  }

  private handleWindowBlur(): void {
    this.lastActivity = Date.now();
    console.log('📱 Window blurred - user may have switched apps');
  }

  private updateActivity(): void {
    this.lastActivity = Date.now();
    
    // Clear any existing timeout
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    
    // Set timeout to detect idle state
    this.activityTimeout = window.setTimeout(() => {
      console.log('📱 User appears to be idle');
    }, 30000); // 30 seconds of inactivity
  }

  getScreenStatus(): ScreenStatus {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    
    return {
      isActive: document.visibilityState === 'visible',
      lastActivity: this.lastActivity,
      status: this.determineStatus(timeSinceActivity),
      visibilityState: document.visibilityState
    };
  }

  private determineStatus(timeSinceActivity: number): 'active' | 'idle' | 'locked' {
    if (document.visibilityState === 'hidden') {
      return 'locked';
    }
    
    if (timeSinceActivity > 30000) { // 30 seconds
      return 'idle';
    }
    
    return 'active';
  }

  isScreenLocked(): boolean {
    return document.visibilityState === 'hidden';
  }

  // ===== NOTIFICATION MANAGEMENT =====

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  showNotification(message: string, type: NotificationType): void {
    if (!this.notificationPreferences.enabled) {
      console.log('📱 Notifications disabled by user preference');
      return;
    }

    if (this.isInQuietHours()) {
      console.log('📱 Quiet hours active - notification suppressed');
      return;
    }

    if (!this.shouldShowNotification(type)) {
      console.log(`📱 ${type} notifications disabled`);
      return;
    }

    this.createNotification(message, type);
  }

  showAINotification(message: string, conversationId: string): void {
    if (!this.notificationPreferences.aiResponses) {
      return;
    }

    const truncatedMessage = message.length > 100 
      ? message.substring(0, 100) + '...' 
      : message;

    this.createNotification(truncatedMessage, 'ai_response', {
      conversationId,
      clickAction: 'open_conversation'
    });
  }

  private createNotification(
    message: string, 
    type: NotificationType, 
    options: any = {}
  ): void {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notificationOptions: NotificationOptions = {
      body: message,
      icon: this.getNotificationIcon(type),
      badge: '/favicon.ico',
      tag: `otakon_${type}`,
      requireInteraction: type === 'ai_response',
      ...options
    };

    const notification = new Notification('Otakon AI', notificationOptions);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      if (options.clickAction === 'open_conversation' && options.conversationId) {
        // Dispatch custom event to open conversation
        window.dispatchEvent(new CustomEvent('openConversation', {
          detail: { conversationId: options.conversationId }
        }));
      }
    };

    // Auto-close after 5 seconds for non-AI notifications
    if (type !== 'ai_response') {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    console.log(`📱 Notification shown: ${type} - ${message.substring(0, 50)}...`);
  }

  private getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      info: '/icons/info.png',
      success: '/icons/success.png',
      warning: '/icons/warning.png',
      error: '/icons/error.png',
      ai_response: '/icons/ai.png',
      reminder: '/icons/reminder.png'
    };
    
    return icons[type] || icons.info;
  }

  clearNotifications(): void {
    // Clear all scheduled notifications
    this.scheduledNotifications.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();

    // Close any open notifications
    if ('serviceWorker' in navigator && 'getRegistrations' in navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.getNotifications().then(notifications => {
            notifications.forEach(notification => notification.close());
          });
        });
      });
    }

    console.log('📱 All notifications cleared');
  }

  scheduleNotification(message: string, delay: number): void {
    const timeoutId = window.setTimeout(() => {
      this.showNotification(message, 'reminder');
      this.scheduledNotifications.delete(message);
    }, delay);

    this.scheduledNotifications.set(message, timeoutId);
    console.log(`📱 Notification scheduled: ${message} in ${delay}ms`);
  }

  private clearScheduledNotifications(): void {
    this.scheduledNotifications.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();
    console.log('📱 Scheduled notifications cleared');
  }

  // ===== PREFERENCE MANAGEMENT =====

  setNotificationPreferences(preferences: NotificationPreferences): void {
    this.notificationPreferences = { ...preferences };
    this.saveNotificationPreferences();
    console.log('📱 Notification preferences updated:', preferences);
  }

  private loadNotificationPreferences(): void {
    try {
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        this.notificationPreferences = { ...this.notificationPreferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
    }
  }

  private saveNotificationPreferences(): void {
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(this.notificationPreferences));
    } catch (error) {
      console.warn('Failed to save notification preferences:', error);
    }
  }

  private shouldShowNotification(type: NotificationType): boolean {
    switch (type) {
      case 'ai_response':
        return this.notificationPreferences.aiResponses;
      case 'reminder':
        return this.notificationPreferences.reminders;
      case 'info':
      case 'success':
      case 'warning':
      case 'error':
        return this.notificationPreferences.updates;
      default:
        return true;
    }
  }

  private isInQuietHours(): boolean {
    if (!this.notificationPreferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.notificationPreferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.notificationPreferences.quietHours.end.split(':').map(Number);
    
    if (startHour === undefined || startMin === undefined || endHour === undefined || endMin === undefined) {
      return false;
    }
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  // ===== UTILITY METHODS =====

  getNotificationPreferences(): NotificationPreferences {
    return { ...this.notificationPreferences };
  }

  isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  getNotificationPermission(): NotificationPermission {
    return Notification.permission;
  }

  // ===== CLEANUP =====

  cleanup(): void {
    this.clearNotifications();
    
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    console.log('📱 Smart notification service cleaned up');
  }
}

export const smartNotificationService = SmartNotificationServiceImpl.getInstance();