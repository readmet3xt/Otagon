// GitHub Repository Configuration
// Update these values to match your actual GitHub repository

export const GITHUB_CONFIG = {
  // Your GitHub username
  REPO_OWNER: 'readmet3xt',
  
  // Repository name for the PC client
  REPO_NAME: 'otakon-pc-client',
  
  // Full repository URL
  REPO_URL: 'https://github.com/readmet3xt/otakon-pc-client',
  
  // Releases page URL
  RELEASES_URL: 'https://github.com/readmet3xt/otakon-pc-client/releases',
  
  // API base URL (usually don't change this)
  API_BASE: 'https://api.github.com'
};

// Helper function to get the full API URL for a specific endpoint
export const getGitHubApiUrl = (endpoint: string): string => {
  return `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}${endpoint}`;
};

// Helper function to get the repository URL
export const getRepositoryUrl = (): string => {
  return GITHUB_CONFIG.REPO_URL;
};

// Helper function to get the releases URL
export const getReleasesUrl = (): string => {
  return GITHUB_CONFIG.RELEASES_URL;
};
