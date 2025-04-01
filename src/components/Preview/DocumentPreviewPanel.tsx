// src/components/Preview/DocumentPreviewPanel.tsx
import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import { Document } from '../../types/document';
import { marked } from 'marked';

interface DocumentPreviewPanelProps {
  document: Document;
}

const DocumentPreviewPanel: React.FC<IDockviewPanelProps<DocumentPreviewPanelProps>> = (props) => {
  const { params } = props;
  const { document } = params;

  // Simple preview rendering based on document type
  const renderPreview = () => {
    switch (document.type) {
      case 'markdown':
        return <div className="preview markdown-preview" dangerouslySetInnerHTML={{ __html: marked(document.content) }} />;
      case 'html':
        return <iframe srcDoc={document.content} className="preview html-preview" />;
      default:
        return <pre className="preview text-preview">{document.content}</pre>;
    }
  };

  return (
    <div className="preview-container">
      <div className="preview-header">
        <h3>Preview: {document.title}</h3>
      </div>
      <div className="preview-content">
        {renderPreview()}
      </div>
    </div>
  );
};

export default DocumentPreviewPanel;