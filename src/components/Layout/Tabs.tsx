// src/components/Layout/Tabs.tsx
import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { TabInfo } from '../../types/ui';
import { useDocuments } from '../../contexts/UseDocuments';

interface TabsProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTabId, 
  onTabClick, 
  onTabClose 
}) => {
  const { currentTheme } = useSettings();
  const { documentStates } = useDocuments();

  return (
    <div 
      className="flex border-b overflow-x-auto"
      style={{ 
        backgroundColor: currentTheme.colors.background,
        borderBottom: `1px solid ${currentTheme.colors.border}` 
      }}
    >
      {tabs.map((tab) => (
        <div 
          key={tab.id} 
          className={`
            flex items-center px-3 py-2 cursor-pointer border-r
            ${activeTabId === tab.id ? 'border-b-2 border-blue-500 -mb-px' : ''}
          `}
          style={{ 
            borderRight: `1px solid ${currentTheme.colors.border}`,
            backgroundColor: activeTabId === tab.id 
              ? currentTheme.isDark ? '#252526' : '#f8f8f8'
              : 'transparent' 
          }}
          onClick={() => onTabClick(tab.id)}
        >
          <span className="mr-2 truncate max-w-xs flex items-center">
            {tab.title}
            {tab.isDirty && !documentStates[tab.documentId!]?.isSaving && (
              <span className="ml-1 text-orange-500">•</span>
            )}
            {documentStates[tab.documentId!]?.isSaving && (
              <span className="ml-1 text-blue-500 animate-pulse">⟳</span>
            )}
          </span>
          <button
            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Tabs;
