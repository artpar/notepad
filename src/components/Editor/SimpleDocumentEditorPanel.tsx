import React, { useState, useEffect } from 'react';
import { IDockviewPanelProps } from 'dockview';
import SimpleDocumentEditor from './SimpleDocumentEditor';
import { Document } from '../../types/document';
import { useDocuments } from '../../contexts/UseDocuments';
import * as StorageService from '../../services/storage';

interface SimpleDocumentEditorPanelProps {
  document: Document;
  documentId?: number;
}

const SimpleDocumentEditorPanel: React.FC<IDockviewPanelProps<SimpleDocumentEditorPanelProps>> = (props) => {
  const { document: initialDocument, documentId } = props.params;
  const { documents } = useDocuments();
  const [document, setDocument] = useState<Document | null>(initialDocument);
  
  // Get the document ID
  const docId = documentId || (initialDocument?.id ? parseInt(initialDocument.id) : null);
  
  // Load document from context or storage
  useEffect(() => {
    if (docId) {
      // First try to find in context documents
      const contextDoc = documents.find(d => d.id && parseInt(d.id) === docId);
      if (contextDoc) {
        setDocument(contextDoc);
      } else {
        // Load from storage if not in context
        StorageService.getDocument(docId).then(doc => {
          if (doc) {
            setDocument(doc);
          }
        });
      }
    }
  }, [docId, documents]);
  
  if (!document) {
    return <div className="p-4">Loading document...</div>;
  }
  
  // Refresh document after save
  const handleSaveComplete = async () => {
    if (docId) {
      const freshDoc = await StorageService.getDocument(docId);
      if (freshDoc) {
        setDocument(freshDoc);
      }
    }
  };
  
  return <SimpleDocumentEditor document={document} onSaveComplete={handleSaveComplete} />;
};

export default SimpleDocumentEditorPanel;