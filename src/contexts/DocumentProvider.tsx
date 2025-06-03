import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Document, DocumentState } from '../types/document';
import { TabInfo } from '../types/ui';
import * as StorageService from '../services/storage';
import * as TabStateService from '../services/tabStateService';
import { DocumentType } from '../types/DocumentType';
import { CodeLanguage } from '../types/document';

interface DocumentContextType {
  // State
  documents: Document[];
  activeDocument: Document | null;
  documentStates: Record<number, DocumentState>;
  openTabs: TabInfo[];
  activeTabId: string | null;
  isLoading: boolean;

  // Actions
  createDocument: (type: DocumentType, language?: string, content?: string, title?: string) => Promise<number>;
  openDocument: (id: number) => Promise<void>;
  closeDocument: (id: number) => Promise<void>;
  updateDocumentTitle: (id: number, title: string) => Promise<void>;
  updateDocumentTags: (id: number, tags: string[]) => Promise<void>;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  searchDocuments: (query: string) => Promise<Document[]>;
  
  // New simplified update method that doesn't handle saving
  setDocumentContent: (id: number, content: string) => void;
  setDocumentState: (id: number, state: Partial<DocumentState>) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [documentStates, setDocumentStates] = useState<Record<number, DocumentState>>({});
  const [openTabs, setOpenTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await StorageService.getAllDocuments();
        setDocuments(docs);
        
        // Load saved tab state
        const savedTabState = TabStateService.loadTabState();
        if (savedTabState && savedTabState.openTabs.length > 0) {
          // Filter out tabs for documents that no longer exist
          const validTabs = savedTabState.openTabs.filter(tab => 
            tab.documentId && docs.some(doc => doc.id === String(tab.documentId))
          );
          
          if (validTabs.length > 0) {
            setOpenTabs(validTabs);
            
            // Restore active tab if it exists
            if (savedTabState.activeTabId && validTabs.some(tab => tab.id === savedTabState.activeTabId)) {
              setActiveTabId(savedTabState.activeTabId);
              
              // Set the active document
              const activeTab = validTabs.find(tab => tab.id === savedTabState.activeTabId);
              if (activeTab && activeTab.documentId) {
                const activeDoc = docs.find(doc => doc.id === String(activeTab.documentId));
                if (activeDoc) {
                  setActiveDocument(activeDoc);
                }
              }
            } else if (validTabs.length > 0) {
              // If saved active tab doesn't exist, use the first tab
              const firstTab = validTabs[0];
              setActiveTabId(firstTab.id);
              if (firstTab.documentId) {
                const doc = docs.find(d => d.id === String(firstTab.documentId));
                if (doc) {
                  setActiveDocument(doc);
                }
              }
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load documents:', error);
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Save tab state whenever tabs or active tab changes
  useEffect(() => {
    // Don't save during initial load
    if (!isLoading) {
      TabStateService.saveTabState(openTabs, activeTabId);
    }
  }, [openTabs, activeTabId, isLoading]);

  // Create a new document
  const createDocument = useCallback(async (
    type: DocumentType,
    language?: string,
    content?: string,
    title?: string
  ): Promise<number> => {
    // Generate unique title
    const baseName = title || (
      type.type === 'markdown' ? 'Untitled Document' :
      type.type === 'javascript' ? 'Untitled Script' :
      type.type === 'python' ? 'Untitled Script' :
      type.type === 'html' ? 'Untitled Page' : 'Untitled'
    );

    let finalTitle = baseName;
    let counter = 1;
    while (documents.some(doc => doc.title === finalTitle)) {
      finalTitle = `${baseName} ${counter++}`;
    }

    const newDoc: Document = {
      title: finalTitle,
      content: content || '',
      type,
      language: language as CodeLanguage,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    };

    const id = await StorageService.saveDocument(newDoc);
    newDoc.id = String(id);

    // Update state
    setDocuments(prev => [...prev, newDoc]);
    
    // Create and activate tab
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
    
    // Initialize document state
    setDocumentStates(prev => ({
      ...prev,
      [id]: { isDirty: false, isSaving: false }
    }));

    return id;
  }, [documents]);

  // Open an existing document
  const openDocument = useCallback(async (id: number): Promise<void> => {
    // Check if already open
    const existingTab = openTabs.find(tab => tab.documentId === id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      const doc = documents.find(d => d.id === String(id));
      if (doc) {
        setActiveDocument(doc);
      }
      return;
    }

    // Load document
    let document = documents.find(d => d.id === String(id));
    if (!document) {
      document = await StorageService.getDocument(id);
      if (document) {
        // Check again to prevent race conditions
        setDocuments(prev => {
          const exists = prev.some(d => d.id === String(id));
          if (exists) {
            return prev;
          }
          return [...prev, document!];
        });
      }
    }

    if (document) {
      // Create tab
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

      // Initialize state if needed
      if (!documentStates[id]) {
        setDocumentStates(prev => ({
          ...prev,
          [id]: { isDirty: false, isSaving: false }
        }));
      }
    }
  }, [documents, openTabs, documentStates]);

  // Close document
  const closeDocument = useCallback(async (id: number): Promise<void> => {
    // Remove tabs for this document
    const updatedTabs = openTabs.filter(tab => tab.documentId !== id);
    setOpenTabs(updatedTabs);

    // Update active document if needed
    if (activeDocument?.id === String(id)) {
      if (updatedTabs.length > 0) {
        const lastTab = updatedTabs[updatedTabs.length - 1];
        setActiveTabId(lastTab.id);
        if (lastTab.documentId) {
          const doc = documents.find(d => d.id === String(lastTab.documentId));
          setActiveDocument(doc || null);
        }
      } else {
        setActiveTabId(null);
        setActiveDocument(null);
      }
    }
  }, [openTabs, activeDocument, documents]);

  // Update document content (without saving)
  const setDocumentContent = useCallback((id: number, content: string) => {
    setDocuments(prev => {
      const index = prev.findIndex(doc => doc.id === String(id));
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          content,
          updatedAt: new Date()
        };
        
        // Update active document if it's the one being edited
        if (activeDocument?.id === String(id)) {
          setActiveDocument(updated[index]);
        }
        
        return updated;
      }
      return prev;
    });
  }, [activeDocument]);

  // Update document state
  const setDocumentState = useCallback((id: number, state: Partial<DocumentState>) => {
    setDocumentStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...state }
    }));
    
    // Update tab dirty state if needed
    if ('isDirty' in state) {
      setOpenTabs(prev => prev.map(tab => 
        tab.documentId === id ? { ...tab, isDirty: state.isDirty! } : tab
      ));
    }
  }, []);

  // Update document title
  const updateDocumentTitle = useCallback(async (id: number, title: string): Promise<void> => {
    const doc = documents.find(d => d.id === String(id));
    if (!doc) return;

    const updatedDoc = {
      ...doc,
      title,
      updatedAt: new Date()
    };

    // Update in memory
    setDocuments(prev => prev.map(d => d.id === String(id) ? updatedDoc : d));
    
    if (activeDocument?.id === String(id)) {
      setActiveDocument(updatedDoc);
    }

    // Update tab
    setOpenTabs(prev => prev.map(tab => 
      tab.documentId === id ? { ...tab, title } : tab
    ));

    // Save to storage
    await StorageService.saveDocument(updatedDoc);
  }, [documents, activeDocument]);

  // Update document tags
  const updateDocumentTags = useCallback(async (id: number, tags: string[]): Promise<void> => {
    const doc = documents.find(d => d.id === String(id));
    if (!doc) return;

    const updatedDoc = {
      ...doc,
      tags,
      updatedAt: new Date()
    };

    // Update in memory
    setDocuments(prev => prev.map(d => d.id === String(id) ? updatedDoc : d));
    
    if (activeDocument?.id === String(id)) {
      setActiveDocument(updatedDoc);
    }

    // Save to storage
    await StorageService.saveDocument(updatedDoc);
  }, [documents, activeDocument]);

  // Switch tabs
  const switchTab = useCallback((tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      if (tab.documentId) {
        const doc = documents.find(d => d.id === String(tab.documentId));
        setActiveDocument(doc || null);
      }
    }
  }, [openTabs, documents]);

  // Close tab
  const closeTab = useCallback((tabId: string) => {
    const updatedTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(updatedTabs);

    // Update active tab if needed
    if (activeTabId === tabId) {
      if (updatedTabs.length > 0) {
        const lastTab = updatedTabs[updatedTabs.length - 1];
        switchTab(lastTab.id);
      } else {
        setActiveTabId(null);
        setActiveDocument(null);
      }
    }
  }, [openTabs, activeTabId, switchTab]);

  // Search documents
  const searchDocuments = useCallback(async (query: string): Promise<Document[]> => {
    if (!query.trim()) return [];

    // Search in memory first
    const results = documents.filter(doc =>
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.content.toLowerCase().includes(query.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    return results;
  }, [documents]);

  const value = {
    documents,
    activeDocument,
    documentStates,
    openTabs,
    activeTabId,
    isLoading,
    createDocument,
    openDocument,
    closeDocument,
    updateDocumentTitle,
    updateDocumentTags,
    switchTab,
    closeTab,
    searchDocuments,
    setDocumentContent,
    setDocumentState
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = React.useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

export default DocumentContext;