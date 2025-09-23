import React, { useState, useEffect, useRef } from 'react';
import { 
  InformationCircleIcon, 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { EnhancedButton, EnhancedCard, CardContent } from '../ui';
import { cn } from '../../utils/cn';

// ===== TOOLTIP COMPONENT =====

interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 300,
  className,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-0 border-l-0',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-b-0 border-r-0',
    left: 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2 border-l-0 border-b-0',
    right: 'right-full top-1/2 -translate-y-1/2 translate-x-1/2 border-r-0 border-t-0'
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className={cn(
          'absolute z-50 w-64 p-3 bg-[#1C1C1C] border border-[#424242] rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-200',
          positionClasses[position]
        )}>
          <div className="text-sm text-[#A3A3A3]">{content}</div>
          
          {/* Arrow */}
          <div className={cn(
            'absolute w-2 h-2 bg-[#1C1C1C] border border-[#424242] transform rotate-45',
            arrowClasses[position]
          )} />
        </div>
      )}
    </div>
  );
};

// ===== INTERACTIVE TUTORIAL =====

interface TutorialStep {
  id: string;
  title: string;
  content: React.ReactNode;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface InteractiveTutorialProps {
  steps: TutorialStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  title?: string;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  title = "Interactive Tutorial"
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isOpen) return;

    // Highlight the target element
    if (currentStepData?.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, isOpen, currentStepData?.target]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Highlight Overlay */}
      {highlightedElement && (
        <div
          className="fixed inset-0 z-45 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${highlightedElement.offsetLeft + highlightedElement.offsetWidth / 2}px ${highlightedElement.offsetTop + highlightedElement.offsetHeight / 2}px, transparent 0px, transparent 100px, rgba(0,0,0,0.8) 150px)`
          }}
        />
      )}

      {/* Tutorial Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <EnhancedCard
          variant="elevated"
          size="lg"
          className="w-full max-w-md"
        >
          <CardContent>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] rounded-full flex items-center justify-center">
                  <LightBulbIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F5F5F5]">{title}</h3>
                  <p className="text-sm text-[#A3A3A3]">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 text-[#A3A3A3] hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#2E2E2E] rounded-full h-2 mb-6">
              <div
                className="bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Step Content */}
            <div className="mb-6">
              <h4 className="text-xl font-semibold text-[#F5F5F5] mb-3">
                {currentStepData?.title}
              </h4>
              <div className="text-[#A3A3A3]">
                {currentStepData?.content}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
                  >
                    Previous
                  </EnhancedButton>
                )}
              </div>

              <div className="flex items-center gap-2">
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                >
                  Skip Tutorial
                </EnhancedButton>
                <EnhancedButton
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  rightIcon={currentStep < steps.length - 1 ? <ChevronRightIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                >
                  {currentStep < steps.length - 1 ? 'Next' : 'Complete'}
                </EnhancedButton>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>
    </>
  );
};

// ===== GUIDANCE HIGHLIGHT =====

interface GuidanceHighlightProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

const GuidanceHighlight: React.FC<GuidanceHighlightProps> = ({
  isActive,
  children,
  className
}) => {
  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        isActive && 'ring-2 ring-[#FFAB40] ring-opacity-50 rounded-lg',
        className
      )}
    >
      {children}
      {isActive && (
        <div className="absolute -inset-1 bg-gradient-to-r from-[#E53A3A]/20 to-[#FFAB40]/20 rounded-lg animate-pulse" />
      )}
    </div>
  );
};

// ===== CONTEXTUAL HELP PANEL =====

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  position?: 'left' | 'right';
}

const HelpPanel: React.FC<HelpPanelProps> = ({
  isOpen,
  onClose,
  title,
  content,
  position = 'right'
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={cn(
        'fixed top-0 z-50 w-80 h-full bg-gradient-to-b from-[#1C1C1C] to-[#0A0A0A] border-l border-[#424242]/40 shadow-2xl transform transition-transform duration-300',
        position === 'right' ? 'right-0' : 'left-0',
        isOpen ? 'translate-x-0' : position === 'right' ? 'translate-x-full' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="p-6 border-b border-[#424242]/40">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#F5F5F5]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-[#A3A3A3] hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-full">
          {content}
        </div>
      </div>
    </>
  );
};

export {
  Tooltip,
  InteractiveTutorial,
  GuidanceHighlight,
  HelpPanel
};
