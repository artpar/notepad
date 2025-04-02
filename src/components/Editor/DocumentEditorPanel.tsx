// src/components/Editor/DocumentEditorPanel.tsx
import React from 'react';
import {IDockviewPanelProps} from 'dockview';
import CodeEditor from './CodeEditor';
import {Document} from '../../types/document';

interface DocumentEditorPanelProps {
    document: Document;
    onUpdate: (content: string) => void;
}

const DocumentEditorPanel: React.FC<IDockviewPanelProps<DocumentEditorPanelProps>> = (props) => {
    const {params} = props;
    const {document, onUpdate} = params;

    // Handle content updates
    const handleContentChange = (content: string) => {
        if (typeof onUpdate === 'function') {
            onUpdate(content);
        }
    };

    // Map DocType to CodeLanguage
    const getLanguage = (type: string) => {
        switch (type) {
            case 'markdown':
                return 'markdown';
            case 'javascript':
                return 'javascript';
            case 'python':
                return 'python';
            case 'html':
                return 'html';
            default:
                return 'plaintext';
        }
    };

    return (
        <CodeEditor
            content={document.content}
            language={getLanguage(document.type)}
            onChange={handleContentChange}
        />
    );
};

export default DocumentEditorPanel;
