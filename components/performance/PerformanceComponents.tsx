import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { 
  imageOptimization, 
  lazyLoading, 
  memoryManagement, 
  optimization 
} from '../../utils/performance';

// ===== LAZY IMAGE COMPONENT =====

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyRjJGMkYiLz48L3N2Zz4=',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (imgRef.current) {
      observerRef.current = lazyLoading.createObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      });

      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'opacity-50'
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-[#2E2E2E] animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FFAB40] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-[#2E2E2E] flex items-center justify-center">
          <span className="text-[#A3A3A3] text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
};

// ===== RESPONSIVE IMAGE COMPONENT =====

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  sizes = imageOptimization.generateSizesAttribute(),
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-[#2E2E2E] animate-pulse" />
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-[#2E2E2E] flex items-center justify-center">
          <span className="text-[#A3A3A3] text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
};

// ===== VIRTUALIZED LIST COMPONENT =====

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

const VirtualizedList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5
}: VirtualizedListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight;

  const handleScroll = useCallback(
    optimization.throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16),
    []
  );

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ===== PERFORMANCE MONITORING COMPONENT =====

interface PerformanceMonitorProps {
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const memory = memoryManagement.getMemoryUsage();
      setMetrics({
        memory,
        timestamp: new Date().toISOString(),
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  return (
    <div className={cn('p-4 bg-[#1C1C1C] border border-[#424242] rounded-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#F5F5F5]">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-2 text-[#A3A3A3] hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>

      {isVisible && (
        <div className="space-y-3">
          {metrics.memory && (
            <div>
              <h4 className="text-sm font-medium text-[#CFCFCF] mb-2">Memory Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#A3A3A3]">Used:</span>
                  <span className="text-[#F5F5F5]">
                    {(metrics.memory.used / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A3A3A3]">Total:</span>
                  <span className="text-[#F5F5F5]">
                    {(metrics.memory.total / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A3A3A3]">Limit:</span>
                  <span className="text-[#F5F5F5]">
                    {(metrics.memory.limit / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="w-full bg-[#2E2E2E] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.memory.usage}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== DEBOUNCED INPUT COMPONENT =====

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value,
  onChange,
  debounceMs = 300,
  className,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value);

  const debouncedOnChange = useCallback(
    optimization.debounce((newValue: string) => {
      onChange(newValue);
    }, debounceMs),
    [onChange, debounceMs]
  );

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    debouncedOnChange(newValue);
  };

  return (
    <input
      {...props}
      value={internalValue}
      onChange={handleChange}
      className={cn(
        'w-full px-4 py-3 bg-[#1C1C1C] border border-[#424242] text-[#F5F5F5] rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:border-[#FFAB40]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    />
  );
};

// ===== MEMOIZED COMPONENT WRAPPER =====

interface MemoizedComponentProps {
  children: React.ReactNode;
  dependencies?: any[];
  className?: string;
}

const MemoizedComponent: React.FC<MemoizedComponentProps> = ({
  children,
  dependencies = [],
  className
}) => {
  const memoizedChildren = useMemo(() => children, dependencies);

  return (
    <div className={className}>
      {memoizedChildren}
    </div>
  );
};

// ===== PERFORMANCE OPTIMIZED CARD =====

interface PerformanceCardProps {
  children: React.ReactNode;
  className?: string;
  lazy?: boolean;
  threshold?: number;
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({
  children,
  className,
  lazy = false,
  threshold = 0.1
}) => {
  const [isVisible, setIsVisible] = useState(!lazy);
  const cardRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (lazy && cardRef.current) {
      observerRef.current = lazyLoading.createObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        { threshold }
      );

      observerRef.current.observe(cardRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, threshold]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-[#1C1C1C] border border-[#424242] rounded-lg transition-all duration-300',
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4',
        className
      )}
    >
      {isVisible && children}
    </div>
  );
};

export {
  LazyImage,
  ResponsiveImage,
  VirtualizedList,
  PerformanceMonitor,
  DebouncedInput,
  MemoizedComponent,
  PerformanceCard
};
