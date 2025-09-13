import React from 'react';

interface OnboardingFlowProps {
  onComplete: () => void;
  userState?: any;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, userState }) => {
  return (
    <div className="onboarding-flow">
      <h2>Welcome to Otakon!</h2>
      <p>Let's get you started...</p>
      <button onClick={onComplete}>Complete Setup</button>
    </div>
  );
};

export default OnboardingFlow;

