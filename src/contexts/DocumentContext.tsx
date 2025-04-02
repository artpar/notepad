// src/contexts/DocumentContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Document, DocumentState } from '../types/document';
import { TabInfo } from '../types/ui';
import * as StorageService from '../services/storage';

interface DocumentContextType {
  documents: Document[];
  activeDocument: Document | null;
  documentStates: Record<number, DocumentState>;
  openTabs: TabInfo[];
  activeTabId: string | null;
  isLoading: boolean;

  // Actions
  createDocument: (type: Document['type'], language?: string) => Promise<number>;
  openDocument: (id: number) => Promise<void>;
  saveDocument: (document: Document) => Promise<void>;
  closeDocument: (id: number) => Promise<void>;
  updateDocument: (id: number, content: string) => void;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  searchDocuments: (query: string) => Promise<Document[]>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [documentStates, setDocumentStates] = useState<Record<number, DocumentState>>({});
  const [openTabs, setOpenTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await StorageService.getAllDocuments();
        setDocuments(docs);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load documents', error);
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Setup autosave
  useEffect(() => {
    const autosaveInterval = setInterval(async () => {
      if (activeDocument && documentStates[activeDocument.id!]?.isDirty) {
        await saveDocument(activeDocument);
      }
    }, 5000); // 5 seconds autosave

    return () => clearInterval(autosaveInterval);
  }, [activeDocument, documentStates]);

  const createDocument = async (type: Document['type'], language?: string): Promise<number> => {
    const newDoc: Document = {
      title: 'Untitled',
      content: '',
      type,
      language: language as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    };

    const id = await StorageService.saveDocument(newDoc);
    newDoc.id = id;

    setDocuments(prev => [...prev, newDoc]);

    // Create a tab for the new document
    const tabId = `doc-${id}`;
    const newTab: TabInfo = {
      id: tabId,
      title: newDoc.title,
      documentId: id,
      type: 'document'
    };

    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
    setActiveDocument(newDoc);

    setDocumentStates(prev => ({
      ...prev,
      [id]: { isDirty: false, isSaving: false }
    }));

    return id;
  };

  const openDocument = async (id: number): Promise<void> => {
    // Check if document is already open in a tab
    const existingTabIndex = openTabs.findIndex(tab => tab.documentId === id);

    if (existingTabIndex >= 0) {
      setActiveTabId(openTabs[existingTabIndex].id);
    } else {
      const document = await StorageService.getDocument(id);

      if (document) {
        const tabId = `doc-${id}`;
        const newTab: TabInfo = {
          id: tabId,
          title: document.title,
          documentId: id,
          type: 'document'
        };

        setOpenTabs(prev => [...prev, newTab]);
        setActiveTabId(tabId);
        setActiveDocument(document);

        if (!documentStates[id]) {
          setDocumentStates(prev => ({
            ...prev,
            [id]: { isDirty: false, isSaving: false }
          }));
        }
      }
    }
  };

  const saveDocument = async (document: Document): Promise<void> => {
    if (!document.id) return;

    setDocumentStates(prev => ({
      ...prev,
      [document.id!]: { ...prev[document.id!], isSaving: true }
    }));

    try {
      await StorageService.saveDocument(document);

      // Update the documents list
      setDocuments(prev => {
        const docIndex = prev.findIndex(doc => doc.id === document.id);
        if (docIndex >= 0) {
          const newDocs = [...prev];
          newDocs[docIndex] = document;
          return newDocs;
        }
        return prev;
      });

      // If this is the active document, update it too
      if (activeDocument?.id === document.id) {
        setActiveDocument(document);
      }

      setDocumentStates(prev => ({
        ...prev,
        [document.id!]: {
          isDirty: false,
          isSaving: false,
          lastSaved: new Date()
        }
      }));

      // Update tab title and dirty state
      setOpenTabs(prev =>
          prev.map(tab =>
              tab.documentId === document.id
                  ? { ...tab, title: document.title, isDirty: false }
                  : tab
          )
      );
    } catch (error) {
      console.error('Failed to save document', error);

      setDocumentStates(prev => ({
        ...prev,
        [document.id!]: { ...prev[document.id!], isSaving: false }
      }));
    }
  };

  const closeDocument = async (id: number): Promise<void> => {
    // Check if document is dirty and needs saving
    if (documentStates[id]?.isDirty) {
      await saveDocument(documents.find(doc => doc.id === id)!);
    }

    // Close all tabs for this document
    const updatedTabs = openTabs.filter(tab => tab.documentId !== id);
    setOpenTabs(updatedTabs);

    // If the active document is being closed, set a new active document
    if (activeDocument?.id === id) {
      if (updatedTabs.length > 0) {
        const lastTab = updatedTabs[updatedTabs.length - 1];
        setActiveTabId(lastTab.id);

        if (lastTab.documentId) {
          const doc = documents.find(d => d.id === lastTab.documentId);
          setActiveDocument(doc || null);
        } else {
          setActiveDocument(null);
        }
      } else {
        setActiveTabId(null);
        setActiveDocument(null);
      }
    }
  };

  const updateDocument = useCallback(async (id: number, content: string) => {
    // Mark document as dirty
    setDocumentStates(prev => ({
      ...prev,
      [id]: { ...prev[id], isDirty: true }
    }));

    // Update tabs
    setOpenTabs(prev =>
      prev.map(tab =>
        tab.documentId === id ? { ...tab, isDirty: true } : tab
      )
    );

    // Find the document to save
    let docToSave = documents.find(doc => doc.id === id);

    // If document not found in state, try to fetch it directly from storage
    if (!docToSave) {
      docToSave = await StorageService.getDocument(id);
      // If we found the document in storage, add it to our state
      if (docToSave) {
        setDocuments(prev => [...(prev.filter(e => docToSave.id !== e.id)), docToSave!]);
      }
    }

    if (docToSave) {
      const updatedDoc = { ...docToSave, content, updatedAt: new Date() };
      // Use setTimeout to avoid state update conflicts
      setTimeout(() => {
        saveDocument(updatedDoc);
      }, 0);
    } else {
      console.error(`Could not find document with id ${id} to update`);
    }
  }, [documents, saveDocument]);

  const switchTab = (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);

      if (tab.documentId) {
        const doc = documents.find(d => d.id === tab.documentId);
        setActiveDocument(doc || null);
      } else {
        setActiveDocument(null);
      }
    }
  };

  const closeTab = async (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);

    if (tab && tab.documentId) {
      // Only close the tab, don't delete the document
      if (documentStates[tab.documentId]?.isDirty) {
        await saveDocument(documents.find(doc => doc.id === tab.documentId)!);
      }
    }

    const updatedTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(updatedTabs);

    // If the active tab is being closed, set a new active tab
    if (activeTabId === tabId) {
      if (updatedTabs.length > 0) {
        const lastTab = updatedTabs[updatedTabs.length - 1];
        setActiveTabId(lastTab.id);

        if (lastTab.documentId) {
          const doc = documents.find(d => d.id === lastTab.documentId);
          setActiveDocument(doc || null);
        } else {
          setActiveDocument(null);
        }
      } else {
        setActiveTabId(null);
        setActiveDocument(null);
      }
    }
  };

  const searchDocuments = async (query: string): Promise<Document[]> => {
    return await StorageService.searchDocuments(query);
  };

  const value = {
    documents,
    activeDocument,
    documentStates,
    openTabs,
    activeTabId,
    isLoading,

    createDocument,
    openDocument,
    saveDocument,
    closeDocument,
    updateDocument,
    switchTab,
    closeTab,
    searchDocuments
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export default DocumentContext;
