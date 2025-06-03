import React, { useState, useEffect } from 'react';
import { IDockviewPanelProps } from 'dockview';
import SimpleDocumentEditor from './SimpleDocumentEditor';
import { Document } from '../../types/document';
import { useDocuments } from '../../contexts/DocumentProvider.tsx';
import * as StorageService from '../../services/storage';

interface SimpleDocumentEditorPanelProps {
  document: Document;
  documentId?: number;
}

const SimpleDocumentEditorPanel: React.FC<IDockviewPanelProps<SimpleDocumentEditorPanelProps>> = (props) => {
  const { document: initialDocument, documentId } = props.params;
  const { documents } = useDocuments();
  const [document, setDocument] = useState<Document | null>(initialDocument);

  // Get the document ID - ensure it's a number
  // documentId might come as string from restored layout
  const docId = documentId ?
    (typeof documentId === 'string' ? parseInt(documentId) : documentId) :
    (initialDocument?.id ?
      (typeof initialDocument.id === 'string' ? parseInt(initialDocument.id) : initialDocument.id) :
      null);

  // Load document from context or storage
  useEffect(() => {
    console.log('[SimpleDocumentEditorPanel] Loading document:', { docId, initialDocument });

    if (docId) {
      // First try to find in context documents
      // Documents have string IDs, so compare as strings
      const contextDoc = documents.find(d => d.id === String(docId));
      console.log('[SimpleDocumentEditorPanel] Context doc found:', contextDoc);
      console.log('[SimpleDocumentEditorPanel] Available documents:', documents.map(d => ({ id: d.id, title: d.title })));

      if (contextDoc) {
        setDocument(contextDoc);
      } else {
        // Load from storage if not in context
        console.log('[SimpleDocumentEditorPanel] Loading from storage with ID:', docId);
        StorageService.getDocument(docId).then(doc => {
          console.log('[SimpleDocumentEditorPanel] Storage doc loaded:', doc);
          if (doc) {
            setDocument(doc);
          }
        }).catch(err => {
          console.error('[SimpleDocumentEditorPanel] Error loading document:', err);
        });
      }
    } else if (initialDocument) {
      // If no docId but we have initial document, use it
      console.log('[SimpleDocumentEditorPanel] Using initial document');
      setDocument(initialDocument);
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
