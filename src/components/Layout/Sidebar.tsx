// src/components/Layout/Sidebar.tsx
import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useDocuments } from '../../contexts/DocumentContext';
import { Document } from '../../types/document';
import PropertiesPanel from '../Properties/PropertiesPanel';
import 'remixicon/fonts/remixicon.css';

enum SidebarTab {
  Files = 'files',
  Properties = 'properties',
  Search = 'search',
  Settings = 'settings'
}

interface SidebarProps {
  documents: Document[];
  activeDoc: Document | null;
  onSelectDocument: (doc: Document) => void;
  onCreateDocument: (type: string, language?: string) => void;
  onDeleteDocument: (id: number) => void;
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
  const { currentTheme, toggleTheme, settings, updateEditorSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<SidebarTab>(SidebarTab.Files);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await results.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      // For offline app, we would implement a client-side search
      // This is just a placeholder
    }
  };

  const handleNewFile = (type: 'text' | 'markdown' | 'code', language?: string) => {
    onCreateDocument(type, language);
  };

  return (
    <div
      className="w-64 h-full flex flex-col"
      style={{
        backgroundColor: currentTheme.colors.sidebar,
        borderRight: `1px solid ${currentTheme.colors.border}`
      }}
    >
      <div className="p-3 flex justify-between items-center">
        <button
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          <i className={`ri-${settings.theme === 'dark' ? 'sun' : 'moon'}-line text-lg`}></i>
        </button>
      </div>

      <div className="flex border-b">
        <button
          className={`flex-1 p-2 text-center ${activeTab === SidebarTab.Files ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab(SidebarTab.Files)}
        >
          Files
        </button>
        <button
          className={`flex-1 p-2 text-center ${activeTab === SidebarTab.Properties ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab(SidebarTab.Properties)}
        >
          Properties
        </button>
        <button
          className={`flex-1 p-2 text-center ${activeTab === SidebarTab.Search ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab(SidebarTab.Search)}
        >
          Search
        </button>
        <button
          className={`flex-1 p-2 text-center ${activeTab === SidebarTab.Settings ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab(SidebarTab.Settings)}
        >
          Settings
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === SidebarTab.Files && (
          <div className="p-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Documents</h2>
              <div className="dropdown relative">
                <button className="px-2 py-1 rounded border hover:bg-gray-200 dark:hover:bg-gray-700">
                  <i className="ri-add-line mr-1"></i>New
                </button>
                <div className="dropdown-menu absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded border hidden">
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleNewFile('text')}
                  >
                    <i className="ri-file-text-line mr-2"></i>Text File
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleNewFile('markdown')}
                  >
                    <i className="ri-markdown-line mr-2"></i>Markdown
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleNewFile('code', 'javascript')}
                  >
                    <i className="ri-javascript-line mr-2"></i>JavaScript
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleNewFile('code', 'python')}
                  >
                    <i className="ri-code-line mr-2"></i>Python
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleNewFile('code', 'html')}
                  >
                    <i className="ri-html5-line mr-2"></i>HTML
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {documents && documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer flex items-center"
                  onClick={() => onSelectDocument(doc)}
                >
                  <i className={`mr-2 ${
                    doc.type === 'text' ? 'ri-file-text-line' : 
                    doc.type === 'markdown' ? 'ri-markdown-line' : 
                    doc.type === 'code' && doc.language === 'javascript' ? 'ri-javascript-line' :
                    doc.type === 'code' && doc.language === 'python' ? 'ri-code-line' :
                    doc.type === 'code' && doc.language === 'html' ? 'ri-html5-line' :
                    'ri-file-code-line'
                  }`}></i>
                  <span className="truncate flex-1">{doc.title}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    {doc.type === 'code' ? doc.language : doc.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === SidebarTab.Properties && (
          <div className="p-2">
            <h2 className="font-semibold mb-2">Properties</h2>
            <PropertiesPanel
              params={{
                document: activeDoc,
                onUpdateTitle: onUpdateTitle
              }}
            />
          </div>
        )}

        {activeTab === SidebarTab.Search && (
          <div className="p-2">
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full p-2 border rounded"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="absolute right-3 top-3 text-gray-500"
              >
                <i className="ri-search-line"></i>
              </button>
            </div>

            <div className="space-y-1">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                  onClick={() => onDeleteDocument(result.id!)}
                >
                  <div className="font-medium">{result.title}</div>
                  <div className="text-xs text-gray-500">
                    {result.type === 'code' ? result.language : result.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === SidebarTab.Settings && (
          <div className="p-2">
            <div className="mb-4">
              <h2 className="font-semibold mb-2">Appearance</h2>
              <div className="flex items-center justify-between mb-2">
                <label>Theme</label>
                <button
                  className="px-2 py-1 border rounded"
                  onClick={toggleTheme}
                >
                  {settings.theme === 'light' ? 'Light' :
                   settings.theme === 'dark' ? 'Dark' : 'System'}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="font-semibold mb-2">Editor</h2>
              <div className="mb-2">
                <label className="block mb-1">Font Size</label>
                <input
                  type="number"
                  className="w-full p-1 border rounded"
                  value={settings.editor.fontSize}
                  onChange={(e) => updateEditorSettings({
                    fontSize: parseInt(e.target.value)
                  })}
                  min={8}
                  max={32}
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Tab Size</label>
                <input
                  type="number"
                  className="w-full p-1 border rounded"
                  value={settings.editor.tabSize}
                  onChange={(e) => updateEditorSettings({
                    tabSize: parseInt(e.target.value)
                  })}
                  min={1}
                  max={8}
                />
              </div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="wordWrap"
                  checked={settings.editor.wordWrap}
                  onChange={(e) => updateEditorSettings({
                    wordWrap: e.target.checked
                  })}
                  className="mr-2"
                />
                <label htmlFor="wordWrap">Word Wrap</label>
              </div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="lineNumbers"
                  checked={settings.editor.lineNumbers}
                  onChange={(e) => updateEditorSettings({
                    lineNumbers: e.target.checked
                  })}
                  className="mr-2"
                />
                <label htmlFor="lineNumbers">Line Numbers</label>
              </div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="indentWithTabs"
                  checked={settings.editor.indentWithTabs}
                  onChange={(e) => updateEditorSettings({
                    indentWithTabs: e.target.checked
                  })}
                  className="mr-2"
                />
                <label htmlFor="indentWithTabs">Indent with Tabs</label>
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-2">About</h2>
              <p className="text-sm">
                Engineer's Notepad v1.0
                <br />
                Local-first offline application
                <br />
                All data stored in your browser
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
