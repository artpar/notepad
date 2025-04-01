// src/components/Explorer/ExplorerPanel.tsx
import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import { Document } from '../../types/document';

type DocType = 'text' | 'markdown' | 'javascript' | 'python' | 'html';

interface ExplorerPanelProps {
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
  onCreateDocument: (type: DocType) => void;
  onDeleteDocument: (id: string) => void;
}

const ExplorerPanel: React.FC<IDockviewPanelProps<ExplorerPanelProps>> = (props) => {
  const { params } = props;
  const { documents, onSelectDocument, onCreateDocument, onDeleteDocument } = params;

  return (
    <div className="explorer-container">
      <div className="explorer-header">
        <h3>Documents</h3>
        <div className="new-doc-dropdown">
          <button className="new-doc-button">New +</button>
          <div className="dropdown-content">
            <button onClick={() => onCreateDocument('text')}>Text File</button>
            <button onClick={() => onCreateDocument('markdown')}>Markdown</button>
            <button onClick={() => onCreateDocument('javascript')}>JavaScript</button>
            <button onClick={() => onCreateDocument('python')}>Python</button>
            <button onClick={() => onCreateDocument('html')}>HTML</button>
          </div>
        </div>
      </div>
      
      <div className="documents-list">
        {documents.length === 0 ? (
          <p className="no-docs">No documents yet. Create one to get started!</p>
        ) : (
          documents.map(doc => (
            <div 
              key={doc.id} 
              className="document-item"
              onClick={() => onSelectDocument(doc)}
            >
              <span className="doc-title">{doc.title}</span>
              <span className="doc-type">{doc.type}</span>
              <button 
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this document?')) {
                    onDeleteDocument(doc.id);
                  }
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExplorerPanel;