// src/components/Layout/DocumentItem.tsx
import React, { memo } from 'react';
import { Document } from '../../types/document';
import { useSettings } from '../../contexts/SettingsContext';
import { useDocumentActions } from '../../hooks/useDocumentActions';
import 'remixicon/fonts/remixicon.css';

interface DocumentItemProps {
  document: Document;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e) => any;
  onContextMenu?: (e: React.MouseEvent) => void;
  viewMode?: 'list' | 'grid';
  highlightText?: string;
}

// Using memo to prevent unnecessary re-renders when other documents change
const DocumentItem: React.FC<DocumentItemProps> = memo(({
  document,
  isActive,
  onClick,
  onDelete,
  onContextMenu,
  viewMode = 'list',
  highlightText
}) => {
  const { currentTheme } = useSettings();
  const { getDocumentIcon } = useDocumentActions();

  // Format relative time (e.g., "2h ago")
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;

    return new Date(date).toLocaleDateString();
  };

  // Highlight matching text if highlightText is provided
  const highlightMatchingText = (text: string) => {
    if (!highlightText || !text) return text;

    try {
      const regex = new RegExp(`(${highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            style={{
              backgroundColor: `${currentTheme.colors.accent}40`,
              padding: '0 2px',
              borderRadius: '2px'
            }}
          >
            {part}
          </span>
        ) : (
          part
        )
      );
    } catch (e) {
      // If regex fails, just return the original text
      return text;
    }
  };

  // Get document type display text
  const getDocumentTypeDisplay = (doc: Document): string => {
    if (doc.type === 'code' && doc.language) {
      return doc.language;
    }
    return doc.type.type;
  };

  if (viewMode === 'grid') {
    return (
      <div
        className={`p-3 rounded-lg border h-full flex flex-col cursor-pointer transition-shadow hover:shadow-md ${
          isActive ? 'border-blue-400 dark:border-blue-600' : 'border-gray-200 dark:border-gray-600'
        }`}
        onClick={onClick}
        onContextMenu={onContextMenu}
        style={{
          backgroundColor: isActive ?
            (currentTheme.isDark ? 'rgba(66, 153, 225, 0.1)' : 'rgba(66, 153, 225, 0.05)') :
            (currentTheme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)')
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <div
            className="rounded-full p-2"
            style={{
              backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }}
          >
            <i
              className={getDocumentIcon(document.type, document.language)}
              style={{color: currentTheme.colors.accent}}
            />
          </div>
        </div>

        <h4
          className="font-medium truncate"
          style={{color: isActive ? currentTheme.colors.accent : currentTheme.colors.sidebarText}}
        >
          {highlightText ? highlightMatchingText(document.title) : document.title}
        </h4>

        <div
          className="mt-1 text-xs flex items-center"
          style={{color: currentTheme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}}
        >
          <span>{getDocumentTypeDisplay(document)}</span>
          <span className="mx-1">•</span>
          <span>{getRelativeTime(document.updatedAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-2 rounded cursor-pointer flex items-center group transition-colors ${
        isActive ? 'bg-opacity-20 bg-gray-500' : 'hover:bg-opacity-10 hover:bg-gray-500'
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        backgroundColor: isActive ?
          currentTheme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' :
          'transparent'
      }}
    >
      <i
        className={`mr-2 ${getDocumentIcon(document.type, document.language)}`}
        style={{
          color: isActive ? currentTheme.colors.accent : currentTheme.colors.sidebarText
        }}
      />

      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{color: currentTheme.colors.sidebarText}}
        >
          {highlightText ? highlightMatchingText(document.title) : document.title}
        </div>
        <div
          className="flex text-xs"
          style={{color: currentTheme.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}}
        >
          <span>{getDocumentTypeDisplay(document)}</span>
          <span className="mx-1">•</span>
          <span>{getRelativeTime(document.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
DocumentItem.displayName = 'DocumentItem';

export default DocumentItem;
