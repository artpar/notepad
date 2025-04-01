// src/components/UI/Sidebar.tsx
import React, { useState } from 'react';
import { Document } from '../../types/document';

type DocType = 'text' | 'markdown' | 'javascript' | 'python' | 'html';

interface SidebarProps {
  documents: Document[];
  activeDoc: Document | null;
  onSelectDocument: (doc: Document) => void;
  onCreateDocument: (type: DocType) => void;
  onDeleteDocument: (id: string) => void;
  onUpdateTitle: (title: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  documents,
  activeDoc,
  onSelectDocument,
  onCreateDocument,
  onDeleteDocument,
  onUpdateTitle
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  return (
    <div 
      className={`sidebar-container transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-64'
      } bg-gray-100 dark:bg-gray-800 flex flex-col h-full border-r border-gray-200 dark:border-gray-700`}
      onMouseEnter={() => !isPinned && !isCollapsed && setIsCollapsed(false)}
      onMouseLeave={() => !isPinned && setIsCollapsed(true)}
    >
      <div className="sidebar-header flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && <h3 className="text-lg font-semibold">Explorer</h3>}
        <div className="flex items-center">
          <button 
            onClick={togglePin} 
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              {isPinned ? (
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              ) : (
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" fillOpacity="0.5" />
              )}
            </svg>
          </button>
          <button 
            onClick={toggleCollapse} 
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ml-1"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              {isCollapsed ? (
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-auto">
            <div className="explorer-wrapper h-1/2 overflow-auto">
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
            </div>
            <div className="properties-wrapper h-1/2 overflow-auto border-t border-gray-200 dark:border-gray-700">
              <div className="properties-container">
                {!activeDoc ? (
                  <div className="properties-container empty">No document selected</div>
                ) : (
                  <>
                    <div className="property-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={activeDoc.title}
                        onChange={(e) => onUpdateTitle(e.target.value)}
                        className="property-input"
                      />
                    </div>
                    <div className="property-group">
                      <label>Type</label>
                      <div className="property-value">{activeDoc.type}</div>
                    </div>
                    <div className="property-group">
                      <label>Created</label>
                      <div className="property-value">{activeDoc.createdAt.toLocaleString()}</div>
                    </div>
                    <div className="property-group">
                      <label>Modified</label>
                      <div className="property-value">{activeDoc.updatedAt.toLocaleString()}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;