// src/components/Editor/DocumentEditorPanel.tsx
import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import CodeEditor from './CodeEditor';
import { Document } from '../../types/document';

interface DocumentEditorPanelProps {
  document: Document;
  onUpdate: (content: string) => void;
}

const DocumentEditorPanel: React.FC<IDockviewPanelProps<DocumentEditorPanelProps>> = (props) => {
  const { params } = props;
  const { document, onUpdate } = params;
  
  // Map DocType to CodeLanguage
  const getLanguage = (type: string) => {
    switch (type) {
      case 'markdown': return 'markdown';
      case 'javascript': return 'javascript';
      case 'python': return 'python';
      case 'html': return 'html';
      default: return 'plaintext';
    }
  };

  return (
    <div className="editor-container h-full">
      <CodeEditor
        content={document.content}
        language={getLanguage(document.type)}
        onChange={onUpdate}
      />
    </div>
  );
};

export default DocumentEditorPanel;