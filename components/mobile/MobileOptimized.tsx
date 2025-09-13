import React, { useState, useEffect, useRef } from 'react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { useResponsive, touchTargets, touchSpacing } from '../../utils/responsive';

// ===== MOBILE NAVIGATION DRAWER =====

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left',
  size = 'md',
  className
}) => {
  const { isMobile } = useResponsive();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const positionClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  };

  const sizeClasses = {
    sm: position === 'left' || position === 'right' ? 'w-64' : 'h-64',
    md: position === 'left' || position === 'right' ? 'w-80' : 'h-80',
    lg: position === 'left' || position === 'right' ? 'w-96' : 'h-96',
    full: position === 'left' || position === 'right' ? 'w-full' : 'h-full',
  };

  const transformClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
    top: isOpen ? 'translate-y-0' : '-translate-y-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full',
  };

  if (!isMobile) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed z-50 bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-[#424242]/40 shadow-2xl transition-transform duration-300 ease-out',
          positionClasses[position],
          sizeClasses[size],
          transformClasses[position],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#424242]/40">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Menu</h2>
          <button
            onClick={handleClose}
            className={cn(
              'p-2 text-[#A3A3A3] hover:text-white transition-colors rounded-lg hover:bg-white/10',
              touchTargets.md
            )}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
};

// ===== MOBILE BOTTOM SHEET =====

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className
}) => {
  const { isMobile } = useResponsive();
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragY;
    
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.changedTouches[0].clientY;
    const deltaY = currentY - dragY;
    
    if (deltaY > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    
    setIsDragging(false);
    setDragY(0);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isMobile) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border-t border-[#424242]/40 shadow-2xl rounded-t-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-[#424242] rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-6 pb-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};

// ===== MOBILE SWIPEABLE CARD =====

interface MobileSwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

const MobileSwipeableCard: React.FC<MobileSwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 100,
  className
}) => {
  const { isMobile } = useResponsive();
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging || !isMobile) return;
    
    const { x, y } = dragOffset;
    
    if (Math.abs(x) > Math.abs(y)) {
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
      className={cn(
        'relative transition-transform duration-200 ease-out',
        isDragging && 'scale-105',
        className
      )}
      style={{
        transform: `translate(${dragOffset.x * 0.1}px, ${dragOffset.y * 0.1}px)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// ===== MOBILE PULL TO REFRESH =====

interface MobilePullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

const MobilePullToRefresh: React.FC<MobilePullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  className
}) => {
  const { isMobile } = useResponsive();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || isRefreshing) return;
    
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || !isMobile || isRefreshing) return;
    
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      const deltaY = e.touches[0].clientY - e.touches[0].clientY;
      const distance = Math.max(0, deltaY);
      
      setPullDistance(distance);
      
      if (distance > threshold) {
        // Visual feedback for pull to refresh
        container.style.transform = `translateY(${distance * 0.5}px)`;
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || !isMobile || isRefreshing) return;
    
    const container = containerRef.current;
    if (container && pullDistance > threshold) {
      setIsRefreshing(true);
      container.style.transform = 'translateY(0)';
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else if (container) {
      container.style.transform = 'translateY(0)';
    }
    
    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative transition-transform duration-200 ease-out',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="absolute top-0 left-0 right-0 flex justify-center items-center h-16 bg-gradient-to-b from-[#1C1C1C] to-transparent">
          <div className={cn(
            'w-8 h-8 border-2 border-[#FFAB40] border-t-transparent rounded-full animate-spin',
            pullDistance > threshold && 'border-[#E53A3A]'
          )} />
        </div>
      )}
      
      {children}
    </div>
  );
};

// ===== MOBILE FLOATING ACTION BUTTON =====

interface MobileFABProps {
  onClick: () => void;
  icon: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MobileFAB: React.FC<MobileFABProps> = ({
  onClick,
  icon,
  position = 'bottom-right',
  size = 'md',
  className
}) => {
  const { isMobile } = useResponsive();

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  if (!isMobile) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-50 bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] text-white rounded-full shadow-2xl hover:shadow-glow transition-all duration-200 active:scale-95',
        positionClasses[position],
        sizeClasses[size],
        touchTargets.lg,
        className
      )}
    >
      {icon}
    </button>
  );
};

export {
  MobileDrawer,
  MobileBottomSheet,
  MobileSwipeableCard,
  MobilePullToRefresh,
  MobileFAB
};
