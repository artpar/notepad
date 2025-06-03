// src/contexts/DocumentContext.tsx
import React, {createContext, useCallback, useEffect, useRef, useState} from 'react';
import {CodeLanguage, Document, DocumentState} from '../types/document';
import {TabInfo} from '../types/ui';
import * as StorageService from '../services/storage';
import {DocumentType} from "../types/DocumentType.tsx";

interface DocumentContextType {
  documents: Document[];
  activeDocument: Document | null;
  documentStates: Record<number, DocumentState>;
  openTabs: TabInfo[];
  activeTabId: string | null;
  isLoading: boolean;

  // Actions
  createDocument: (type: DocumentType, language?: string, content?: string, title?: string) => Promise<number>;
  openDocument: (id: number) => Promise<void>;
  saveDocument: (document: Document) => Promise<void>;
  closeDocument: (id: number) => Promise<void>;
  updateDocument: (id: number, content: string) => void;
  updateDocumentTitle: (id: number, title: string) => Promise<void>;
  updateDocumentTags: (id: number, tags: string[]) => Promise<void>;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  searchDocuments: (query: string) => Promise<Document[]>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [documentStates, setDocumentStates] = useState<Record<number, DocumentState>>({});
  const [openTabs, setOpenTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Use a ref to track pending saves to avoid race conditions
  const pendingSaves = useRef<Set<number>>(new Set());
  const saveTimeouts = useRef<Record<number, NodeJS.Timeout>>({});
  
  // Keep a ref to the latest documents to access in callbacks
  const documentsRef = useRef<Document[]>(documents);
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);
  
  // Cleanup save timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all pending save timeouts
      Object.values(saveTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Load documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await StorageService.getAllDocuments();
        setDocuments(docs);
        setIsLoading(false);
        
        // If there are open tabs but no active document, set the first one as active
        if (openTabs.length > 0 && !activeDocument) {
          const firstTab = openTabs[0];
          if (firstTab.documentId) {
            const doc = docs.find(d => d.id && parseInt(d.id) === firstTab.documentId);
            if (doc) {
              setActiveDocument(doc);
              setActiveTabId(firstTab.id);
            }
          }
        }
      } catch (error) {
        console.error('[DocumentContext] Failed to load documents:', error);
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Ensure active document is set when tabs exist but no active document
  useEffect(() => {
    if (openTabs.length > 0 && !activeDocument && documents.length > 0 && !isLoading) {
      const activeTab = openTabs.find(tab => tab.id === activeTabId) || openTabs[0];
      if (activeTab?.documentId) {
        const doc = documents.find(d => d.id && parseInt(d.id) === activeTab.documentId);
        if (doc) {
          setActiveDocument(doc);
          if (!activeTabId) {
            setActiveTabId(activeTab.id);
          }
        }
      }
    }
  }, [openTabs, activeDocument, documents, activeTabId, isLoading]);

  // Setup autosave (as backup for immediate saves)
  useEffect(() => {
    const autosaveInterval = setInterval(async () => {
      // Find all dirty documents
      const dirtyDocs = Object.entries(documentStates)
          .filter(([, state]) => state.isDirty)
          .map(([id]) => parseInt(id));


      // Find corresponding documents
      for (const id of dirtyDocs) {
        if (pendingSaves.current.has(id)) {
          continue;
        }

        const doc = documents.find(d => d.id && parseInt(d.id) === id);
        if (doc) {
          await saveDocument(doc);
        }
      }
    }, 5000); // 5 seconds autosave as backup

    return () => clearInterval(autosaveInterval);
  }, [documents, documentStates]);

  const createDocument = async (type: DocumentType, language?: string, content?: string, title?: string): Promise<number> => {
    // Generate a unique title
    const baseName = type.type === 'markdown' ? 'Untitled Document' :
        type.type === 'javascript' ? 'Untitled Script' :
            type.type === 'python' ? 'Untitled Script' :
                type.type === 'html' ? 'Untitled Page' : 'Untitled';

    let nameCounter = 1;
    title = title || baseName;

    // Check if the name already exists
    while (documents.some(doc => doc.title === title)) {
      title = `${baseName} ${nameCounter++}`;
    }

    const newDoc: Document = {
      title,
      content: content,
      type,
      language: language as CodeLanguage,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    };

    const id = await StorageService.saveDocument(newDoc);
    newDoc.id = id + "";

    setDocuments(prev => [...prev, newDoc]);

    // Create a tab for the new document
    const tabId = `doc-${id}`;
    const newTab: TabInfo = {
      id: tabId,
      title: newDoc.title,
      documentId: id,
      isDirty: false,
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

      // Find the document and set it as active
      const doc = documents.find(d => d.id && parseInt(d.id) === id);
      if (doc) {
        setActiveDocument(doc);
      } else {
        // Document not in memory, load it
        const loadedDoc = await StorageService.getDocument(id);
        if (loadedDoc) {
          setDocuments(prev => [...prev, loadedDoc]);
          setActiveDocument(loadedDoc);
        }
      }
    } else {
      // Try to find document in memory first
      let document = documents.find(d => d.id && parseInt(d.id) === id);

      // If not found in memory, load from storage
      if (!document) {
        document = await StorageService.getDocument(id);

        // Add to documents list if found
        if (document) {
          setDocuments(prev => [...prev.filter(d => d.id && parseInt(d.id) !== id), document!]);
        }
      }

      if (document) {
        const tabId = `doc-${id}`;
        const newTab: TabInfo = {
          id: tabId,
          title: document.title,
          documentId: id,
          type: 'document',
          isDirty: false
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

  const saveDocumentInternal = async (document: Document): Promise<void> => {
    if (!document.id) return;
    
    const docId = parseInt(document.id);
    
    // Check if already saving
    if (pendingSaves.current.has(docId)) {
      return;
    }
    

    // Mark as saving and add to pending saves
    pendingSaves.current.add(docId);
    setDocumentStates(prev => ({
      ...prev,
      [docId]: { ...prev[docId], isSaving: true }
    }));

    try {
      const savedId = await StorageService.saveDocument(document);

      // Update documents list
      setDocuments(prev => {
        const index = prev.findIndex(d => d.id && parseInt(d.id) === docId);
        if (index >= 0) {
          const newDocs = [...prev];
          newDocs[index] = document;
          return newDocs;
        }
        return [...prev, document];
      });

      // If this is the active document, update it
      if (activeDocument?.id && parseInt(activeDocument.id) === docId) {
        setActiveDocument(document);
      }

      // Update document state
      setDocumentStates(prev => ({
        ...prev,
        [docId]: {
          isDirty: false,
          isSaving: false,
          lastSaved: new Date()
        }
      }));

      // Update tab title and dirty state
      setOpenTabs(prev =>
          prev.map(tab =>
              tab.documentId === docId
                  ? { ...tab, title: document.title, isDirty: false }
                  : tab
          )
      );
    } catch (error) {
      console.error(`[DocumentContext] Failed to save document ${docId}:`, error);

      setDocumentStates(prev => ({
        ...prev,
        [docId]: { ...prev[docId], isSaving: false }
      }));
    } finally {
      // Remove from pending saves
      pendingSaves.current.delete(docId);
    }
  };

  const saveDocument = async (document: Document): Promise<void> => {
    return saveDocumentInternal(document);
  };

  const closeDocument = async (id: number): Promise<void> => {
    // Check if document is dirty and needs saving
    if (documentStates[id]?.isDirty) {
      const doc = documents.find(d => d.id && parseInt(d.id) === id);
      if (doc) {
        await saveDocument(doc);
      }
    }

    // Close all tabs for this document
    const updatedTabs = openTabs.filter(tab => tab.documentId !== id);
    setOpenTabs(updatedTabs);

    // If the active document is being closed, set a new active document
    if (activeDocument && activeDocument.id && parseInt(activeDocument.id) === id) {
      if (updatedTabs.length > 0) {
        const lastTab = updatedTabs[updatedTabs.length - 1];
        setActiveTabId(lastTab.id);

        if (lastTab.documentId) {
          const doc = documents.find(d => d.id && parseInt(d.id) === lastTab.documentId);
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
    
    // Mark document as dirty and track modification time
    setDocumentStates(prev => ({
      ...prev,
      [id]: { ...prev[id], isDirty: true, lastModified: new Date() }
    }));

    // Update tabs
    setOpenTabs(prev =>
        prev.map(tab =>
            tab.documentId === id ? { ...tab, isDirty: true } : tab
        )
    );

    // Update the document in memory
    let documentToSave: Document | null = null;
    
    setDocuments(prev => {
      const index = prev.findIndex(doc => doc.id && parseInt(doc.id) === id);
      if (index >= 0) {
        const updatedDoc = {
          ...prev[index],
          content,
          updatedAt: new Date()
        };

        documentToSave = updatedDoc;

        // If this is the active document, update it
        if (activeDocument && activeDocument.id && parseInt(activeDocument.id) === id) {
          setActiveDocument(updatedDoc);
        }

        const newDocs = [...prev];
        newDocs[index] = updatedDoc;
        return newDocs;
      }
      return prev;
    });

    // Clear existing timeout for this document
    if (saveTimeouts.current[id]) {
      clearTimeout(saveTimeouts.current[id]);
    }

    // Set up a new timeout to save after a delay
    // Use longer delay for larger documents to prevent performance issues
    if (documentToSave) {
      const contentSize = content.length;
      let saveDelay = 1000; // Default 1 second
      
      if (contentSize < 10000) {
        saveDelay = 500; // 500ms for small documents
      } else if (contentSize < 100000) {
        saveDelay = 1000; // 1 second for medium documents
      } else {
        saveDelay = 2000; // 2 seconds for large documents
      }
      
      // Capture the document in closure to avoid lookup delays
      const docToSave = documentToSave;
      
      saveTimeouts.current[id] = setTimeout(async () => {
        
        // Use the captured document directly
        await saveDocumentInternal(docToSave);
        
        delete saveTimeouts.current[id];
      }, saveDelay);
    }
  }, []);

  const updateDocumentTitle = async (id: number, title: string): Promise<void> => {
    // Find the document
    const doc = documents.find(d => d.id && parseInt(d.id) === id);
    if (!doc) return;

    // Update document with new title
    const updatedDoc = {
      ...doc,
      title,
      updatedAt: new Date()
    };

    // Update in memory immediately for responsiveness
    setDocuments(prev =>
        prev.map(doc => doc.id && parseInt(doc.id) === id ? updatedDoc : doc)
    );

    // If this is the active document, update it
    if (activeDocument && activeDocument.id && parseInt(activeDocument.id) === id) {
      setActiveDocument(updatedDoc);
    }

    // Update tabs
    setOpenTabs(prev =>
        prev.map(tab =>
            tab.documentId === id ? { ...tab, title } : tab
        )
    );

    // Save to storage
    await saveDocument(updatedDoc);
  };

  const updateDocumentTags = async (id: number, tags: string[]): Promise<void> => {
    // Find the document
    const doc = documents.find(d => d.id && parseInt(d.id) === id);
    if (!doc) return;

    // Update document with new tags
    const updatedDoc = {
      ...doc,
      tags,
      updatedAt: new Date()
    };

    // Update in memory immediately
    setDocuments(prev =>
        prev.map(doc => doc.id && parseInt(doc.id) === id ? updatedDoc : doc)
    );

    // If this is the active document, update it
    if (activeDocument && activeDocument.id && parseInt(activeDocument.id) === id) {
      setActiveDocument(updatedDoc);
    }

    // Save to storage
    await saveDocument(updatedDoc);
  };

  const switchTab = (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);

      if (tab.documentId) {
        const doc = documents.find(d => d.id && parseInt(d.id) === tab.documentId);
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
        const doc = documents.find(d => d.id && parseInt(d.id) === tab.documentId);
        if (doc) {
          await saveDocument(doc);
        }
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
          const doc = documents.find(d => d.id && parseInt(d.id) === lastTab.documentId);
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
    if (!query.trim()) return [];

    // First search in memory for better performance
    const inMemoryResults = documents.filter(doc =>
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
    );

    // If there are too few results, also search in storage
    if (inMemoryResults.length < 5) {
      const storageResults = await StorageService.searchDocuments(query);

      // Merge results and remove duplicates
      const allResults = [...inMemoryResults];
      for (const doc of storageResults) {
        if (!allResults.some(d => d.id === doc.id)) {
          allResults.push(doc);
        }
      }

      return allResults;
    }

    return inMemoryResults;
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
    updateDocumentTitle,
    updateDocumentTags,
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
