// src/components/Layout/DocumentItem.tsx
import React, { memo } from 'react';
import { Document } from '../../types/document';
import { AppTheme } from '../../types/settings';
import 'remixicon/fonts/remixicon.css';

interface DocumentItemProps {
    document: Document;
    isActive: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    theme: AppTheme;
    highlightText?: string;
}

// Using memo to prevent unnecessary re-renders when other documents change
const DocumentItem: React.FC<DocumentItemProps> = memo(({
                                                            document,
                                                            isActive,
                                                            onClick,
                                                            onDelete,
                                                            theme,
                                                            highlightText
                                                        }) => {
    // Get file icon based on document type and language
    const getFileIcon = (doc: Document) => {
        switch (doc.type) {
            case 'text':
                return 'ri-file-text-line';
            case 'markdown':
                return 'ri-markdown-line';
            case 'javascript':
                return 'ri-javascript-line';
            case 'python':
                return 'ri-code-line';
            case 'html':
                return 'ri-html5-line';
            default:
                return 'ri-file-line';
        }
    };

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
                    <span key={i} style={{ backgroundColor: `${theme.colors.accent}40`, padding: '0 2px', borderRadius: '2px' }}>
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
    const getDocumentTypeDisplay = (doc: Document) => {
        if (doc.type === 'code' && doc.language) {
            return doc.language;
        }
        return doc.type;
    };

    return (
        <div
            className={`p-2 rounded cursor-pointer flex items-center group transition-colors ${
                isActive ? 'bg-opacity-20 bg-gray-500' : 'hover:bg-opacity-10 hover:bg-gray-500'
            }`}
            onClick={onClick}
            style={{
                backgroundColor: isActive ?
                    theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' :
                    'transparent'
            }}
        >
            <i
                className={`mr-2 ${getFileIcon(document)}`}
                style={{
                    color: isActive ? theme.colors.accent : theme.colors.sidebarText
                }}
            />

            <div className="flex-1 min-w-0">
                <div
                    className="truncate"
                    style={{color: theme.colors.sidebarText}}
                >
                    {highlightText ? highlightMatchingText(document.title) : document.title}
                </div>
                <div className="flex text-xs" style={{color: theme.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}}>
                    <span>{getDocumentTypeDisplay(document)}</span>
                    <span className="mx-1">•</span>
                    <span>{getRelativeTime(document.updatedAt)}</span>
                </div>
            </div>

            <button
                className="opacity-0 group-hover:opacity-100 ml-1 p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
                onClick={onDelete}
                title="Delete document"
                style={{color: theme.colors.sidebarText}}
            >
                <i className="ri-delete-bin-line text-sm"></i>
            </button>
        </div>
    );
});

// Set display name for debugging
DocumentItem.displayName = 'DocumentItem';

export default DocumentItem;
