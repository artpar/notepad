// src/components/Properties/PropertiesPanel.tsx
import React, {useEffect, useState} from 'react';
import {IDockviewPanelProps} from 'dockview';
import {Document} from '../../types/document';
import {useSettings} from '../../contexts/SettingsContext';
import 'remixicon/fonts/remixicon.css';

interface PropertiesPanelProps {
    document: Document | null;
    onUpdateTitle: (title: string) => void;
}

const PropertiesPanel: React.FC<IDockviewPanelProps<PropertiesPanelProps>> = (props) => {
    const {params} = props;
    const {document, onUpdateTitle} = params;
    const {currentTheme} = useSettings();
    const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
    const [editingTitle, setEditingTitle] = useState('');
    const [tagsInput, setTagsInput] = useState('');

    // Update local title state when document changes
    useEffect(() => {
        if (document) {
            setEditingTitle(document.title);
            setTagsInput(document.tags?.join(', ') || '');
        }
    }, [document?.id, document?.title]);

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

    // Toggle editing state for a field
    const toggleEditing = (field: string) => {
        if (field === 'title' && !isEditing.title) {
            // When starting to edit, set the editing title to the current document title
            setEditingTitle(document?.title || '');
        }

        if (field === 'title' && isEditing.title) {
            // When finishing editing, update the document title
            handleTitleUpdate();
        }

        if (field === 'tags' && !isEditing.tags) {
            // When starting to edit tags, initialize the input
            setTagsInput(document?.tags?.join(', ') || '');
        }

        if (field === 'tags' && isEditing.tags) {
            // When finishing editing tags, process them
            // This is just a placeholder - actual tag updating would need to be implemented
            // const newTags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            // Update document tags logic would go here
        }

        setIsEditing(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Handle title input change
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditingTitle(e.target.value);
    };

    // Handle title update
    const handleTitleUpdate = () => {
        if (document && editingTitle.trim() !== '') {
            onUpdateTitle(editingTitle);
        }
    };

    // Handle key press in title input
    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleUpdate();
            toggleEditing('title');
        } else if (e.key === 'Escape') {
            // Reset to original title and exit editing mode
            setEditingTitle(document?.title || '');
            setIsEditing(prev => ({
                ...prev,
                title: false
            }));
        }
    };

    // Handle tags input change
    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagsInput(e.target.value);
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
                className="flex flex-col items-center justify-center h-full p-6 text-center"
                style={{color: currentTheme.colors.foreground}}
            >
                <i className="ri-file-info-line text-5xl mb-4 opacity-30"></i>
                <p className="text-lg font-medium mb-2">No document selected</p>
                <p className="text-sm opacity-60">Select a document to view its properties</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col border-t-4 border-t-blue-gray-300 properties-container justify-between">
            {/* Document title */}
            <div className="flex flex-col max-h-1/2">
                <div className="flex flex-col property-group mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium opacity-70">Title</label>
                        <button
                            className="text-xs p-1 rounded-full hover:bg-opacity-10 hover:bg-gray-500"
                            onClick={() => toggleEditing('title')}
                            title={isEditing.title ? "Save" : "Edit title"}
                        >
                            <i className={`ri-${isEditing.title ? 'check-line' : 'pencil-line'}`}></i>
                        </button>
                    </div>
                    {isEditing.title ? (
                        <input
                            type="text"
                            value={editingTitle}
                            onChange={handleTitleChange}
                            className="w-full p-2 rounded border text-sm"
                            style={{
                                backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                borderColor: currentTheme.colors.border,
                                color: currentTheme.colors.foreground
                            }}
                            autoFocus
                            onBlur={() => toggleEditing('title')}
                            onKeyDown={handleTitleKeyDown}
                        />
                    ) : (
                        <div
                            className="p-2 rounded text-sm font-medium overflow-hidden text-ellipsis"
                            style={{
                                backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            }}
                        >
                            {document.title}
                        </div>
                    )}
                </div>

                {/* Document type and language */}
                <div className="flex flex-col property-group mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium opacity-70">Type</label>
                    </div>
                    <div className="flex items-center">
                        <div
                            className="px-3 py-1.5 rounded text-sm font-medium"
                            style={{
                                backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            }}
                        >
                            <i className={`mr-2 ${
                                document.type === 'text' ? 'ri-file-text-line' :
                                    document.type === 'markdown' ? 'ri-markdown-line' :
                                        'ri-file-code-line'
                            }`}></i>
                            {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                        </div>
                        {document.type === 'code' && document.language && (
                            <div
                                className="ml-2 px-3 py-1.5 rounded text-sm font-medium"
                                style={{
                                    backgroundColor: `${currentTheme.colors.accent}20`,
                                    color: currentTheme.colors.accent
                                }}
                            >
                                <i className={`mr-2 ${
                                    document.language === 'javascript' ? 'ri-javascript-line' :
                                        document.language === 'typescript' ? 'ri-code-s-slash-line' :
                                            document.language === 'python' ? 'ri-code-line' :
                                                document.language === 'html' ? 'ri-html5-line' :
                                                    document.language === 'css' ? 'ri-css3-line' :
                                                        'ri-code-line'
                                }`}></i>
                                {document.language.charAt(0).toUpperCase() + document.language.slice(1)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Document statistics */}
                <div className="flex flex-col  property-group mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium opacity-70">Statistics</label>
                    </div>
                    <div
                        className="p-3 rounded grid grid-cols-2 gap-3"
                        style={{
                            backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                        }}
                    >
                        <div>
                            <div className="text-xs opacity-60 mb-1">Words</div>
                            <div className="text-sm font-medium">{getWordCount(document.content)}</div>
                        </div>
                        <div>
                            <div className="text-xs opacity-60 mb-1">Characters</div>
                            <div className="text-sm font-medium">{getCharCount(document.content)}</div>
                        </div>
                        <div>
                            <div className="text-xs opacity-60 mb-1">Created</div>
                            <div className="text-sm font-medium">{formatDate(document.createdAt)}</div>
                        </div>
                        <div>
                            <div className="text-xs opacity-60 mb-1">Modified</div>
                            <div className="text-sm font-medium">{formatDate(document.updatedAt)}</div>
                        </div>
                    </div>
                </div>

                {/* Document tags */}
                <div className="flex flex-col property-group mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium opacity-70">Tags</label>
                        <button
                            className="text-xs p-1 rounded-full hover:bg-opacity-10 hover:bg-gray-500"
                            onClick={() => toggleEditing('tags')}
                            title={isEditing.tags ? "Save" : "Edit tags"}
                        >
                            <i className={`ri-${isEditing.tags ? 'check-line' : 'price-tag-3-line'}`}></i>
                        </button>
                    </div>
                    {isEditing.tags ? (
                        <div className="flex flex-col">
                            <input
                                type="text"
                                placeholder="Add tags separated by commas"
                                value={tagsInput}
                                onChange={handleTagsChange}
                                className="w-full p-2 rounded border text-sm mb-1"
                                style={{
                                    backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    borderColor: currentTheme.colors.border,
                                    color: currentTheme.colors.foreground
                                }}
                                autoFocus
                                onBlur={() => toggleEditing('tags')}
                                // This is just a placeholder - actual tag updating would need to be implemented
                            />
                            <div className="text-xs opacity-60 mt-1">Press Enter to save</div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {document.tags && document.tags.length > 0 ? (
                                document.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 rounded text-xs font-medium"
                                        style={{
                                            backgroundColor: `${currentTheme.colors.accent}15`,
                                            color: currentTheme.colors.accent
                                        }}
                                    >
                  <i className="ri-price-tag-3-line mr-1"></i>
                                        {tag}
                </span>
                                ))
                            ) : (
                                <div className="p-2 text-sm opacity-60">No tags</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Export options */}
            <div className="flex gap-2">
                <button
                    className="flex-1 p-2 rounded text-sm font-medium flex items-center justify-center"
                    style={{
                        backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}
                >
                    <i className="ri-download-line mr-1"></i> Export
                </button>
                <button
                    className="flex-1 p-2 rounded text-sm font-medium flex items-center justify-center"
                    style={{
                        backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}
                >
                    <i className="ri-share-line mr-1"></i> Share
                </button>
            </div>
        </div>
    );
};

export default PropertiesPanel;
