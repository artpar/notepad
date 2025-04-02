// src/components/Editor/DocumentEditorPanel.tsx
import React, { useState } from 'react';
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

    // Handle content updates
    const handleContentChange = (content: string) => {
        if (typeof onUpdate === 'function') {
            // Only mark as dirty if content actually changed
            if (content !== document.content) {
                setIsDirty(true);
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
                document={document}
                onUpdate={handleContentChange}
                showInfo={settings.editor.showStatistics}
            />
        </div>
    );
};

export default DocumentEditorPanel;
