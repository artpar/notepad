// src/App.tsx
import { useState, useEffect, useMemo } from 'react';
import './App.css';

import {
  DockviewReact,
  DockviewReadyEvent,
  IDockviewApi,
  PanelCollection,
  SerializedDockview
} from 'dockview';
import 'dockview/dist/styles/dockview.css';

// Import components
import DocumentEditorPanel from './components/Editor/DocumentEditorPanel';
import DocumentPreviewPanel from './components/Preview/DocumentPreviewPanel';
import ExplorerPanel from './components/Explorer/ExplorerPanel';
import PropertiesPanel from './components/Properties/PropertiesPanel';
import { CustomGroupPanel, CustomWatermarkPanel } from './components/Panels/CustomPanels';

// Types for our document system
type DocType = 'text' | 'markdown' | 'javascript' | 'python' | 'html';

interface Document {
  id: string;
  title: string;
  content: string;
  type: DocType;
  createdAt: Date;
  updatedAt: Date;
}

// Helper functions
import { loadDocumentsFromStorage, loadLayoutFromStorage } from './utils/storage';

function App() {
  // State for documents and UI
  const [documents, setDocuments] = useState<Document[]>(loadDocumentsFromStorage());
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dockviewApi, setDockviewApi] = useState<IDockviewApi | null>(null);
  const [savedLayout, setSavedLayout] = useState<SerializedDockview | undefined>(loadLayoutFromStorage());

  // Save documents to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('engineer-notepad-docs', JSON.stringify(documents));
    } catch (e) {
      console.error('Error saving documents to localStorage:', e);
    }
  }, [documents]);

  // Save layout to localStorage whenever it changes
  const saveLayout = () => {
    if (dockviewApi) {
      try {
        const layout = dockviewApi.toJSON();
        localStorage.setItem('engineer-notepad-layout', JSON.stringify(layout));
      } catch (e) {
        console.error('Error saving layout to localStorage:', e);
      }
    }
  };

  // Create a new document
  const createDocument = (type: DocType) => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: '',
      type,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setDocuments([...documents, newDoc]);
    setActiveDoc(newDoc);
    
    // Open the document in the editor
    if (dockviewApi) {
      dockviewApi.addPanel({
        id: `editor-${newDoc.id}`,
        component: 'documentEditor',
        params: {
          document: newDoc,
          onUpdate: (content: string) => updateDocument(newDoc.id, content)
        },
        title: newDoc.title
      });
    }
  };

  // Update document content
  const updateDocument = (id: string, content: string) => {
    const docToUpdate = documents.find(doc => doc.id === id);
    if (!docToUpdate) return;
    
    const updatedDoc = {
      ...docToUpdate,
      content,
      updatedAt: new Date()
    };
    
    setDocuments(documents.map(doc => 
      doc.id === id ? updatedDoc : doc
    ));
    
    if (activeDoc?.id === id) {
      setActiveDoc(updatedDoc);
    }
    
    // Update panel title if it exists
    if (dockviewApi) {
      const panel = dockviewApi.getPanel(`editor-${id}`);
      if (panel) {
        panel.setTitle(updatedDoc.title);
      }
    }
  };

  // Update document title
  const updateDocumentTitle = (title: string) => {
    if (!activeDoc) return;
    
    const updatedDoc = {
      ...activeDoc,
      title,
      updatedAt: new Date()
    };
    
    setActiveDoc(updatedDoc);
    setDocuments(documents.map(doc => 
      doc.id === activeDoc.id ? updatedDoc : doc
    ));
    
    // Update panel title if it exists
    if (dockviewApi) {
      const panel = dockviewApi.getPanel(`editor-${activeDoc.id}`);
      if (panel) {
        panel.setTitle(title);
      }
    }
  };

  // Delete a document
  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    
    if (activeDoc && activeDoc.id === id) {
      setActiveDoc(null);
    }
    
    // Close related panels if they exist
    if (dockviewApi) {
      const editorPanel = dockviewApi.getPanel(`editor-${id}`);
      if (editorPanel) {
        editorPanel.close();
      }
      
      const previewPanel = dockviewApi.getPanel(`preview-${id}`);
      if (previewPanel) {
        previewPanel.close();
      }
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Export the current document
  const exportDocument = () => {
    if (!activeDoc) return;
    
    const blob = new Blob([activeDoc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.title}.${getFileExtension(activeDoc.type)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get file extension based on document type
  const getFileExtension = (type: DocType): string => {
    switch (type) {
      case 'markdown': return 'md';
      case 'javascript': return 'js';
      case 'python': return 'py';
      case 'html': return 'html';
      default: return 'txt';
    }
  };

  // Open document in editor
  const openDocument = (doc: Document) => {
    setActiveDoc(doc);
    
    // Check if document is already open in editor
    if (dockviewApi) {
      const panel = dockviewApi.getPanel(`editor-${doc.id}`);
      if (panel) {
        panel.focus();
      } else {
        // Open new editor panel
        dockviewApi.addPanel({
          id: `editor-${doc.id}`,
          component: 'documentEditor',
          params: {
            document: doc,
            onUpdate: (content: string) => updateDocument(doc.id, content)
          },
          title: doc.title
        });
      }
    }
  };

  // Toggle preview for the current document
  const togglePreview = () => {
    if (!activeDoc || !dockviewApi) return;
    
    const previewPanelId = `preview-${activeDoc.id}`;
    const editorPanelId = `editor-${activeDoc.id}`;
    const existingPanel = dockviewApi.getPanel(previewPanelId);
    const editorPanel = dockviewApi.getPanel(editorPanelId);
    
    if (existingPanel) {
      existingPanel.close();
    } else {
      // Create panel config
      const panelConfig: any = {
        id: previewPanelId,
        component: 'documentPreview',
        params: { document: activeDoc },
        title: `Preview: ${activeDoc.title}`
      };
      
      // Only add position if editor panel exists
      if (editorPanel) {
        panelConfig.position = { 
          referencePanel: editorPanelId, 
          direction: 'right' 
        };
      }
      
      dockviewApi.addPanel(panelConfig);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save layout
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveLayout();
      }
      
      // Ctrl/Cmd + P: Toggle preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        togglePreview();
      }
      
      // Ctrl/Cmd + N: New document
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createDocument('text');
      }
      
      // Ctrl/Cmd + E: Export document
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportDocument();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDoc, dockviewApi]);

  // Components for the dockview
  const components = useMemo<PanelCollection>(() => ({
    documentEditor: DocumentEditorPanel,
    documentPreview: DocumentPreviewPanel,
    explorer: ExplorerPanel,
    properties: PropertiesPanel
  }), []);

  // Handle dockview ready event
  const handleDockviewReady = (event: DockviewReadyEvent) => {
    setDockviewApi(event.api);
    
    // If we have a saved layout, restore it
    if (savedLayout) {
      try {
        event.api.fromJSON(savedLayout);
      } catch (e) {
        console.error('Error restoring layout:', e);
        initializeDefaultLayout(event.api);
      }
    } else {
      initializeDefaultLayout(event.api);
    }
    
    // Save layout when panels are moved or resized
    event.api.onDidLayoutChange(() => {
      saveLayout();
    });
  };

  // Initialize default layout
  const initializeDefaultLayout = (api: IDockviewApi) => {
    // Add explorer panel
    api.addPanel({
      id: 'explorer',
      component: 'explorer',
      params: {
        documents,
        onSelectDocument: openDocument,
        onCreateDocument: createDocument,
        onDeleteDocument: deleteDocument
      },
      title: 'Explorer',
      position: { direction: 'left', size: 250 }
    });
    
    // Add properties panel
    api.addPanel({
      id: 'properties',
      component: 'properties',
      params: {
        document: activeDoc,
        onUpdateTitle: updateDocumentTitle
      },
      title: 'Properties',
      position: { direction: 'bottom', size: 200, referencePanel: 'explorer' }
    });
    
    // If we have an active document, open it
    if (activeDoc) {
      api.addPanel({
        id: `editor-${activeDoc.id}`,
        component: 'documentEditor',
        params: {
          document: activeDoc,
          onUpdate: (content: string) => updateDocument(activeDoc.id, content)
        },
        title: activeDoc.title
      });
    }
  };

  // Update properties panel when active document changes
  useEffect(() => {
    if (dockviewApi) {
      const propertiesPanel = dockviewApi.getPanel('properties');
      if (propertiesPanel) {
        propertiesPanel.api.updateParameters({
          document: activeDoc,
          onUpdateTitle: updateDocumentTitle
        });
      }
      
      // Also update explorer panel when documents change
      const explorerPanel = dockviewApi.getPanel('explorer');
      if (explorerPanel) {
        explorerPanel.api.updateParameters({
          documents,
          onSelectDocument: openDocument,
          onCreateDocument: createDocument,
          onDeleteDocument: deleteDocument
        });
      }
    }
  }, [activeDoc, documents, dockviewApi]);

  // Render the UI
  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <h1>Engineer's Notepad</h1>
        <div className="header-controls">
          <div className="header-buttons">
            <button onClick={toggleDarkMode}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button onClick={saveLayout} title="Save Layout (Ctrl+S)">
              Save Layout
            </button>
            {activeDoc && (
              <>
                <button onClick={togglePreview} title="Toggle Preview (Ctrl+P)">
                  Toggle Preview
                </button>
                <button onClick={exportDocument} title="Export Document (Ctrl+E)">
                  Export
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="app-content">
        <DockviewReact
          components={components}
          onReady={handleDockviewReady}
          watermarkComponent={CustomWatermarkPanel}
          groupPanel={CustomGroupPanel}
          className="dockview-theme-light"
        />
      </div>

      <footer className="app-footer">
        <p>Engineer's Notepad | Keyboard Shortcuts: Ctrl+S (Save Layout), Ctrl+P (Preview), Ctrl+N (New), Ctrl+E (Export)</p>
      </footer>
    </div>
  );
}

export default App;