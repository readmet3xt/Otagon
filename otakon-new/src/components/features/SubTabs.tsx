// src/components/features/SubTabs.tsx

import React from 'react';
import { SubTab } from '../../types';

interface SubTabsProps {
  subtabs: SubTab[];
  activeSubTabId: string;
  onSelectSubTab: (id: string) => void;
}

export const SubTabs: React.FC<SubTabsProps> = ({ subtabs, activeSubTabId, onSelectSubTab }) => {
  return (
    <div className="flex space-x-2 border-b border-gray-700 px-4">
      {subtabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelectSubTab(tab.id)}
          className={`py-3 px-2 text-sm font-medium border-b-2
            ${activeSubTabId === tab.id
              ? 'border-red-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
            }
          `}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );
};
