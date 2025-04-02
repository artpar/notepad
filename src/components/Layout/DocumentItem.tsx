// src/components/Layout/DocumentItem.tsx
import React from 'react';
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

const DocumentItem: React.FC<DocumentItemProps> = ({
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

    // Get document type display text
    const getDocumentTypeDisplay = (doc: Document) => {
        if (doc.type === 'code' && doc.language) {
            return doc.language;
        }
        return doc.type;
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

            <span
                className="truncate flex-1"
                style={{color: theme.colors.sidebarText}}
            >
        {highlightText ? highlightMatchingText(document.title) : document.title}
      </span>

            <span
                className="text-xs ml-1"
                style={{color: theme.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}}
            >
        {getDocumentTypeDisplay(document)}
      </span>

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
};

export default DocumentItem;
