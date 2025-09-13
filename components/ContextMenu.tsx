import React, { useRef, useEffect, useState } from 'react';
import { ContextMenuItem, ContextMenuState } from '../services/types';

interface ContextMenuProps extends ContextMenuState {
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ targetRect, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [opacity, setOpacity] = useState(0); // Start hidden to prevent flicker

    useEffect(() => {
        const menu = menuRef.current;
        if (menu) {
            const { innerWidth, innerHeight } = window;
            const menuWidth = menu.offsetWidth;
            const menuHeight = menu.offsetHeight;
            const margin = 8; // Margin from the element and screen edges

            // Default position: above the target, centered horizontally
            let y = targetRect.top - menuHeight - margin;
            let x = targetRect.left + (targetRect.width / 2) - (menuWidth / 2);

            // If not enough space above, position below
            if (y < margin) {
                y = targetRect.bottom + margin;
            }
            
            // If it goes off the bottom of the screen, adjust
            if (y + menuHeight > innerHeight - margin) {
                y = innerHeight - menuHeight - margin;
            }

            // If it goes off the left of the screen, adjust
            if (x < margin) {
                x = margin;
            }

            // If it goes off the right of the screen, adjust
            if (x + menuWidth > innerWidth - margin) {
                x = innerWidth - menuWidth - margin;
            }
            
            setPosition({ x, y });
            setOpacity(1); // Make it visible
        }
    }, [targetRect]); // Re-calculate only when the target changes

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}></div>
            <div
                ref={menuRef}
                className="absolute bg-[#1C1C1C] border border-[#424242] rounded-lg shadow-2xl p-2 w-48 transition-opacity duration-150"
                style={{
                    top: position?.y ?? -9999, // Position off-screen until calculated
                    left: position?.x ?? -9999,
                    opacity: opacity,
                    // Re-use the scale-in animation from index.html
                    animation: opacity === 1 ? 'scale-in 0.1s ease-out forwards' : 'none'
                }}
            >
                <ul className="flex flex-col">
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <li key={index}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        item.action();
                                        onClose();
                                    }}
                                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                                        ${item.isDestructive
                                            ? 'text-red-400 hover:bg-red-500/10'
                                            : 'text-neutral-200 hover:bg-neutral-700/50'
                                        }
                                    `}
                                >
                                    {Icon && <Icon className="w-5 h-5" />}
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default ContextMenu;
