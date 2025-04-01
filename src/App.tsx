import { useState, useEffect, useRef } from 'react';
import './App.css';

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

// Helper function to load documents from localStorage
const loadDocumentsFromStorage = (): Document[] => {
  try {
    const savedDocs = localStorage.getItem('engineer-notepad-docs');
    if (savedDocs) {
      return JSON.parse(savedDocs).map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt)
      }));
    }
  } catch (e) {
    console.error('Error loading documents from localStorage:', e);
  }
  return [];
};

function App() {
  // State for documents and UI - initialize from localStorage
  const [documents, setDocuments] = useState<Document[]>(loadDocumentsFromStorage());
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'editor'>('files');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('engineer-notepad-docs', JSON.stringify(documents));
    } catch (e) {
      console.error('Error saving documents to localStorage:', e);
    }
  }, [documents]);

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
    setActiveTab('editor');
  };

  // Update the active document
  const updateDocument = (content: string) => {
    if (!activeDoc) return;
    
    const updatedDoc = {
      ...activeDoc,
      content,
      updatedAt: new Date()
    };
    
    setActiveDoc(updatedDoc);
    setDocuments(documents.map(doc => 
      doc.id === activeDoc.id ? updatedDoc : doc
    ));
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
  };

  // Delete a document
  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    if (activeDoc && activeDoc.id === id) {
      setActiveDoc(null);
      setActiveTab('files');
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
    a.download = `${activeDoc.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Focus the editor when a document is opened
  useEffect(() => {
    if (activeTab === 'editor' && editorRef.current) {
      editorRef.current.focus();
    }
  }, [activeTab, activeDoc]);

  // Render the UI
  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <h1>Engineer's Notepad</h1>
        <div className="header-buttons">
          <button onClick={toggleDarkMode}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          {activeDoc && (
            <button onClick={exportDocument}>Export</button>
          )}
        </div>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Documents</h2>
            <div className="new-doc-dropdown">
              <button className="new-doc-button">New +</button>
              <div className="dropdown-content">
                <button onClick={() => createDocument('text')}>Text File</button>
                <button onClick={() => createDocument('markdown')}>Markdown</button>
                <button onClick={() => createDocument('javascript')}>JavaScript</button>
                <button onClick={() => createDocument('python')}>Python</button>
                <button onClick={() => createDocument('html')}>HTML</button>
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
                  className={`document-item ${activeDoc?.id === doc.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveDoc(doc);
                    setActiveTab('editor');
                  }}
                >
                  <span className="doc-title">{doc.title}</span>
                  <span className="doc-type">{doc.type}</span>
                  <button 
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this document?')) {
                        deleteDocument(doc.id);
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="editor-area">
          {activeDoc ? (
            <>
              <div className="editor-header">
                <input
                  type="text"
                  value={activeDoc.title}
                  onChange={(e) => updateDocumentTitle(e.target.value)}
                  className="doc-title-input"
                />
                <div className="doc-meta">
                  <span>Type: {activeDoc.type}</span>
                  <span>Last modified: {activeDoc.updatedAt.toLocaleString()}</span>
                </div>
              </div>
              <textarea
                ref={editorRef}
                value={activeDoc.content}
                onChange={(e) => updateDocument(e.target.value)}
                className={`editor-textarea ${activeDoc.type}`}
                placeholder="Start typing here..."
              />
            </>
          ) : (
            <div className="welcome-screen">
              <h2>Welcome to Engineer's Notepad</h2>
              <p>Select a document from the sidebar or create a new one to get started.</p>
              <div className="quick-actions">
                <button onClick={() => createDocument('text')}>New Text File</button>
                <button onClick={() => createDocument('markdown')}>New Markdown</button>
                <button onClick={() => createDocument('javascript')}>New JavaScript</button>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="app-footer">
        <p>Engineer's Notepad | Offline Mode | All your data is stored locally in your browser</p>
      </footer>
    </div>
  );
}

export default App;
