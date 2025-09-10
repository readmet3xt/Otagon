import { lazy } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Lazy load heavy modals that are conditionally rendered
export const LazySettingsModal = lazy(() => import('./SettingsModal'));
export const LazyConnectionModal = lazy(() => import('./ConnectionModal'));
export const LazyHandsFreeModal = lazy(() => import('./HandsFreeModal'));
export const LazyPlayerProfileSetupModal = lazy(() => 
  import('./PlayerProfileSetupModal').then(module => ({ default: module.PlayerProfileSetupModal }))
);
export const LazyGameProgressModal = lazy(() => import('./GameProgressModal'));
export const LazyOtakuDiaryModal = lazy(() => 
  import('./OtakuDiaryModal').then(module => ({ default: module.OtakuDiaryModal }))
);
export const LazyWishlistModal = lazy(() => 
  import('./WishlistModal').then(module => ({ default: module.WishlistModal }))
);
export const LazyTierUpgradeModal = lazy(() => 
  import('./TierUpgradeModal').then(module => ({ default: module.TierUpgradeModal }))
);
export const LazyInsightActionModal = lazy(() => import('./InsightActionModal'));
export const LazyFeedbackModal = lazy(() => import('./FeedbackModal'));
export const LazyCreditModal = lazy(() => import('./CreditModal'));
export const LazyConfirmationModal = lazy(() => import('./ConfirmationModal'));

// Lazy load heavy screens
export const LazyUpgradeSplashScreen = lazy(() => import('./UpgradeSplashScreen'));
export const LazyProFeaturesSplashScreen = lazy(() => import('./ProFeaturesSplashScreen'));
export const LazyTierSplashScreen = lazy(() => import('./TierSplashScreen'));

// Lazy load feature components that aren't always needed
export const LazyLandingPage = lazy(() => import('./new-landing/LandingPage'));
export const LazyPerformanceDashboard = lazy(() => import('./PerformanceDashboard'));
export const LazyCachePerformanceDashboard = lazy(() => import('./CachePerformanceDashboard'));

// Simple loading fallback component (animation only)
export const LoadingFallback: React.FC<{ message?: string }> = () => (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="w-44 h-20 flex items-center justify-center">
      <DotLottieReact
        src="https://lottie.host/5208dfc0-fcec-424d-a426-e2d8988bf9fa/oiI54cVHly.lottie"
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  </div>
);

// Error boundary fallback
export const LazyErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md">
      <h3 className="text-lg font-semibold text-red-600 mb-2">Loading Error</h3>
      <p className="text-gray-700 mb-4">
        Failed to load component. Please try again.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Reload App
      </button>
    </div>
  </div>
);
