import React from 'react';

const AdBanner: React.FC = () => {
  return (
    <div className="flex-shrink-0 bg-neutral-900 border-y border-[#2E2E2E]/60 animate-fade-in">
        <div className="w-full max-w-4xl mx-auto p-2 flex items-center justify-center">
            <div className="w-full h-16 bg-neutral-800/50 border border-dashed border-neutral-700 rounded-lg flex items-center justify-center">
                <p className="text-neutral-500 text-sm font-medium">Ad Placeholder</p>
            </div>
        </div>
    </div>
  );
};

export default AdBanner;
