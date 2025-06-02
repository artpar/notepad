// src/components/Editor/DocumentEditorPanel.tsx
import React, { useState, useEffect } from 'react';
import { IDockviewPanelProps } from 'dockview';
import DocumentEditor from './DocumentEditor';
import { Document } from '../../types/document';
import { useSettings } from '../../contexts/SettingsContext';

interface DocumentEditorPanelProps {
    document: Document;
    onUpdate: (content: string) => void;
}

const DocumentEditorPanel: React.FC<IDockviewPanelProps<DocumentEditorPanelProps>> = (props) => {
    const { params } = props;
    const { document, onUpdate } = params;
    const { settings, currentTheme } = useSettings();

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
            // Update local document immediately for responsive UI
            if (content !== localDocument.content) {
                setLocalDocument(prev => ({
                    ...prev,
                    content,
                    updatedAt: new Date()
                }));
            }

            // Call the update function
            onUpdate(content);
        }
    };


    return (
        <div className="h-full flex flex-col">
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
