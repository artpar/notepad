// src/components/Layout/DocumentItem.tsx
import React, { useState } from 'react';
import { Document } from '../../types/document';
import { AppTheme } from '../../types/settings';
import { motion } from 'framer-motion';

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
    const [isHovered, setIsHovered] = useState(false);

    // Get file icon based on document type and language
    const getFileIcon = (doc: Document): string => {
        if (doc.type === 'text') return 'ri-file-text-line';
        if (doc.type === 'markdown') return 'ri-markdown-line';

        if (doc.type === 'code') {
            switch (doc.language) {
                case 'javascript': return 'ri-javascript-line';
                case 'typescript': return 'ri-code-s-slash-line';
                case 'python': return 'ri-code-line';
                case 'html': return 'ri-html5-line';
                case 'css': return 'ri-css3-line';
                default: return 'ri-file-code-line';
            }
        }

        // For javascript, python, html types directly on the document
        switch (doc.type) {
            case 'javascript': return 'ri-javascript-line';
            case 'python': return 'ri-code-line';
            case 'html': return 'ri-html5-line';
        }

        return 'ri-file-line';
    };

    // Format relative time
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

    // Highlight matching text
    const highlightMatch = (text: string, query: string): React.ReactNode => {
        if (!query || query.trim() === '') return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));

        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 text-inherit px-0.5 rounded">{part}</mark>
                : part
        );
    };

    return (
        <motion.div
            className={`p-2 rounded-md cursor-pointer group transition-all ${
                isActive ? 'bg-opacity-20 bg-blue-500' : 'hover:bg-opacity-10 hover:bg-gray-500'
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                borderLeft: isActive ? `3px solid ${theme.colors.accent}` : '3px solid transparent',
                paddingLeft: isActive ? '7px' : '10px'
            }}
        >
            <div className="flex items-center">
                <i className={`${getFileIcon(document)} mr-2 text-lg`} style={{
                    color: isActive ? theme.colors.accent : 'inherit'
                }}></i>
                <div className="overflow-hidden flex-grow">
                    <div className="font-medium truncate">
                        {highlightText
                            ? highlightMatch(document.title, highlightText)
                            : document.title
                        }
                    </div>
                    <div className="flex items-center justify-between text-xs opacity-60">
                        <span>
                            {document.type === 'code' ? document.language : document.type}
                        </span>
                        <span>{getRelativeTime(document.updatedAt)}</span>
                    </div>
                </div>

                {/* Delete button - only visible on hover or active */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: isHovered || isActive ? 1 : 0, scale: isHovered || isActive ? 1 : 0.8 }}
                    className="ml-1 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    onClick={onDelete}
                    title="Delete document"
                >
                    <i className="ri-delete-bin-line"></i>
                </motion.button>
            </div>
        </motion.div>
    );
};

export default DocumentItem;
