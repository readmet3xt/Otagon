/**
 * ♿ Accessibility Utilities
 * 
 * This file provides utilities for accessibility compliance,
 * WCAG AA standards, and inclusive design practices.
 */

// ===== WCAG AA COMPLIANCE =====

export const wcagAA = {
  // Color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text)
  contrast: {
    normal: 4.5,
    large: 3.0,
    enhanced: 7.0, // AAA level
  },
  
  // Touch target sizes (minimum 44x44px)
  touchTarget: {
    min: 44, // pixels
    recommended: 48, // pixels
  },
  
  // Focus indicators
  focus: {
    outline: '2px solid #FFAB40',
    outlineOffset: '2px',
    borderRadius: '4px',
  },
  
  // Animation preferences
  animation: {
    respectReducedMotion: true,
    maxDuration: 5, // seconds
  },
} as const;

// ===== COLOR CONTRAST UTILITIES =====

export const getContrastRatio = (color1: string, color2: string): number => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Get relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

export const isAccessibleContrast = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = level === 'AA' ? wcagAA.contrast.normal : wcagAA.contrast.enhanced;
  return ratio >= requiredRatio;
};

// ===== FOCUS MANAGEMENT =====

export const focusManagement = {
  // Trap focus within an element
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => element.removeEventListener('keydown', handleTabKey);
  },

  // Move focus to element
  moveFocus: (element: HTMLElement) => {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  // Get next focusable element
  getNextFocusable: (currentElement: HTMLElement): HTMLElement | null => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(currentElement);
    return focusableElements[currentIndex + 1] || focusableElements[0];
  },

  // Get previous focusable element
  getPreviousFocusable: (currentElement: HTMLElement): HTMLElement | null => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(currentElement);
    return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
  },
};

// ===== ARIA UTILITIES =====

export const aria = {
  // Generate unique ID
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Set ARIA attributes
  setAttributes: (element: HTMLElement, attributes: Record<string, string | boolean>) => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          element.setAttribute(key, 'true');
        } else {
          element.removeAttribute(key);
        }
      } else {
        element.setAttribute(key, value);
      }
    });
  },

  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Create live region
  createLiveRegion: (priority: 'polite' | 'assertive' = 'polite'): HTMLElement => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    return liveRegion;
  },
};

// ===== KEYBOARD NAVIGATION =====

export const keyboard = {
  // Common key codes
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
  },

  // Handle arrow key navigation
  handleArrowNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' | 'both' = 'vertical'
  ): number => {
    const { ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, HOME, END } = keyboard.keys;
    
    let newIndex = currentIndex;
    
    switch (event.key) {
      case ARROW_UP:
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case ARROW_DOWN:
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case ARROW_LEFT:
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case ARROW_RIGHT:
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case HOME:
        event.preventDefault();
        newIndex = 0;
        break;
      case END:
        event.preventDefault();
        newIndex = items.length - 1;
        break;
    }
    
    return newIndex;
  },

  // Handle escape key
  handleEscape: (event: KeyboardEvent, callback: () => void) => {
    if (event.key === keyboard.keys.ESCAPE) {
      event.preventDefault();
      callback();
    }
  },
};

// ===== SCREEN READER UTILITIES =====

export const screenReader = {
  // Hide element from screen readers
  hide: (element: HTMLElement) => {
    element.setAttribute('aria-hidden', 'true');
  },

  // Show element to screen readers
  show: (element: HTMLElement) => {
    element.removeAttribute('aria-hidden');
  },

  // Make element visible only to screen readers
  srOnly: (element: HTMLElement) => {
    element.className = 'sr-only';
  },

  // Create screen reader only text
  createSrOnlyText: (text: string): HTMLElement => {
    const element = document.createElement('span');
    element.className = 'sr-only';
    element.textContent = text;
    return element;
  },
};

// ===== ANIMATION PREFERENCES =====

export const animation = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get animation duration based on user preference
  getDuration: (defaultDuration: number): number => {
    return animation.prefersReducedMotion() ? 0 : defaultDuration;
  },

  // Apply reduced motion styles
  applyReducedMotion: (element: HTMLElement) => {
    if (animation.prefersReducedMotion()) {
      element.style.animationDuration = '0.01ms';
      element.style.animationIterationCount = '1';
      element.style.transitionDuration = '0.01ms';
    }
  },
};

// ===== TOUCH TARGET UTILITIES =====

export const touchTarget = {
  // Check if element meets minimum touch target size
  meetsMinimumSize: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= wcagAA.touchTarget.min && rect.height >= wcagAA.touchTarget.min;
  },

  // Ensure minimum touch target size
  ensureMinimumSize: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const minSize = wcagAA.touchTarget.min;
    
    if (rect.width < minSize || rect.height < minSize) {
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
    }
  },
};

// ===== ACCESSIBILITY TESTING =====

export const testing = {
  // Check if element has proper ARIA labels
  hasAriaLabel: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title') ||
      element.textContent?.trim()
    );
  },

  // Check if element has proper focus management
  hasFocusManagement: (element: HTMLElement): boolean => {
    return !!(element.getAttribute('tabindex') || element.tagName === 'BUTTON' || element.tagName === 'A');
  },

  // Check if element has proper color contrast
  hasAccessibleContrast: (element: HTMLElement): boolean => {
    const styles = window.getComputedStyle(element);
    const foreground = styles.color;
    const background = styles.backgroundColor;
    
    return isAccessibleContrast(foreground, background);
  },

  // Run accessibility audit on element
  auditElement: (element: HTMLElement): {
    hasAriaLabel: boolean;
    hasFocusManagement: boolean;
    hasAccessibleContrast: boolean;
    meetsTouchTarget: boolean;
    issues: string[];
  } => {
    const hasAriaLabel = testing.hasAriaLabel(element);
    const hasFocusManagement = testing.hasFocusManagement(element);
    const hasAccessibleContrast = testing.hasAccessibleContrast(element);
    const meetsTouchTarget = touchTarget.meetsMinimumSize(element);
    
    const issues: string[] = [];
    if (!hasAriaLabel) issues.push('Missing ARIA label or accessible name');
    if (!hasFocusManagement) issues.push('Missing focus management');
    if (!hasAccessibleContrast) issues.push('Insufficient color contrast');
    if (!meetsTouchTarget) issues.push('Touch target too small');
    
    return {
      hasAriaLabel,
      hasFocusManagement,
      hasAccessibleContrast,
      meetsTouchTarget,
      issues,
    };
  },
};

export default {
  wcagAA,
  getContrastRatio,
  isAccessibleContrast,
  focusManagement,
  aria,
  keyboard,
  screenReader,
  animation,
  touchTarget,
  testing,
};
