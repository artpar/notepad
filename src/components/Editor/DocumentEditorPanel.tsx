// src/components/Editor/DocumentEditorPanel.tsx
import React, { useState, useEffect } from 'react';
import { IDockviewPanelProps } from 'dockview';
import DocumentEditor from './DocumentEditor';
import { Document } from '../../types/document';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../UI/ToastSystem';

interface DocumentEditorPanelProps {
    document: Document;
    onUpdate: (content: string) => void;
}

const DocumentEditorPanel: React.FC<IDockviewPanelProps<DocumentEditorPanelProps>> = (props) => {
    const { params } = props;
    const { document, onUpdate } = params;
    const [isEditing, setIsEditing] = useState(true);
    const { settings } = useSettings();
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
    const handleManualSave = () => {
        showToast('Document saved', { type: 'success' });
        setIsDirty(false);
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleManualSave();
        }
    };

    return (
        <div className="h-full" onKeyDown={handleKeyDown}>
            <DocumentEditor
                document={localDocument}
                onUpdate={handleContentChange}
                showInfo={settings.editor.showStatistics}
            />
        </div>
    );
};

export default DocumentEditorPanel;
