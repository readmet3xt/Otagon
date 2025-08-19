import React, { useRef, useState, useEffect } from 'react';
import { Conversation, UserTier } from '../services/types';
import { useLongPress } from '../hooks/useLongPress';

interface SubTabsProps {
    activeConversation: Conversation | null;
    activeSubView: string;
    onTabClick: (tabId: string) => void;
    userTier: string;
    onReorder: (conversationId: string, fromIndex: number, toIndex: number) => void;
    onContextMenu: (e: React.MouseEvent, tabId: string, insightTitle: string) => void;
}

const SubTabs: React.FC<SubTabsProps> = ({ 
    activeConversation, 
    activeSubView, 
    onTabClick, 
    userTier, 
    onReorder, 
    onContextMenu
}) => {
    const draggedItem = useRef<number | null>(null);
    const [dragOverItem, setDragOverItem] = useState<number | null>(null);
    const longPressEvents = useLongPress();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            container.scrollTo({
                left: container.scrollLeft + e.deltaY,
                behavior: 'smooth'
            });
        };

        container.addEventListener('wheel', handleWheel);
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    if (userTier === 'free' || !activeConversation?.insights || activeConversation.id === 'everything-else') {
        return null;
    }

    const orderedInsights = (activeConversation.insightsOrder || Object.keys(activeConversation.insights))
        .map(id => activeConversation.insights?.[id])
        .filter((i): i is NonNullable<typeof i> => !!i);

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
        draggedItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (index: number) => {
        setDragOverItem(index);
    };

    const handleDragEnd = () => {
        if (draggedItem.current !== null && dragOverItem !== null && draggedItem.current !== dragOverItem) {
            onReorder(activeConversation.id, draggedItem.current, dragOverItem);
        }
        draggedItem.current = null;
        setDragOverItem(null);
    };

    const tabs = [
        { id: 'chat', title: 'Chat', isNew: false, status: 'loaded' },
        ...orderedInsights
    ];

    return (
        <div className="w-full max-w-5xl mx-auto px-4 pt-4 flex-shrink-0">
             <div 
                ref={containerRef}
                className="flex items-center gap-3 pb-3 overflow-x-auto scroll-smooth"
                onDragLeave={() => setDragOverItem(null)}
            >
                {tabs.map((tab, index) => {
                    const isActive = activeSubView === tab.id;
                    const isLoading = tab.status === 'loading';
                    const isChatTab = tab.id === 'chat';
                    const isPlaceholder = (tab as any).isPlaceholder;
                    const hasError = tab.status === 'error';

                    return (
                        <button
                            key={tab.id}
                            draggable={!isChatTab}
                            onDragStart={(e) => handleDragStart(e, index - 1)} // Adjust index for chat tab
                            onDragEnter={() => handleDragEnter(index - 1)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            {...longPressEvents(isChatTab ? () => {} : (e: any) => onContextMenu(e, tab.id, tab.title))}
                            onClick={() => onTabClick(tab.id)}
                            disabled={isLoading}
                            className={`select-none relative flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border-2 flex items-center active:scale-95 shadow-lg
                                ${isActive
                                    ? 'bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border-[#E53A3A]/60 text-[#F5F5F5] shadow-[0_0_20px_rgba(229,61,61,0.3)] hover:shadow-[0_0_30px_rgba(229,61,61,0.5)]'
                                    : isLoading
                                    ? 'bg-gradient-to-r from-[#2E2E2E]/50 to-[#1C1C1C]/50 border-transparent text-[#A3A3A3] animate-pulse cursor-not-allowed'
                                    : hasError
                                    ? 'bg-gradient-to-r from-[#FF4D4D]/20 to-[#FF6B6B]/20 border-[#FF4D4D]/60 text-[#FF8080] hover:from-[#FF4D4D]/30 hover:to-[#FF6B6B]/30 hover:scale-105'
                                    : isPlaceholder
                                    ? 'bg-gradient-to-r from-[#FFAB40]/20 to-[#FFC107]/20 border-[#FFAB40]/60 text-[#FFCC80] hover:from-[#FFAB40]/30 hover:to-[#FFC107]/30 hover:scale-105'
                                    : 'bg-gradient-to-r from-[#2E2E2E]/80 to-[#1C1C1C]/80 border-[#424242]/60 text-[#CFCFCF] hover:from-[#424242]/80 hover:to-[#2E2E2E]/80 hover:border-[#5A5A5A] hover:scale-105 hover:shadow-xl'
                                }
                                ${dragOverItem === index -1 ? 'border-[#FFAB40] scale-110 shadow-[0_0_30px_rgba(251,191,36,0.5)]' : ''}
                            `}
                        >
                            <span className="whitespace-nowrap">{tab.title}</span>
                            {tab.isNew && !isActive && (
                                <span className="absolute -top-1 -right-1 block w-3 h-3 bg-gradient-to-r from-[#FF4D4D] to-[#FF6B6B] rounded-full ring-2 ring-black shadow-lg" aria-label="New content"></span>
                            )}
                            {isPlaceholder && (
                                <span className="ml-2 text-xs opacity-80">✨</span>
                            )}
                            {hasError && (
                                <span className="ml-2 text-xs opacity-80">⚠️</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(SubTabs);