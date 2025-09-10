import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  XMarkIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { useResponsive, touchTargets, touchSpacing } from '../../utils/responsive';

// ===== MOBILE TAB BAR =====

interface MobileTabBarProps {
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className
}) => {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1C] border-t border-[#424242]/40',
      'safe-area-inset-bottom',
      className
    )}>
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50',
              activeTab === tab.id
                ? 'text-[#FFAB40] bg-[#FFAB40]/10'
                : 'text-[#A3A3A3] hover:text-[#CFCFCF] hover:bg-[#2E2E2E]/50',
              touchTargets.md
            )}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E53A3A] text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ===== MOBILE SEARCH BAR =====

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

const MobileSearchBar: React.FC<MobileSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onFocus,
  onBlur,
  className
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { isMobile } = useResponsive();

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className={cn(
      'relative',
      isMobile && 'w-full',
      className
    )}>
      <div className={cn(
        'relative flex items-center bg-[#2E2E2E] rounded-lg transition-all duration-200',
        isFocused && 'bg-[#424242] ring-2 ring-[#FFAB40]/50'
      )}>
        <MagnifyingGlassIcon className="w-5 h-5 text-[#A3A3A3] ml-3" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'flex-1 px-3 py-3 bg-transparent text-[#F5F5F5] placeholder-[#A3A3A3]',
            'focus:outline-none',
            isMobile && 'text-base' // Prevent zoom on iOS
          )}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-2 text-[#A3A3A3] hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ===== MOBILE CAROUSEL =====

interface MobileCarouselProps {
  items: React.ReactNode[];
  className?: string;
  showIndicators?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const MobileCarousel: React.FC<MobileCarouselProps> = ({
  items,
  className,
  showIndicators = true,
  showArrows = false,
  autoPlay = false,
  autoPlayInterval = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - startX;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 50;
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  useEffect(() => {
    if (autoPlay) {
      autoPlayRef.current = setInterval(goToNext, autoPlayInterval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {item}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === currentIndex
                  ? 'bg-[#FFAB40] scale-125'
                  : 'bg-white/50 hover:bg-white/70'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ===== MOBILE ACCORDION =====

interface MobileAccordionProps {
  items: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    isOpen?: boolean;
  }>;
  allowMultiple?: boolean;
  className?: string;
}

const MobileAccordion: React.FC<MobileAccordionProps> = ({
  items,
  allowMultiple = false,
  className
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter(item => item.isOpen).map(item => item.id))
  );

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      
      return newSet;
    });
  };

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => (
        <div key={item.id} className="bg-[#1C1C1C] border border-[#424242]/40 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(item.id)}
            className={cn(
              'w-full px-4 py-3 text-left flex items-center justify-between',
              'hover:bg-[#2E2E2E]/50 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50',
              touchTargets.md
            )}
          >
            <span className="text-[#F5F5F5] font-medium">{item.title}</span>
            <div className={cn(
              'transform transition-transform duration-200',
              openItems.has(item.id) && 'rotate-180'
            )}>
              <ChevronDownIcon className="w-5 h-5 text-[#A3A3A3]" />
            </div>
          </button>
          
          {openItems.has(item.id) && (
            <div className="px-4 pb-3 border-t border-[#424242]/40">
              <div className="pt-3 text-[#A3A3A3]">
                {item.content}
              </div>
            </div>
          )}
        </div>
      ))}
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
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 transform -translate-x-1/2',
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
        'fixed z-50 bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] text-white rounded-full shadow-2xl',
        'hover:shadow-glow transition-all duration-200 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:ring-offset-2',
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();

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

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

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

export {
  MobileTabBar,
  MobileSearchBar,
  MobileCarousel,
  MobileAccordion,
  MobileFAB,
  MobilePullToRefresh
};
