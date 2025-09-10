/**
 * 📱 Responsive Design Utilities
 * 
 * This file provides utilities for responsive design, breakpoint management,
 * and mobile-first approach implementation.
 */

import { breakpoints } from './designTokens';

// ===== BREAKPOINT UTILITIES =====

export const breakpointValues = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpointValues;

// ===== MEDIA QUERY HOOKS =====

export const mediaQueries = {
  xs: `(min-width: ${breakpointValues.xs}px)`,
  sm: `(min-width: ${breakpointValues.sm}px)`,
  md: `(min-width: ${breakpointValues.md}px)`,
  lg: `(min-width: ${breakpointValues.lg}px)`,
  xl: `(min-width: ${breakpointValues.xl}px)`,
  '2xl': `(min-width: ${breakpointValues['2xl']}px)`,
  
  // Max-width queries
  xsMax: `(max-width: ${breakpointValues.xs - 1}px)`,
  smMax: `(max-width: ${breakpointValues.sm - 1}px)`,
  mdMax: `(max-width: ${breakpointValues.md - 1}px)`,
  lgMax: `(max-width: ${breakpointValues.lg - 1}px)`,
  xlMax: `(max-width: ${breakpointValues.xl - 1}px)`,
  '2xlMax': `(max-width: ${breakpointValues['2xl'] - 1}px)`,
  
  // Range queries
  xsToSm: `(min-width: ${breakpointValues.xs}px) and (max-width: ${breakpointValues.sm - 1}px)`,
  smToMd: `(min-width: ${breakpointValues.sm}px) and (max-width: ${breakpointValues.md - 1}px)`,
  mdToLg: `(min-width: ${breakpointValues.md}px) and (max-width: ${breakpointValues.lg - 1}px)`,
  lgToXl: `(min-width: ${breakpointValues.lg}px) and (max-width: ${breakpointValues.xl - 1}px)`,
  xlTo2xl: `(min-width: ${breakpointValues.xl}px) and (max-width: ${breakpointValues['2xl'] - 1}px)`,
} as const;

// ===== RESPONSIVE UTILITIES =====

export const getResponsiveValue = <T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  const sortedBreakpoints = Object.entries(breakpointValues)
    .sort(([, a], [, b]) => a - b) as [Breakpoint, number][];
  
  for (let i = sortedBreakpoints.length - 1; i >= 0; i--) {
    const [breakpoint, minWidth] = sortedBreakpoints[i];
    if (window.innerWidth >= minWidth && values[breakpoint] !== undefined) {
      return values[breakpoint] as T;
    }
  }
  
  return defaultValue;
};

export const getResponsiveSpacing = (
  values: Partial<Record<Breakpoint, number>>
): string => {
  const spacing = getResponsiveValue(values, 0);
  return `${spacing * 0.25}rem`; // Convert to rem (assuming 4px base)
};

export const getResponsiveFontSize = (
  values: Partial<Record<Breakpoint, number>>
): string => {
  const fontSize = getResponsiveValue(values, 16);
  return `${fontSize}px`;
};

// ===== CONTAINER UTILITIES =====

export const containerSizes = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
} as const;

export const getResponsiveContainer = (
  values: Partial<Record<Breakpoint, keyof typeof containerSizes>>
): string => {
  const container = getResponsiveValue(values, 'full');
  return containerSizes[container];
};

// ===== GRID UTILITIES =====

export const gridColumns = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
} as const;

export const getResponsiveGrid = (
  values: Partial<Record<Breakpoint, keyof typeof gridColumns>>
): string => {
  const columns = getResponsiveValue(values, 1);
  return gridColumns[columns];
};

// ===== FLEX UTILITIES =====

export const flexDirections = {
  row: 'flex-row',
  col: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse',
} as const;

export const flexWraps = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
} as const;

export const justifyContent = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
} as const;

export const alignItems = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
} as const;

// ===== RESPONSIVE CLASSES =====

export const responsiveClasses = {
  // Display
  hidden: {
    xs: 'xs:hidden',
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
    xl: 'xl:hidden',
    '2xl': '2xl:hidden',
  },
  block: {
    xs: 'xs:block',
    sm: 'sm:block',
    md: 'md:block',
    lg: 'lg:block',
    xl: 'xl:block',
    '2xl': '2xl:block',
  },
  flex: {
    xs: 'xs:flex',
    sm: 'sm:flex',
    md: 'md:flex',
    lg: 'lg:flex',
    xl: 'xl:flex',
    '2xl': '2xl:flex',
  },
  
  // Text
  textSize: {
    xs: 'xs:text-xs',
    sm: 'sm:text-sm',
    md: 'md:text-base',
    lg: 'lg:text-lg',
    xl: 'xl:text-xl',
    '2xl': '2xl:text-2xl',
  },
  
  // Spacing
  padding: {
    xs: 'xs:p-2',
    sm: 'sm:p-4',
    md: 'md:p-6',
    lg: 'lg:p-8',
    xl: 'xl:p-10',
    '2xl': '2xl:p-12',
  },
  margin: {
    xs: 'xs:m-2',
    sm: 'sm:m-4',
    md: 'md:m-6',
    lg: 'lg:m-8',
    xl: 'xl:m-10',
    '2xl': '2xl:m-12',
  },
} as const;

// ===== MOBILE-FIRST UTILITIES =====

export const mobileFirst = {
  // Hide on mobile, show on larger screens
  hideOnMobile: 'hidden sm:block',
  showOnMobile: 'block sm:hidden',
  
  // Text sizes
  textXs: 'text-xs sm:text-sm',
  textSm: 'text-sm sm:text-base',
  textBase: 'text-base sm:text-lg',
  textLg: 'text-lg sm:text-xl',
  textXl: 'text-xl sm:text-2xl',
  
  // Spacing
  pXs: 'p-2 sm:p-4',
  pSm: 'p-4 sm:p-6',
  pMd: 'p-6 sm:p-8',
  pLg: 'p-8 sm:p-10',
  
  // Grid
  grid1: 'grid-cols-1 sm:grid-cols-2',
  grid2: 'grid-cols-2 sm:grid-cols-3',
  grid3: 'grid-cols-3 sm:grid-cols-4',
  
  // Flex
  flexCol: 'flex-col sm:flex-row',
  flexRow: 'flex-row sm:flex-col',
} as const;

// ===== TOUCH UTILITIES =====

export const touchTargets = {
  // Minimum touch target size (44px)
  min: 'min-h-[44px] min-w-[44px]',
  
  // Recommended touch target sizes
  sm: 'h-10 w-10', // 40px
  md: 'h-11 w-11', // 44px
  lg: 'h-12 w-12', // 48px
  xl: 'h-14 w-14', // 56px
} as const;

export const touchSpacing = {
  // Minimum spacing between touch targets (8px)
  min: 'gap-2',
  
  // Recommended spacing
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
} as const;

// ===== RESPONSIVE HOOKS =====

export const useResponsive = () => {
  if (typeof window === 'undefined') {
    return {
      isXs: false,
      isSm: false,
      isMd: false,
      isLg: false,
      isXl: false,
      is2xl: false,
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      currentBreakpoint: 'xs' as Breakpoint,
    };
  }

  const width = window.innerWidth;
  
  return {
    isXs: width >= breakpointValues.xs,
    isSm: width >= breakpointValues.sm,
    isMd: width >= breakpointValues.md,
    isLg: width >= breakpointValues.lg,
    isXl: width >= breakpointValues.xl,
    is2xl: width >= breakpointValues['2xl'],
    isMobile: width < breakpointValues.md,
    isTablet: width >= breakpointValues.md && width < breakpointValues.lg,
    isDesktop: width >= breakpointValues.lg,
    currentBreakpoint: Object.entries(breakpointValues)
      .reverse()
      .find(([, value]) => width >= value)?.[0] as Breakpoint || 'xs',
  };
};

// ===== RESPONSIVE COMPONENT UTILITIES =====

export const getResponsiveProps = <T extends Record<string, any>>(
  props: T,
  breakpoint: Breakpoint
): Partial<T> => {
  const responsiveProps: Partial<T> = {};
  
  Object.entries(props).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const responsiveValue = value[breakpoint];
      if (responsiveValue !== undefined) {
        responsiveProps[key as keyof T] = responsiveValue;
      }
    }
  });
  
  return responsiveProps;
};

export default {
  breakpointValues,
  mediaQueries,
  getResponsiveValue,
  getResponsiveSpacing,
  getResponsiveFontSize,
  getResponsiveContainer,
  getResponsiveGrid,
  responsiveClasses,
  mobileFirst,
  touchTargets,
  touchSpacing,
  useResponsive,
  getResponsiveProps,
};
