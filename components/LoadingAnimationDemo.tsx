import React, { useState } from 'react';
import TypingIndicator from './TypingIndicator';
import Skeleton from './Skeleton';
import CircularProgress from './CircularProgress';

const LoadingAnimationDemo: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<'dots' | 'skeleton' | 'wave' | 'circular'>('dots');
  const [selectedSkeleton, setSelectedSkeleton] = useState<'text' | 'circular' | 'rectangular' | 'avatar' | 'card'>('text');
  const [selectedProgress, setSelectedProgress] = useState<'indeterminate' | 'determinate'>('indeterminate');
  const [progressValue, setProgressValue] = useState(45);

  return (
    <div className="p-6 space-y-8 bg-[#1C1C1C] text-[#F5F5F5]">
      <h2 className="text-2xl font-bold text-center mb-8">🎨 Loading Animation Showcase</h2>
      
      {/* TypingIndicator Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">TypingIndicator Variants</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setSelectedVariant('dots')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedVariant === 'dots' 
                ? 'bg-[#FF4D4D] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Dots
          </button>
          <button
            onClick={() => setSelectedVariant('skeleton')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedVariant === 'skeleton' 
                ? 'bg-[#FF4D4D] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Skeleton
          </button>
          <button
            onClick={() => setSelectedVariant('wave')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedVariant === 'wave' 
                ? 'bg-[#FF4D4D] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Wave
          </button>
          <button
            onClick={() => setSelectedVariant('circular')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedVariant === 'circular' 
                ? 'bg-[#FF4D4D] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Circular
          </button>
        </div>
        
        <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          <TypingIndicator variant={selectedVariant} />
        </div>
      </div>

      {/* Skeleton Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FFAB40]">Skeleton Variants</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setSelectedSkeleton('text')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedSkeleton === 'text' 
                ? 'bg-[#FFAB40] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setSelectedSkeleton('circular')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedSkeleton === 'circular' 
                ? 'bg-[#FFAB40] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Circular
          </button>
          <button
            onClick={() => setSelectedSkeleton('rectangular')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedSkeleton === 'rectangular' 
                ? 'bg-[#FFAB40] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Rectangular
          </button>
          <button
            onClick={() => setSelectedSkeleton('avatar')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedSkeleton === 'avatar' 
                ? 'bg-[#FFAB40] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Avatar
          </button>
          <button
            onClick={() => setSelectedSkeleton('card')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedSkeleton === 'card' 
                ? 'bg-[#FFAB40] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Card
          </button>
        </div>
        
        <div className="p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          {selectedSkeleton === 'text' && <Skeleton variant="text" lines={3} />}
          {selectedSkeleton === 'circular' && <Skeleton variant="circular" size="large" />}
          {selectedSkeleton === 'rectangular' && <Skeleton variant="rectangular" height="120px" />}
          {selectedSkeleton === 'avatar' && <Skeleton variant="avatar" />}
          {selectedSkeleton === 'card' && <Skeleton variant="card" />}
        </div>
      </div>

      {/* CircularProgress Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#5CBB7B]">CircularProgress Variants</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setSelectedProgress('indeterminate')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedProgress === 'indeterminate' 
                ? 'bg-[#5CBB7B] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Indeterminate
          </button>
          <button
            onClick={() => setSelectedProgress('determinate')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedProgress === 'determinate' 
                ? 'bg-[#5CBB7B] text-white' 
                : 'bg-[#2E2E2E] text-[#CFCFCF] hover:bg-[#424242]'
            }`}
          >
            Determinate
          </button>
        </div>
        
        {selectedProgress === 'determinate' && (
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) => setProgressValue(parseInt(e.target.value))}
              className="flex-1 h-2 bg-[#424242] rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-[#CFCFCF] w-12">{progressValue}%</span>
          </div>
        )}
        
        <div className="flex items-center gap-8 p-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30">
          <div className="text-center">
            <CircularProgress 
              variant={selectedProgress} 
              value={selectedProgress === 'determinate' ? progressValue : undefined}
              size="small"
              showLabel={selectedProgress === 'determinate'}
            />
            <p className="text-xs text-[#A3A3A3] mt-2">Small</p>
          </div>
          
          <div className="text-center">
            <CircularProgress 
              variant={selectedProgress} 
              value={selectedProgress === 'determinate' ? progressValue : undefined}
              size="medium"
              showLabel={selectedProgress === 'determinate'}
            />
            <p className="text-xs text-[#A3A3A3] mt-2">Medium</p>
          </div>
          
          <div className="text-center">
            <CircularProgress 
              variant={selectedProgress} 
              value={selectedProgress === 'determinate' ? progressValue : undefined}
              size="large"
              showLabel={selectedProgress === 'determinate'}
            />
            <p className="text-xs text-[#A3A3A3] mt-2">Large</p>
          </div>
        </div>
      </div>

      {/* Color Variants */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[#FF4D4D]">Color Variants</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <CircularProgress color="primary" size="medium" />
            <p className="text-xs text-[#A3A3A3] mt-2">Primary</p>
          </div>
          <div className="text-center">
            <CircularProgress color="secondary" size="medium" />
            <p className="text-xs text-[#A3A3A3] mt-2">Secondary</p>
          </div>
          <div className="text-center">
            <CircularProgress color="success" size="medium" />
            <p className="text-xs text-[#A3A3A3] mt-2">Success</p>
          </div>
          <div className="text-center">
            <CircularProgress color="warning" size="medium" />
            <p className="text-xs text-[#A3A3A3] mt-2">Warning</p>
          </div>
          <div className="text-center">
            <CircularProgress color="error" size="medium" />
            <p className="text-xs text-[#A3A3A3] mt-2">Error</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimationDemo;




