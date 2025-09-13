// Stub service for smartNotificationService
// This is a placeholder implementation

export interface SmartNotificationService {
  getScreenStatus(): any;
  showNotification(message: string, type: string): void;
  clearNotifications(): void;
  isScreenLocked(): boolean;
  showAINotification(message: string, conversationId: string): void;
}

class SmartNotificationServiceImpl implements SmartNotificationService {
  private static instance: SmartNotificationServiceImpl;

  static getInstance(): SmartNotificationServiceImpl {
    if (!SmartNotificationServiceImpl.instance) {
      SmartNotificationServiceImpl.instance = new SmartNotificationServiceImpl();
    }
    return SmartNotificationServiceImpl.instance;
  }

  // Stub methods
  getScreenStatus(): any {
    console.log('SmartNotificationService.getScreenStatus (stub)');
    return {
      isActive: true,
      lastActivity: Date.now(),
      status: 'active'
    };
  }

  showNotification(message: string, type: string): void {
    console.log('SmartNotificationService.showNotification (stub):', message, type);
  }

  clearNotifications(): void {
    console.log('SmartNotificationService.clearNotifications (stub)');
  }

  // Additional missing methods for useChat.ts compatibility
  isScreenLocked(): boolean {
    console.log('SmartNotificationService.isScreenLocked (stub)');
    return false;
  }

  showAINotification(message: string, conversationId: string): void {
    console.log('SmartNotificationService.showAINotification (stub):', message, conversationId);
  }
}

export const smartNotificationService = (): SmartNotificationService => {
  return SmartNotificationServiceImpl.getInstance();
};