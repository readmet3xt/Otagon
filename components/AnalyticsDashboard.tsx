import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

// Simple types (was from unifiedAnalyticsService)
interface OnboardingFunnelStats {
  stepName: string;
  stepOrder: number;
  completionRate: number;
  averageTimeToComplete: number;
  totalUsers: number;
  skippedUsers: number;
}

interface FeatureUsageStats {
  featureName: string;
  totalUsage: number;
  uniqueUsers: number;
  averageUsagePerUser: number;
  mostActiveUsers: number;
}

interface TierConversionStats {
  tier: string;
  conversions: number;
  revenue: number;
  conversionRate: number;
  fromTier: string;
  toTier: string;
  totalAttempts: number;
  successfulUpgrades: number;
  avgAmount: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [onboardingStats, setOnboardingStats] = useState<OnboardingFunnelStats[]>([]);
  const [conversionStats, setConversionStats] = useState<TierConversionStats[]>([]);
  const [featureStats, setFeatureStats] = useState<FeatureUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const {
    getOnboardingFunnelStats,
    getTierConversionStats,
    getFeatureUsageStats,
  } = useAnalytics();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const [onboarding, conversion, feature] = await Promise.all([
        getOnboardingFunnelStats(startDate, endDate),
        getTierConversionStats(startDate, endDate),
        getFeatureUsageStats(startDate, endDate)
      ]);

      setOnboardingStats(onboarding);
      setConversionStats(conversion);
      setFeatureStats(feature);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="p-6 bg-[#1C1C1C] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-neutral-400">Track user behavior, conversions, and feature usage</p>
          
          {/* Date Range Selector */}
          <div className="mt-4 flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-[#E53A3A] text-white'
                    : 'bg-[#2E2E2E] text-neutral-300 hover:bg-[#424242]'
                }`}
              >
                Last {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E53A3A]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Onboarding Funnel */}
            <div className="bg-[#2E2E2E] rounded-xl p-6 border border-[#424242]">
              <h2 className="text-xl font-semibold text-white mb-4">Onboarding Funnel</h2>
              {onboardingStats.length > 0 ? (
                <div className="space-y-4">
                  {onboardingStats.map((step, index) => (
                    <div key={step.stepName} className="bg-[#1C1C1C] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-white">{step.stepName}</h3>
                        <span className="text-sm text-neutral-400">Step {step.stepOrder}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-400">Completion Rate</p>
                          <p className="text-white font-semibold">{formatPercentage(step.completionRate)}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400">Avg Duration</p>
                          <p className="text-white font-semibold">{formatDuration(step.averageTimeToComplete)}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400">Total Users</p>
                          <p className="text-white font-semibold">{step.totalUsers}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400">Drop-offs</p>
                          <p className="text-red-400 font-semibold">{step.skippedUsers}</p>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3 bg-[#424242] rounded-full h-2">
                        <div 
                          className="bg-[#E53A3A] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${step.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-8">No onboarding data available</p>
              )}
            </div>

            {/* Tier Conversion Rates */}
            <div className="bg-[#2E2E2E] rounded-xl p-6 border border-[#424242]">
              <h2 className="text-xl font-semibold text-white mb-4">Tier Conversion Rates</h2>
              {conversionStats.length > 0 ? (
                <div className="space-y-4">
                  {conversionStats.map((conversion, index) => (
                    <div key={`${conversion.fromTier}-${conversion.toTier}`} className="bg-[#1C1C1C] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-white">
                          {conversion.fromTier} → {conversion.toTier}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          conversion.conversionRate > 50 ? 'bg-green-900/30 text-green-400' :
                          conversion.conversionRate > 20 ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-red-900/30 text-red-400'
                        }`}>
                          {formatPercentage(conversion.conversionRate)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-400">Total Attempts</p>
                          <p className="text-white font-semibold">{conversion.totalAttempts}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400">Successful</p>
                          <p className="text-green-400 font-semibold">{conversion.successfulUpgrades}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400">Failed</p>
                          <p className="text-red-400 font-semibold">
                            {conversion.totalAttempts - conversion.successfulUpgrades}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-400">Avg Amount</p>
                          <p className="text-white font-semibold">
                            {conversion.avgAmount ? `$${conversion.avgAmount}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-8">No conversion data available</p>
              )}
            </div>

            {/* Feature Usage Patterns */}
            <div className="lg:col-span-2 bg-[#2E2E2E] rounded-xl p-6 border border-[#424242]">
              <h2 className="text-xl font-semibold text-white mb-4">Feature Usage Patterns</h2>
              {featureStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featureStats.map((feature, index) => (
                    <div key={`${feature.featureName}-${index}`} className="bg-[#1C1C1C] rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-white capitalize">{feature.featureName.replace(/_/g, ' ')}</h3>
                          <p className="text-sm text-neutral-400 capitalize">feature</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-[#424242] rounded text-neutral-300">
                          {feature.uniqueUsers} users
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Total Usage:</span>
                          <span className="text-white font-semibold">{feature.totalUsage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Avg per User:</span>
                          <span className="text-white font-semibold">{feature.averageUsagePerUser.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Power Users:</span>
                          <span className="text-[#E53A3A] font-semibold">{feature.mostActiveUsers}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-8">No feature usage data available</p>
              )}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="px-6 py-3 bg-[#E53A3A] hover:bg-[#D42A2A] disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh Analytics'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
