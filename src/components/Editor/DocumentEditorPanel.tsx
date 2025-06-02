// src/components/Editor/DocumentEditorPanel.tsx
import React, { useState, useEffect } from 'react';
import { IDockviewPanelProps } from 'dockview';
import DocumentEditor from './DocumentEditor';
import { Document } from '../../types/document';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../UI/ToastSystem';
import { IconButton } from '../UI/Buttons';
import * as StorageService from '../../services/storage';

interface DocumentEditorPanelProps {
    document: Document;
    onUpdate: (content: string) => void;
}

const DocumentEditorPanel: React.FC<IDockviewPanelProps<DocumentEditorPanelProps>> = (props) => {
    const { params } = props;
    const { document, onUpdate } = params;
    const [isEditing, setIsEditing] = useState(true);
    const { settings, currentTheme } = useSettings();
    const { showToast } = useToast();

    // Track if document has unsaved changes
    const [isDirty, setIsDirty] = useState(false);
    
    // Create a local copy of the document to prevent issues during saving
    const [localDocument, setLocalDocument] = useState(document);
    
    // Update local document when the source document changes
    useEffect(() => {
        if (document) {
            setLocalDocument(document);
        }
    }, [document]);

    // Handle content updates
    const handleContentChange = (content: string) => {
        if (typeof onUpdate === 'function') {
            // Only mark as dirty if content actually changed
            if (content !== localDocument.content) {
                setIsDirty(true);
                
                // Update local document immediately for responsive UI
                setLocalDocument(prev => ({
                    ...prev,
                    content,
                    updatedAt: new Date()
                }));
            }

            // Call the update function
            onUpdate(content);

            // If auto-save is enabled, clear the dirty flag
            if (settings.editor.autoSave) {
                setIsDirty(false);
            }
        }
    };

    // Handle manual save
    const handleManualSave = async () => {
        if (localDocument && localDocument.id) {
            try {
                await StorageService.updateDocument(parseInt(localDocument.id), localDocument);
                showToast('Document saved', { type: 'success' });
                setIsDirty(false);
            } catch (error) {
                showToast('Failed to save document', { type: 'error' });
            }
        }
    };

    // Handle export
    const handleExport = () => {
        if (!localDocument) {
            showToast('No document to export', { type: 'warning' });
            return;
        }

        const getFileExtension = (type: string): string => {
            switch (type) {
                case 'markdown':
                    return 'md';
                case 'javascript':
                    return 'js';
                case 'python':
                    return 'py';
                case 'html':
                    return 'html';
                default:
                    return 'txt';
            }
        };

        try {
            const blob = new Blob([localDocument.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = `${localDocument.title}.${getFileExtension(localDocument.type.type)}`;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast(`Exported "${fileName}" successfully`, { type: 'success' });
        } catch (error) {
            console.error('Error exporting document:', error);
            showToast('Failed to export document', { type: 'error' });
        }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleManualSave();
        }
        
        // Ctrl/Cmd + E to export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            handleExport();
        }
    };

    return (
        <div className="h-full flex flex-col" onKeyDown={handleKeyDown}>
            {/* Toolbar */}
            <div
                className="flex items-center justify-between px-2 py-1 border-b"
                style={{
                    backgroundColor: currentTheme.colors.background,
                    borderColor: currentTheme.colors.border
                }}
            >
                <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium px-2">
                        {localDocument?.title || 'Untitled'}
                    </span>
                    {isDirty && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            • Unsaved changes
                        </span>
                    )}
                </div>
                
                <div className="flex items-center space-x-1">
                    {/* Save button */}
                    <IconButton
                        icon="save-line"
                        onClick={handleManualSave}
                        title="Save (Ctrl+S)"
                        disabled={!isDirty}
                    />
                    
                    {/* Export button */}
                    <IconButton
                        icon="download-line"
                        onClick={handleExport}
                        title="Export (Ctrl+E)"
                    />
                </div>
            </div>
            
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <DocumentEditor
                    document={localDocument}
                    onUpdate={handleContentChange}
                    showInfo={settings.editor.showStatistics}
                />
            </div>
        </div>
    );
};

export default DocumentEditorPanel;
