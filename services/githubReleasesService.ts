import { GITHUB_CONFIG, getGitHubApiUrl, getReleasesUrl } from '../config/github';

export interface GitHubRelease {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
  assetCount: number;
  platformAssets: {
    windows?: string;
    mac?: string;
    linux?: string;
  };
}

export interface GitHubReleasesService {
  getLatestRelease(): Promise<GitHubRelease | null>;
  getReleaseByVersion(version: string): Promise<GitHubRelease | null>;
  getAllReleases(): Promise<GitHubRelease[]>;
}

class GitHubReleasesServiceImpl implements GitHubReleasesService {
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cache: { data: GitHubRelease | null; timestamp: number } | null = null;

  private async fetchFromGitHub(endpoint: string): Promise<any> {
    try {
      const response = await fetch(getGitHubApiUrl(endpoint), {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Otakon-App'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch from GitHub:', error);
      throw error;
    }
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.CACHE_DURATION;
  }

  private getPlatformAssets(release: any): { windows?: string; mac?: string; linux?: string } {
    const assets = release.assets || [];
    const platformAssets: { windows?: string; mac?: string; linux?: string } = {};

    // Electron build output patterns
    const patterns = {
      windows: [
        { name: 'win-unpacked', ext: '.exe' },
        { name: 'win', ext: '.exe' },
        { name: 'windows', ext: '.exe' },
        { name: 'Setup', ext: '.exe' },
        { name: 'otakon', ext: '.exe' }
      ],
      mac: [
        { name: 'mac', ext: '.dmg' },
        { name: 'mac-unpacked', ext: '.app' },
        { name: 'darwin', ext: '.dmg' },
        { name: 'otakon', ext: '.dmg' }
      ],
      linux: [
        { name: 'linux-unpacked', ext: '' },
        { name: 'linux', ext: '.AppImage' },
        { name: 'otakon', ext: '.AppImage' },
        { name: 'otakon', ext: '.deb' }
      ]
    };

    // Find assets for each platform
    Object.entries(patterns).forEach(([platform, platformPatterns]) => {
      for (const pattern of platformPatterns) {
        const asset = assets.find((a: any) => {
          const name = a.name.toLowerCase();
          return name.includes(pattern.name.toLowerCase()) && 
                 (pattern.ext === '' || a.name.toLowerCase().endsWith(pattern.ext.toLowerCase()));
        });
        
        if (asset) {
          platformAssets[platform as keyof typeof platformAssets] = asset.browser_download_url;
          break;
        }
      }
    });

    return platformAssets;
  }

  private getBestAssetForPlatform(platformAssets: any, userPlatform: string): string | null {
    // Priority order for different platforms
    const platformPriorities = [
      { platform: 'win', key: 'windows' },
      { platform: 'mac', key: 'mac' },
      { platform: 'linux', key: 'linux' }
    ];

    // Try to find the best asset for the user's platform
    for (const priority of platformPriorities) {
      if (priority.platform === userPlatform && platformAssets[priority.key]) {
        return platformAssets[priority.key];
      }
    }

    // Fallback to first available asset
    const allAssets = Object.values(platformAssets).filter(Boolean);
    return allAssets.length > 0 ? allAssets[0] as string : null;
  }

  private detectUserPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('win')) return 'win';
    if (userAgent.includes('mac')) return 'mac';
    if (userAgent.includes('linux')) return 'linux';
    
    return 'win'; // Default fallback
  }

  async getLatestRelease(): Promise<GitHubRelease | null> {
    // Check cache first
    if (this.isCacheValid() && this.cache?.data) {
      return this.cache.data;
    }

    try {
      const release = await this.fetchFromGitHub('/releases/latest');
      const platformAssets = this.getPlatformAssets(release);
      const userPlatform = this.detectUserPlatform();
      
      const githubRelease: GitHubRelease = {
        version: release.tag_name,
        downloadUrl: this.getBestAssetForPlatform(platformAssets, userPlatform) || '',
        releaseNotes: release.body || 'No release notes available.',
        publishedAt: release.published_at,
        assetCount: release.assets?.length || 0,
        platformAssets
      };

      // Cache the result
      this.cache = {
        data: githubRelease,
        timestamp: Date.now()
      };

      return githubRelease;
    } catch (error) {
      console.error('Failed to get latest release:', error);
      return null;
    }
  }

  async getReleaseByVersion(version: string): Promise<GitHubRelease | null> {
    try {
      const releases = await this.fetchFromGitHub('/releases');
      const release = releases.find((r: any) => r.tag_name === version);
      
      if (!release) return null;

      const platformAssets = this.getPlatformAssets(release);
      const userPlatform = this.detectUserPlatform();

      return {
        version: release.tag_name,
        downloadUrl: this.getBestAssetForPlatform(platformAssets, userPlatform) || '',
        releaseNotes: release.body || 'No release notes available.',
        publishedAt: release.published_at,
        assetCount: release.assets?.length || 0,
        platformAssets
      };
    } catch (error) {
      console.error(`Failed to get release ${version}:`, error);
      return null;
    }
  }

  async getAllReleases(): Promise<GitHubRelease[]> {
    try {
      const releases = await this.fetchFromGitHub('/releases');
      
      return releases.map((release: any) => {
        const platformAssets = this.getPlatformAssets(release);
        const userPlatform = this.detectUserPlatform();

        return {
          version: release.tag_name,
          downloadUrl: this.getBestAssetForPlatform(platformAssets, userPlatform) || '',
          releaseNotes: release.body || 'No release notes available.',
          publishedAt: release.published_at,
          assetCount: release.assets?.length || 0,
          platformAssets
        };
      });
    } catch (error) {
      console.error('Failed to get all releases:', error);
      return [];
    }
  }

  // Helper method to format version for display
  formatVersion(version: string): string {
    return version.startsWith('v') ? version : `v${version}`;
  }

  // Helper method to format date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Helper method to get download button text
  getDownloadButtonText(platform?: string): string {
    const detectedPlatform = platform || this.detectUserPlatform();
    
    switch (detectedPlatform) {
      case 'win': return 'Download for Windows';
      case 'mac': return 'Download for macOS';
      case 'linux': return 'Download for Linux';
      default: return 'Download PC Client';
    }
  }

  // Get repository URL
  getRepositoryUrl(): string {
    return GITHUB_CONFIG.REPO_URL;
  }

  // Get releases URL
  getReleasesUrl(): string {
    return getReleasesUrl();
  }

  // Get all available platforms for a release
  getAvailablePlatforms(release: GitHubRelease): string[] {
    const platforms: string[] = [];
    if (release.platformAssets.windows) platforms.push('Windows');
    if (release.platformAssets.mac) platforms.push('macOS');
    if (release.platformAssets.linux) platforms.push('Linux');
    return platforms;
  }
}

export const githubReleasesService = new GitHubReleasesServiceImpl();
