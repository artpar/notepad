// src/components/Layout/AppLayout.tsx
import React from 'react';
import Sidebar from './Sidebar';
import Tabs from './Tabs';
import { useSettings } from '../../contexts/SettingsContext';
import CodeEditor from '../Editor/CodeEditor';
import MarkdownEditor from '../Editor/MarkdownEditor';
import Terminal from '../Tools/Terminal';
import DiagramTool from '../Tools/DiagramTool';
import {useDocuments} from "../../contexts/UseDocuments.tsx";

const AppLayout: React.FC = () => {
  const { currentTheme } = useSettings();
  const {
    activeDocument,
    openTabs,
    activeTabId,
    updateDocument,
    switchTab,
    closeTab
  } = useDocuments();

  const renderActiveContent = () => {
    if (!activeTabId) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-4">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Engineer's Notepad</h2>
            <p className="mb-4">Create a new document or open an existing one to get started.</p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => {
                // Create a new document
                // This is just a placeholder - it will be connected to the actual createDocument action
                console.log('Create new document');
              }}
            >
              Create New Document
            </button>
          </div>
        </div>
      );
    }

    const activeTab = openTabs.find(tab => tab.id === activeTabId);

    if (!activeTab) {
      return <div>Invalid tab selected</div>;
    }

    if (activeTab.type === 'terminal') {
      return <Terminal />;
    }

    if (activeTab.type === 'diagram') {
      return <DiagramTool />;
    }

    if (activeTab.documentId && activeDocument) {
      switch (activeDocument.type) {
        case 'code':
          return (
            <CodeEditor
              content={activeDocument.content}
              language={activeDocument.language || 'javascript'}
              onChange={(content) => updateDocument(activeDocument.id!, content)}
            />
          );
        case 'markdown':
          return (
            <MarkdownEditor
              content={activeDocument.content}
              onChange={(content) => updateDocument(activeDocument.id!, content)}
            />
          );
        case 'text':
          return (
            <CodeEditor
              content={activeDocument.content}
              language="plaintext"
              onChange={(content) => updateDocument(activeDocument.id!, content)}
            />
          );
        default:
          return <div>Unsupported document type</div>;
      }
    }

    return <div>No content available</div>;
  };

  return (
    <div
      className="flex h-screen"
      style={{
        backgroundColor: currentTheme.colors.background,
        color: currentTheme.colors.foreground
      }}
    >
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Tabs
          tabs={openTabs}
          activeTabId={activeTabId}
          onTabClick={switchTab}
          onTabClose={closeTab}
        />

        <div className="flex-1 overflow-hidden">
          {renderActiveContent()}
        </div>

        <div
          className="h-6 text-xs px-2 flex items-center justify-between"
          style={{
            backgroundColor: currentTheme.colors.sidebar,
            borderTop: `1px solid ${currentTheme.colors.border}`
          }}
        >
          <div className="flex items-center space-x-4">
            {activeDocument && (
              <>
                <span>
                  {activeDocument.type.toUpperCase()}
                  {activeDocument.language && ` - ${activeDocument.language}`}
                </span>
                <span>
                  Last modified: {new Date(activeDocument.updatedAt).toLocaleString()}
                </span>
              </>
            )}
          </div>
          <div>Offline Mode</div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
