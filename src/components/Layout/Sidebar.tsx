// src/components/Layout/Sidebar.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import useDocumentActions from '../../hooks/useDocumentActions';
import { Document } from '../../types/document';
import DocumentItem from './DocumentItem';
import SearchBar from '../UI/SearchBar';
import ConfirmationModal from '../UI/ConfirmationModal';
import ContextMenu from '../UI/ContextMenu';
import { IconButton, MenuButton } from '../UI/Buttons';
import DocumentTypeMenu from '../UI/DocumentTypeMenu';
import TagSelector from '../UI/TagSelector';
import 'remixicon/fonts/remixicon.css';
import {useDocuments} from "../../contexts/UseDocuments.tsx";
import {DocumentType} from "../../types/DocumentType.tsx";

enum SidebarTab {
  Files = 'files',
  Search = 'search',
  Settings = 'settings'
}

interface SidebarProps {
  onToggleSidebar: () => void;
  onSelectDocument?: (doc: Document) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggleSidebar, onSelectDocument }) => {
  const { currentTheme } = useSettings();
  const {
    documents,
    activeDocument,
    openDocument,
    createDocument,
    closeDocument,
    updateDocumentTitle,
    updateDocumentTags,
    searchDocuments
  } = useDocuments();
  const { getDocumentIcon } = useDocumentActions();

  // State
  const [activeTab, setActiveTab] = useState<SidebarTab>(SidebarTab.Files);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [width, setWidth] = useState(260); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [documentToRename, setDocumentToRename] = useState<Document | null>(null);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'name' | 'date' | 'type'>('date');

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number } | null;
    document: Document | null
  }>({
    position: null,
    document: null
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        searchDocuments(searchQuery)
          .then(results => {
            setSearchResults(results);
            setIsSearching(false);
          })
          .catch(() => setIsSearching(false));
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchDocuments]);

  // Define document tags
  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach(doc => {
      doc.tags?.forEach(tag => tagSet.add(tag));
      tagSet.add(doc.type.type);
      if (doc.type.type === 'code' && doc.language) {
        tagSet.add(doc.language);
      }
    });
    return Array.from(tagSet);
  }, [documents]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    // If we're searching, return search results
    if (activeTab === SidebarTab.Search && searchQuery) {
      return searchResults;
    }

    let filtered = [...documents];

    // Apply search filter in Files tab
    if (activeTab === SidebarTab.Files && searchQuery) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.language && doc.language.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Apply tag filter
    if (filterTag) {
      filtered = filtered.filter(doc =>
        doc.type.type === filterTag ||
        doc.language === filterTag ||
        (doc.tags && doc.tags.includes(filterTag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'type':
          return a.type.type.localeCompare(b.type);
        case 'date':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return filtered;
  }, [documents, searchQuery, filterTag, sortOption, activeTab, searchResults]);

  // Handle document creation
  const handleNewFile = useCallback((type: string, language?: string) => {
    createDocument({type: type} as DocumentType, language);
    setCreateMenuOpen(false);
  }, [createDocument]);

  // Handle document deletion
  const handleDeleteDocument = useCallback((doc: Document) => {
    setDocumentToDelete(doc);
  }, []);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(() => {
    if (documentToDelete && documentToDelete.id) {
      closeDocument(documentToDelete.id);
      setDocumentToDelete(null);
    }
  }, [documentToDelete, closeDocument]);

  // Handle rename confirmation
  const handleConfirmRename = useCallback(() => {
    if (documentToRename && documentToRename.id && newDocumentTitle.trim()) {
      updateDocumentTitle(documentToRename.id, newDocumentTitle);
      setDocumentToRename(null);
    }
  }, [documentToRename, newDocumentTitle, updateDocumentTitle]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, doc: Document) => {
    e.preventDefault();
    setContextMenu({
      position: {x: e.clientX, y: e.clientY},
      document: doc
    });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu({position: null, document: null});
  }, []);

  // Get context menu items
  const getContextMenuItems = useMemo(() => {
    if (!contextMenu.document) return [];

    return [
      {
        id: 'open',
        label: 'Open',
        icon: 'ri-file-line',
        action: () => onSelectDocument && onSelectDocument(contextMenu.document!),
        shortcut: '↵'
      },
      {
        id: 'rename',
        label: 'Rename',
        icon: 'ri-edit-line',
        action: () => {
          setNewDocumentTitle(contextMenu.document!.title);
          setDocumentToRename(contextMenu.document);
        }
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: 'ri-file-copy-line',
        action: () => {
          const docToDuplicate = contextMenu.document!;
          createDocument(
            docToDuplicate.type,
            docToDuplicate.language,
            docToDuplicate.content,
            `${docToDuplicate.title} (Copy)`
          );
        }
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'ri-delete-bin-line',
        action: () => handleDeleteDocument(contextMenu.document!),
        isDestructive: true
      }
    ];
  }, [contextMenu.document, onSelectDocument, createDocument, handleDeleteDocument]);

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      {/* Confirmation modals */}
      <ConfirmationModal
        isOpen={documentToDelete !== null}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        icon="ri-delete-bin-line"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDocumentToDelete(null)}
      />

      <ConfirmationModal
        isOpen={documentToRename !== null}
        title="Rename Document"
        message={
          <div>
            <p className="mb-2">Enter a new name for "{documentToRename?.title}"</p>
            <input
              type="text"
              className="w-full p-2 border rounded"
              style={{
                backgroundColor: currentTheme.colors.inputBackground,
                color: currentTheme.colors.inputText,
                borderColor: currentTheme.colors.border
              }}
              value={newDocumentTitle}
              onChange={(e) => setNewDocumentTitle(e.target.value)}
              autoFocus
            />
          </div>
        }
        confirmLabel="Rename"
        cancelLabel="Cancel"
        icon="ri-edit-line"
        onConfirm={handleConfirmRename}
        onCancel={() => setDocumentToRename(null)}
      />

      {/* Context Menu */}
      <ContextMenu
        items={getContextMenuItems}
        position={contextMenu.position}
        onClose={closeContextMenu}
      />

      {/* Main sidebar container */}
      <div
        ref={sidebarRef}
        className="sidebar flex flex-col h-full border-r"
        style={{
          width: `${width}px`,
          backgroundColor: currentTheme.colors.sidebar,
          color: currentTheme.colors.sidebarText,
          borderColor: currentTheme.colors.border
        }}
      >
        {/* Sidebar header */}
        <div className="sidebar-header flex items-center justify-between p-2 border-b"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <div className="flex items-center">
            <IconButton
              icon="menu-fold-line"
              onClick={onToggleSidebar}
              title="Hide Sidebar"
            />
            <h2 className="ml-2 font-medium">Documents</h2>
          </div>

          <div className="flex items-center">
            <MenuButton
              icon="add-line"
              isOpen={createMenuOpen}
              onClick={() => setCreateMenuOpen(!createMenuOpen)}
              title="Create New Document"
            >
              <DocumentTypeMenu onSelectType={handleNewFile} />
            </MenuButton>

            <IconButton
              icon={viewMode === 'list' ? 'list-check' : 'grid-fill'}
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
            />
          </div>
        </div>

        {/* Search bar */}
        <div className="p-2 border-b" style={{ borderColor: currentTheme.colors.border }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search documents..."
            onClear={() => setSearchQuery('')}
            isSearching={isSearching}
          />
        </div>

        {/* Tag filters */}
        <div className="p-2 border-b overflow-x-auto" style={{ borderColor: currentTheme.colors.border }}>
          <TagSelector
            tags={tags}
            selectedTag={filterTag}
            onSelectTag={(tag) => setFilterTag(tag === filterTag ? null : tag)}
          />
        </div>

        {/* Sort options */}
        <div className="p-2 border-b flex justify-between items-center" style={{ borderColor: currentTheme.colors.border }}>
          <span className="text-xs opacity-70">Sort by:</span>
          <div className="flex space-x-1">
            {(['date', 'name', 'type'] as const).map(option => (
              <button
                key={option}
                className={`px-2 py-1 text-xs rounded ${sortOption === option ? 'font-medium' : 'opacity-70'}`}
                style={{
                  backgroundColor: sortOption === option ? currentTheme.colors.buttonActiveBackground : 'transparent',
                }}
                onClick={() => setSortOption(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 opacity-70">
              <i className="ri-file-search-line text-3xl mb-2"></i>
              <p>{searchQuery ? 'No documents found' : 'No documents yet'}</p>
              {searchQuery && (
                <button
                  className="mt-2 px-3 py-1 rounded text-sm"
                  style={{
                    backgroundColor: currentTheme.colors.buttonBackground,
                    color: currentTheme.colors.buttonText
                  }}
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-1'}>
              {filteredDocuments.map(doc => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  isActive={activeDocument?.id === doc.id}
                  onClick={() => onSelectDocument && onSelectDocument(doc)}
                  onContextMenu={(e) => handleContextMenu(e, doc)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div
          ref={resizeRef}
          className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-opacity-50 hover:bg-gray-500"
          onMouseDown={() => setIsResizing(true)}
        />
      </div>
    </>
  );
};

export default Sidebar;
