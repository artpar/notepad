// src/components/Properties/PropertiesPanel.tsx
import React, { useEffect, useState, useRef } from 'react';
import { IDockviewPanelProps } from 'dockview';
import { Document } from '../../types/document';
import { useSettings } from '../../contexts/SettingsContext';
import 'remixicon/fonts/remixicon.css';

interface PropertiesPanelProps {
    document: Document | null;
    onUpdateTitle: (title: string) => void;
}

const PropertiesPanel: React.FC<IDockviewPanelProps<PropertiesPanelProps>> = (props) => {
    const { params } = props;
    const { document, onUpdateTitle } = params;
    const { currentTheme } = useSettings();

    const [editingTitle, setEditingTitle] = useState('');
    const [isTitleFocused, setIsTitleFocused] = useState(false);
    const [tagsInput, setTagsInput] = useState('');
    const [isTagsEditing, setIsTagsEditing] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Update local state when document changes
    useEffect(() => {
        if (document) {
            setEditingTitle(document.title);
            setTagsInput(document.tags?.join(', ') || '');
        }
    }, [document?.id, document?.title, document?.tags]);

    // Handle title click to edit
    const handleTitleClick = () => {
        if (document) {
            setIsTitleFocused(true);
            // Focus the input after state update
            setTimeout(() => {
                if (titleInputRef.current) {
                    titleInputRef.current.focus();
                    titleInputRef.current.select();
                }
            }, 0);
        }
    };

    // Handle title input change
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditingTitle(e.target.value);
    };

    // Handle title update when user finishes editing
    const handleTitleBlur = () => {
        if (document && editingTitle.trim() !== '') {
            onUpdateTitle(editingTitle);
        } else if (document) {
            // Reset to original if empty
            setEditingTitle(document.title);
        }
        setIsTitleFocused(false);
    };

    // Handle key press in title input
    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (document && editingTitle.trim() !== '') {
                onUpdateTitle(editingTitle);
            }
            setIsTitleFocused(false);
        } else if (e.key === 'Escape') {
            // Reset to original title and exit editing mode
            if (document) {
                setEditingTitle(document.title);
            }
            setIsTitleFocused(false);
        }
    };

    // Handle tags input
    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagsInput(e.target.value);
    };

    // Handle tags editing
    const toggleTagsEditing = () => {
        setIsTagsEditing(!isTagsEditing);
        // Focus the tags input after opening it
        if (!isTagsEditing && document) {
            setTimeout(() => {
                const tagsInput = document.querySelector('#tags-input') as HTMLInputElement;
                if (tagsInput) {
                    tagsInput.focus();
                }
            }, 0);
        }
    };

    // Get file icon based on document type
    const getFileIcon = (doc: Document) => {
        if (doc.type === 'text') return 'ri-file-text-line';
        if (doc.type === 'markdown') return 'ri-markdown-line';

        // Code files
        switch (doc.language) {
            case 'javascript': return 'ri-javascript-line';
            case 'typescript': return 'ri-code-s-slash-line';
            case 'python': return 'ri-code-line';
            case 'html': return 'ri-html5-line';
            case 'css': return 'ri-css3-line';
            default: return 'ri-file-code-line';
        }
    };

    // Format date for display
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get word count from document content
    const getWordCount = (content: string) => {
        return content.trim().split(/\s+/).filter(Boolean).length;
    };

    // Get character count from document content
    const getCharCount = (content: string) => {
        return content.length;
    };

    if (!document) {
        return (
            <div
                className="flex flex-col items-center justify-center h-full p-4 text-center"
                style={{ color: currentTheme.colors.foreground }}
            >
                <i className="ri-file-info-line text-4xl mb-3 opacity-50"></i>
                <p className="text-base font-medium mb-1">No document selected</p>
                <p className="text-sm opacity-60">Select a document to view its properties</p>
            </div>
        );
    }

    return (
        <div className="overflow-auto p-3" style={{ backgroundColor: currentTheme.colors.sidebar }}>
            {/* Document title with inline editing */}
            <div className="mb-3">
                <div className="flex items-center mb-1">
                    <i className={`${getFileIcon(document)} mr-2 text-lg`} style={{ color: currentTheme.colors.accent }}></i>
                    {isTitleFocused ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={handleTitleChange}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            className="w-full py-1 px-2 rounded border text-base font-medium"
                            style={{
                                backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                borderColor: currentTheme.colors.border,
                                color: currentTheme.colors.foreground
                            }}
                            autoFocus
                        />
                    ) : (
                        <div
                            className="w-full py-1 px-2 rounded text-base font-medium cursor-text hover:bg-opacity-10 hover:bg-gray-500 truncate"
                            onClick={handleTitleClick}
                            title="Click to edit title"
                        >
                            {document.title}
                        </div>
                    )}
                </div>

                {/* Type and language badges */}
                <div className="flex items-center gap-2 mb-3 mt-2">
                    <div
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            color: currentTheme.colors.foreground
                        }}
                    >
                        {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                    </div>

                    {document.language && (
                        <div
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                                backgroundColor: `${currentTheme.colors.accent}20`,
                                color: currentTheme.colors.accent
                            }}
                        >
                            {document.language.charAt(0).toUpperCase() + document.language.slice(1)}
                        </div>
                    )}

                    <div className="ml-auto text-xs opacity-60">
                        {getWordCount(document.content)} words
                    </div>
                </div>
            </div>

            {/* Expandable sections using details/summary for clean UI */}
            <div className="space-y-2">
                {/* Statistics section */}
                <details className="group" open>
                    <summary
                        className="font-medium flex items-center cursor-pointer py-1.5 pl-1 rounded-sm hover:bg-opacity-10 hover:bg-gray-500"
                        style={{ color: currentTheme.colors.foreground }}
                    >
                        <i className="ri-bar-chart-2-line mr-2 text-base" style={{ color: currentTheme.colors.accent }}></i>
                        <span>Statistics</span>
                        <i className="ri-arrow-down-s-line ml-auto transform transition-transform group-open:rotate-180"></i>
                    </summary>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 pl-6">
                        <div>
                            <div className="text-xs opacity-70">Words</div>
                            <div className="text-sm">{getWordCount(document.content)}</div>
                        </div>
                        <div>
                            <div className="text-xs opacity-70">Characters</div>
                            <div className="text-sm">{getCharCount(document.content)}</div>
                        </div>
                        <div>
                            <div className="text-xs opacity-70">Created</div>
                            <div className="text-sm">{formatDate(document.createdAt)}</div>
                        </div>
                        <div>
                            <div className="text-xs opacity-70">Modified</div>
                            <div className="text-sm">{formatDate(document.updatedAt)}</div>
                        </div>
                    </div>
                </details>

                {/* Tags section */}
                <details className="group">
                    <summary
                        className="font-medium flex items-center cursor-pointer py-1.5 pl-1 rounded-sm hover:bg-opacity-10 hover:bg-gray-500"
                        style={{ color: currentTheme.colors.foreground }}
                    >
                        <i className="ri-price-tag-3-line mr-2 text-base" style={{ color: currentTheme.colors.accent }}></i>
                        <span>Tags</span>
                        <i className="ri-arrow-down-s-line ml-auto transform transition-transform group-open:rotate-180"></i>
                    </summary>
                    <div className="mt-2 pl-6">
                        {isTagsEditing ? (
                            <div className="flex flex-col">
                                <input
                                    id="tags-input"
                                    type="text"
                                    placeholder="Add tags separated by commas"
                                    value={tagsInput}
                                    onChange={handleTagsChange}
                                    className="w-full p-1.5 rounded border text-sm"
                                    style={{
                                        backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        borderColor: currentTheme.colors.border,
                                        color: currentTheme.colors.foreground
                                    }}
                                />
                                <div className="flex mt-2 gap-2">
                                    <button
                                        className="px-2 py-1 text-xs rounded flex items-center"
                                        style={{
                                            backgroundColor: `${currentTheme.colors.accent}20`,
                                            color: currentTheme.colors.accent
                                        }}
                                        onClick={toggleTagsEditing}
                                    >
                                        <i className="ri-check-line mr-1"></i> Save
                                    </button>
                                    <button
                                        className="px-2 py-1 text-xs rounded flex items-center"
                                        style={{
                                            backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                        }}
                                        onClick={toggleTagsEditing}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {document.tags && document.tags.length > 0 ? (
                                        document.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-0.5 rounded-full text-xs inline-flex items-center"
                                                style={{
                                                    backgroundColor: `${currentTheme.colors.accent}15`,
                                                    color: currentTheme.colors.accent
                                                }}
                                            >
                        {tag}
                      </span>
                                        ))
                                    ) : (
                                        <span className="text-sm opacity-60">No tags</span>
                                    )}
                                </div>
                                <button
                                    className="text-xs flex items-center opacity-70 hover:opacity-100"
                                    onClick={toggleTagsEditing}
                                >
                                    <i className="ri-edit-line mr-1"></i> Edit tags
                                </button>
                            </div>
                        )}
                    </div>
                </details>

                {/* Actions section */}
                <details className="group">
                    <summary
                        className="font-medium flex items-center cursor-pointer py-1.5 pl-1 rounded-sm hover:bg-opacity-10 hover:bg-gray-500"
                        style={{ color: currentTheme.colors.foreground }}
                    >
                        <i className="ri-tools-line mr-2 text-base" style={{ color: currentTheme.colors.accent }}></i>
                        <span>Actions</span>
                        <i className="ri-arrow-down-s-line ml-auto transform transition-transform group-open:rotate-180"></i>
                    </summary>
                    <div className="mt-2 pl-6 space-y-2">
                        <button
                            className="w-full p-1.5 rounded text-sm flex items-center justify-center"
                            style={{
                                backgroundColor: `${currentTheme.colors.accent}15`,
                                color: currentTheme.colors.accent
                            }}
                        >
                            <i className="ri-download-line mr-1.5"></i> Export
                        </button>
                        <button
                            className="w-full p-1.5 rounded text-sm flex items-center justify-center"
                            style={{
                                backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                            }}
                        >
                            <i className="ri-share-line mr-1.5"></i> Share
                        </button>
                        <button
                            className="w-full p-1.5 rounded text-sm flex items-center justify-center"
                            style={{
                                backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                            }}
                        >
                            <i className="ri-clipboard-line mr-1.5"></i> Copy Content
                        </button>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default PropertiesPanel;
