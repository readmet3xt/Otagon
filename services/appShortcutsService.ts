export interface AppShortcut {
  name: string;
  short_name: string;
  description: string;
  url: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

export interface AppShortcutsService {
  isSupported(): boolean;
  installShortcuts(): Promise<void>;
  getShortcuts(): AppShortcut[];
}

class AppShortcutsServiceImpl implements AppShortcutsService {
  private shortcuts: AppShortcut[] = [
    {
      name: 'New Chat',
      short_name: 'Chat',
      description: 'Start a new conversation',
      url: '/?shortcut=new-chat',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    },
    {
      name: 'Voice Commands',
      short_name: 'Voice',
      description: 'Use hands-free voice commands',
      url: '/?shortcut=voice',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    },
    {
      name: 'Settings',
      short_name: 'Settings',
      description: 'Manage your preferences',
      url: '/?shortcut=settings',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        }
      ]
    }
  ];

  isSupported(): boolean {
    return 'BeforeInstallPromptEvent' in window || 
           'standalone' in window.navigator ||
           window.matchMedia('(display-mode: standalone)').matches;
  }

  async installShortcuts(): Promise<void> {
    if (!this.isSupported()) {
      console.log('App shortcuts not supported on this device');
      return;
    }

    try {
      // For Android, shortcuts are defined in manifest.json
      // For iOS, we can use meta tags and custom URL schemes
      console.log('App shortcuts configured');
    } catch (error) {
      console.error('Failed to install app shortcuts:', error);
    }
  }

  getShortcuts(): AppShortcut[] {
    return this.shortcuts;
  }

  // Handle shortcut navigation
  handleShortcut(url: string): string | null {
    const shortcut = this.shortcuts.find(s => s.url === url);
    if (shortcut) {
      console.log('App shortcut activated:', shortcut.name);
      return shortcut.url;
    }
    return null;
  }
}

export const appShortcutsService = new AppShortcutsServiceImpl();
