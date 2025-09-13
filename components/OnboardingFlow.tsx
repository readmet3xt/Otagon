import React from 'react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Welcome to Otagon</h1>
        <p className="text-gray-300 mb-8">Let's get you started!</p>
        <button
          onClick={onComplete}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
