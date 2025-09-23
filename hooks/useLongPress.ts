
import { useCallback, useRef } from 'react';

const LONG_PRESS_DURATION = 750; // Reduced for better responsiveness

export const useLongPress = () => {
    const timeout = useRef<number | undefined>(undefined);
    const pressCoordinates = useRef<{ x: number, y: number } | null>(null);

    const start = useCallback((event: React.MouseEvent | React.TouchEvent, callback: (e: React.MouseEvent | React.TouchEvent) => void) => {
        if ('button' in event && event.button === 2) return;
        
        const coords = 'touches' in event ? 
            { x: event.touches[0]?.clientX || 0, y: event.touches[0]?.clientY || 0 } : 
            { x: event.clientX || 0, y: event.clientY || 0 };
        pressCoordinates.current = coords;
        
        // Capture the target immediately to avoid stale references in the timeout.
        const target = event.currentTarget as HTMLElement;

        timeout.current = window.setTimeout(() => {
            // Create a custom event-like object that only contains what the callback needs.
            const customEvent = {
                currentTarget: target,
                preventDefault: () => event.preventDefault(),
                stopPropagation: () => event.stopPropagation(),
            };

            if('touches' in event) {
                event.preventDefault();
            }
            callback(customEvent as any);
            pressCoordinates.current = null;
        }, LONG_PRESS_DURATION);
    }, []);

    const clear = useCallback(() => {
        if (timeout.current != null) {
            clearTimeout(timeout.current);
        }
        pressCoordinates.current = null;
    }, []);

    const move = useCallback((event: React.MouseEvent | React.TouchEvent) => {
        if (!pressCoordinates.current) return;
        
        const coords = 'touches' in event ? 
            { x: event.touches[0]?.clientX || 0, y: event.touches[0]?.clientY || 0 } : 
            { x: event.clientX || 0, y: event.clientY || 0 };
        
        const deltaX = Math.abs(coords.x - pressCoordinates.current.x);
        const deltaY = Math.abs(coords.y - pressCoordinates.current.y);
        
        if (deltaX > 10 || deltaY > 10) {
            clear();
        }
    }, [clear]);

    return useCallback(
        (callback: (event: React.MouseEvent | React.TouchEvent) => void) => {
            if (typeof callback !== 'function') {
                return {};
            }
            return {
                onMouseDown: (e: React.MouseEvent) => start(e, callback),
                onTouchStart: (e: React.TouchEvent) => start(e, callback),
                onMouseMove: (e: React.MouseEvent) => move(e),
                onTouchMove: (e: React.TouchEvent) => move(e),
                onMouseUp: () => clear(),
                onMouseLeave: () => clear(),
                onTouchEnd: () => clear(),
                onContextMenu: (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clear(); // Prevent long press from firing if context menu opens
                    callback(e);
                }
            };
        },
        [start, clear, move]
    );
};
