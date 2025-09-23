import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  HandRaisedIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { useResponsive, touchTargets, touchSpacing } from '../../utils/responsive';

// ===== SWIPE GESTURE COMPONENT =====

interface SwipeGestureProps {
  children: React.ReactNode;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
}

const SwipeGesture: React.FC<SwipeGestureProps> = ({
  children,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  className
}) => {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setStartX(touch.clientX);
      setStartY(touch.clientY);
      setIsDragging(true);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    if (touch) {
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      
      setDragOffset({ x: deltaX, y: deltaY });
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const { x, y } = dragOffset;
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    
    if (absX > absY) {
      // Horizontal swipe
      if (x > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (x < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (y > threshold && onSwipeDown) {
        onSwipeDown();
      } else if (y < -threshold && onSwipeUp) {
        onSwipeUp();
      }
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative touch-none select-none',
        isDragging && 'cursor-grabbing',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translate(${dragOffset.x * 0.1}px, ${dragOffset.y * 0.1}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
      }}
    >
      {children}
    </div>
  );
};

// ===== PINCH ZOOM COMPONENT =====

interface PinchZoomProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  className?: string;
}

const PinchZoom: React.FC<PinchZoomProps> = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  className
}) => {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [lastDistance, setLastDistance] = useState(0);
  const [lastTranslate, setLastTranslate] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const getDistance = (touches: React.Touch[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0]!.clientX - touches[1]!.clientX;
    const dy = touches[0]!.clientY - touches[1]!.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches: React.Touch[]) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0]!.clientX + touches[1]!.clientX) / 2,
      y: (touches[0]!.clientY + touches[1]!.clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsZooming(true);
      setLastDistance(getDistance(Array.from(e.touches)));
      setLastTranslate(translate);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isZooming) {
      e.preventDefault();
      
      const distance = getDistance(Array.from(e.touches));
      const scaleChange = distance / lastDistance;
      const newScale = Math.min(Math.max(scale * scaleChange, minScale), maxScale);
      
      setScale(newScale);
      setLastDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    setIsZooming(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden touch-none', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
          transformOrigin: 'center center',
          transition: isZooming ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ===== HAPTIC FEEDBACK COMPONENT =====

interface HapticFeedbackProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  longPressDelay?: number;
  className?: string;
}

const HapticFeedback: React.FC<HapticFeedbackProps> = ({
  children,
  onPress,
  onLongPress,
  longPressDelay = 500,
  className
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const { isMobile } = useResponsive();

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (isMobile && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const handleTouchStart = () => {
    setIsPressed(true);
    triggerHaptic('light');
    
    if (onLongPress) {
      const timer = setTimeout(() => {
        triggerHaptic('heavy');
        onLongPress();
      }, longPressDelay);
      setLongPressTimer(timer);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (onPress) {
      triggerHaptic('medium');
      onPress();
    }
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div
      className={cn(
        'transition-transform duration-100',
        isPressed && 'scale-95',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  );
};

// ===== MOBILE NAVIGATION GESTURES =====

interface MobileNavigationGesturesProps {
  children: React.ReactNode;
  onSwipeToNavigate?: (direction: 'left' | 'right') => void;
  onSwipeToClose?: () => void;
  className?: string;
}

const MobileNavigationGestures: React.FC<MobileNavigationGesturesProps> = ({
  children,
  onSwipeToNavigate,
  onSwipeToClose,
  className
}) => {
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setStartX(touch.clientX);
      setIsDragging(true);
      setDragOffset(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    if (touch) {
      const deltaX = touch.clientX - startX;
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && onSwipeToNavigate) {
        onSwipeToNavigate('right');
      } else if (dragOffset < 0 && onSwipeToNavigate) {
        onSwipeToNavigate('left');
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div
      className={cn('relative touch-none', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${dragOffset * 0.3}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {children}
    </div>
  );
};

// ===== MOBILE SCROLL INDICATORS =====

interface MobileScrollIndicatorsProps {
  children: React.ReactNode;
  className?: string;
}

const MobileScrollIndicators: React.FC<MobileScrollIndicatorsProps> = ({
  children,
  className
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [showIndicators, setShowIndicators] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    const updateScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setScrollPosition(scrollTop);
      setMaxScroll(scrollHeight - clientHeight);
      setShowIndicators(scrollHeight > clientHeight);
    };

    container.addEventListener('scroll', updateScrollPosition);
    updateScrollPosition();

    return () => {
      container.removeEventListener('scroll', updateScrollPosition);
    };
  }, [isMobile]);

  if (!isMobile || !showIndicators) {
    return <div className={className}>{children}</div>;
  }

  const scrollProgress = maxScroll > 0 ? scrollPosition / maxScroll : 0;

  return (
    <div className={cn('relative', className)}>
      {children}
      
      {/* Top indicator */}
      {scrollPosition > 10 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-[#FFAB40] to-transparent z-10" />
      )}
      
      {/* Bottom indicator */}
      {scrollPosition < maxScroll - 10 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-[#FFAB40] to-transparent z-10" />
      )}
      
      {/* Scroll progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2E2E2E] z-10">
        <div
          className="h-full bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] transition-all duration-100"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
    </div>
  );
};

// ===== MOBILE TOUCH TARGETS =====

interface MobileTouchTargetsProps {
  children: React.ReactNode;
  minSize?: number;
  className?: string;
}

const MobileTouchTargets: React.FC<MobileTouchTargetsProps> = ({
  children,
  minSize = 44,
  className
}) => {
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        'touch-manipulation',
        className
      )}
      style={{
        minHeight: `${minSize}px`,
        minWidth: `${minSize}px`,
      }}
    >
      {children}
    </div>
  );
};

// ===== MOBILE ORIENTATION HANDLER =====

interface MobileOrientationHandlerProps {
  children: React.ReactNode;
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
  className?: string;
}

const MobileOrientationHandler: React.FC<MobileOrientationHandlerProps> = ({
  children,
  onOrientationChange,
  className
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (!isMobile) return;

    const handleOrientationChange = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation(newOrientation);
      onOrientationChange?.(newOrientation);
    };

    handleOrientationChange();
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [isMobile, onOrientationChange]);

  return (
    <div
      className={cn(
        'transition-all duration-300',
        orientation === 'landscape' && 'landscape:flex landscape:flex-row',
        className
      )}
    >
      {children}
    </div>
  );
};

export {
  SwipeGesture,
  PinchZoom,
  HapticFeedback,
  MobileNavigationGestures,
  MobileScrollIndicators,
  MobileTouchTargets,
  MobileOrientationHandler
};
