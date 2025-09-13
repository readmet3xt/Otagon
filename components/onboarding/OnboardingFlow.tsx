import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { EnhancedButton, EnhancedCard, CardContent, ProgressBar } from '../ui';
import { cn } from '../../utils/cn';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  isCompleted?: boolean;
  isOptional?: boolean;
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  showProgress?: boolean;
  allowSkip?: boolean;
  className?: string;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  steps,
  onComplete,
  onSkip,
  showProgress = true,
  allowSkip = true,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const isStepCompleted = (stepId: string) => completedSteps.has(stepId);

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Progress Header */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#F5F5F5]">
              Welcome to Otagon
            </h2>
            <span className="text-sm text-[#A3A3A3]">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <ProgressBar
            value={progress}
            size="lg"
            color="primary"
            showLabel={false}
          />
        </div>
      )}

      {/* Step Content */}
      <EnhancedCard
        variant="elevated"
        size="lg"
        className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px]"
      >
        <CardContent>
          <div className={cn(
            'transition-all duration-300 ease-out',
            isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
          )}>
            {/* Step Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  isStepCompleted(currentStepData.id)
                    ? 'bg-green-500 text-white'
                    : 'bg-[#E53A3A] text-white'
                )}>
                  {isStepCompleted(currentStepData.id) ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    currentStep + 1
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#F5F5F5]">
                    {currentStepData.title}
                  </h3>
                  {currentStepData.isOptional && (
                    <span className="text-xs text-[#FFAB40] bg-[#FFAB40]/10 px-2 py-1 rounded-full">
                      Optional
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[#A3A3A3] text-lg">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              {currentStepData.content}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-[#424242]/40">
              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <EnhancedButton
                    variant="outline"
                    size="md"
                    onClick={handlePrevious}
                    leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
                  >
                    Previous
                  </EnhancedButton>
                )}
              </div>

              <div className="flex items-center gap-3">
                {allowSkip && currentStepData.isOptional && (
                  <EnhancedButton
                    variant="ghost"
                    size="md"
                    onClick={handleSkip}
                  >
                    Skip
                  </EnhancedButton>
                )}
                
                <EnhancedButton
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  rightIcon={currentStep < steps.length - 1 ? <ArrowRightIcon className="w-4 h-4" /> : undefined}
                >
                  {currentStep < steps.length - 1 ? 'Next' : 'Complete'}
                </EnhancedButton>
              </div>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-200',
              index === currentStep
                ? 'bg-[#E53A3A] scale-125'
                : index < currentStep
                ? 'bg-green-500'
                : 'bg-[#424242] hover:bg-[#525252]'
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default OnboardingFlow;
