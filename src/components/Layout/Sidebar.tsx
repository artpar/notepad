// src/components/Layout/Sidebar.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useSettings} from '../../contexts/SettingsContext';
import {Document} from '../../types/document';
import DocumentItem from './DocumentItem';
import SearchBar from '../UI/SearchBar';
import ConfirmationModal from '../UI/ConfirmationModal';
import ContextMenu from '../UI/ContextMenu';
import {IconButton, MenuButton} from '../UI/Buttons';
import DocumentTypeMenu from '../UI/DocumentTypeMenu';
import HelpMenu from '../UI/HelpMenu';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import 'remixicon/fonts/remixicon.css';
import {useDocuments} from "../../contexts/DocumentProvider.tsx";
import {DocumentType} from "../../types/DocumentType.tsx";
import {useToast} from '../UI/ToastSystem';

interface SidebarProps {
    onToggleSidebar: () => void;
    onSelectDocument?: (doc: Document) => void;
}

const Sidebar: React.FC<SidebarProps> = ({onToggleSidebar, onSelectDocument}) => {
    const {currentTheme, toggleTheme, settings} = useSettings();
    const {
        documents,
        activeDocument,
        createDocument,
        closeDocument,
        updateDocumentTitle,
        searchDocuments,
        saveDocument,
        documentStates
    } = useDocuments();
    const {getShortcutKey} = useKeyboardShortcuts();
    const {showToast} = useToast();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Document[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [width, setWidth] = useState(260);
    const [isResizing, setIsResizing] = useState(false);
    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [documentToRename, setDocumentToRename] = useState<Document | null>(null);
    const [newDocumentTitle, setNewDocumentTitle] = useState('');
    const [sortOption, setSortOption] = useState<'name' | 'date' | 'type'>('date');
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    // Refs
    const sidebarRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<HTMLDivElement>(null);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        position: { x: number; y: number } | null; document: Document | null
    }>({
        position: null, document: null
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

    // Get unique tags from documents
    const tags = useMemo(() => {
        const tagSet = new Set<string>();
        documents.forEach(doc => {
            doc.tags?.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet);
    }, [documents]);

    // Filter and sort documents
    const filteredDocuments = useMemo(() => {
        let filtered = searchQuery ? searchResults : [...documents];

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortOption) {
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'type':
                    const aType = typeof a.type === 'string' ? a.type : a.type?.type || 'text';
                    const bType = typeof b.type === 'string' ? b.type : b.type?.type || 'text';
                    return aType.localeCompare(bType);
                case 'date':
                default:
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
        });

        return filtered;
    }, [documents, searchQuery, sortOption, searchResults]);

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
            position: {x: e.clientX, y: e.clientY}, document: doc
        });
    }, []);

    // Close context menu
    const closeContextMenu = useCallback(() => {
        setContextMenu({position: null, document: null});
    }, []);

    // Handle manual save
    const handleManualSave = useCallback(async () => {
        if (activeDocument && activeDocument.id) {
            try {
                await saveDocument(activeDocument);
                showToast('Document saved', {type: 'success'});
            } catch (error) {
                showToast('Failed to save document', {type: 'error'});
            }
        }
    }, [activeDocument, saveDocument, showToast]);

    // Handle export
    const handleExport = useCallback(() => {
        if (!activeDocument) {
            showToast('No document to export', {type: 'warning'});
            return;
        }

        const getFileExtension = (type: string): string => {
            switch (type) {
                case 'markdown':
                    return 'md';
                case 'javascript':
                    return 'js';
                case 'python':
                    return 'py';
                case 'html':
                    return 'html';
                default:
                    return 'txt';
            }
        };

        try {
            const blob = new Blob([activeDocument.content], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const docType = typeof activeDocument.type === 'string' ? activeDocument.type : activeDocument.type?.type || 'text';
            const fileName = `${activeDocument.title}.${getFileExtension(docType)}`;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast(`Exported "${fileName}" successfully`, {type: 'success'});
        } catch (error) {
            console.error('Error exporting document:', error);
            showToast('Failed to export document', {type: 'error'});
        }
    }, [activeDocument, showToast]);

    // Get context menu items
    const getContextMenuItems = useMemo(() => {
        if (!contextMenu.document) return [];

        return [{
            id: 'open',
            label: 'Open',
            icon: 'ri-file-line',
            action: () => onSelectDocument && onSelectDocument(contextMenu.document!),
            shortcut: '↵'
        }, {
            id: 'rename', label: 'Rename', icon: 'ri-edit-line', action: () => {
                setNewDocumentTitle(contextMenu.document!.title);
                setDocumentToRename(contextMenu.document);
            }
        }, {
            id: 'duplicate', label: 'Duplicate', icon: 'ri-file-copy-line', action: () => {
                const docToDuplicate = contextMenu.document!;
                createDocument(docToDuplicate.type, docToDuplicate.language, docToDuplicate.content, `${docToDuplicate.title} (Copy)`);
            }
        }, {
            id: 'delete',
            label: 'Delete',
            icon: 'ri-delete-bin-line',
            action: () => handleDeleteDocument(contextMenu.document!),
            isDestructive: true
        }];
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

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleManualSave();
            }

            // Ctrl/Cmd + E to export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                handleExport();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleManualSave, handleExport]);

    // Check if document needs manual save
    const needsSave = activeDocument && !settings.editor.autoSave &&
                     documentStates[parseInt(activeDocument.id)]?.isDirty;

    return (<>
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
                message={<div>
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
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConfirmRename();
                            }
                        }}
                        autoFocus
                    />
                </div>}
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
                {/* Streamlined Header */}
                <div className="flex items-center justify-between p-3 border-b"
                     style={{borderColor: currentTheme.colors.border}}
                >
                    <div className="flex items-center gap-2">
                        <IconButton
                            icon="menu-fold-line"
                            onClick={onToggleSidebar}
                            title="Hide Sidebar"
                        />
                        <h2 className="font-medium">Documents</h2>
                    </div>

                    <div className="flex items-center gap-1">
                        <MenuButton
                            icon="add-line"
                            isOpen={createMenuOpen}
                            onClick={() => setCreateMenuOpen(!createMenuOpen)}
                            title="Create New Document"
                        >
                            <DocumentTypeMenu onSelectType={handleNewFile}/>
                        </MenuButton>

                        <MenuButton
                            icon="more-fill"
                            isOpen={showOptionsMenu}
                            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                            title="Options"
                        >
                            <div className="p-2 min-w-[160px]">
                                <div className="space-y-1">
                                    {/* Sort options */}
                                    <div className="px-2 py-1 text-xs font-medium opacity-50">Sort by</div>
                                    {(['date', 'name', 'type'] as const).map(option => (
                                        <button
                                            key={option}
                                            className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-opacity-10 hover:bg-gray-500 flex items-center ${sortOption === option ? 'font-medium' : ''}`}
                                            style={{
                                                backgroundColor: sortOption === option ? currentTheme.colors.buttonActiveBackground : 'transparent',
                                            }}
                                            onClick={() => {
                                                setSortOption(option);
                                                setShowOptionsMenu(false);
                                            }}
                                        >
                                            <i className={`ri-${option === 'date' ? 'time' : option === 'name' ? 'sort-alphabet' : 'folder-2'}-line mr-2`}></i>
                                            {option === 'date' ? 'Last modified' : option === 'name' ? 'Name' : 'Type'}
                                        </button>
                                    ))}

                                    <div className="my-1 border-t" style={{borderColor: currentTheme.colors.border}}></div>

                                    {/* Theme toggle */}
                                    <button
                                        className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-opacity-10 hover:bg-gray-500 flex items-center"
                                        onClick={() => {
                                            toggleTheme();
                                            setShowOptionsMenu(false);
                                        }}
                                    >
                                        <i className={`ri-${currentTheme.isDark ? 'sun' : 'moon'}-line mr-2`}></i>
                                        {currentTheme.isDark ? 'Light Mode' : 'Dark Mode'}
                                    </button>

                                    {/* Help */}
                                    <MenuButton
                                        icon="question-line"
                                        onClick={() => {}}
                                        title="Help"
                                        className="w-full !p-0"
                                        dropdownAlign="left"
                                    >
                                        <HelpMenu getShortcutKey={getShortcutKey}/>
                                    </MenuButton>
                                </div>
                            </div>
                        </MenuButton>
                    </div>
                </div>

                {/* Search bar */}
                <div className="p-3">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search documents..."
                        onClear={() => setSearchQuery('')}
                        isSearching={isSearching}
                    />
                </div>

                {/* Document list */}
                <div className="flex-1 overflow-y-auto px-2">
                    {filteredDocuments.length === 0 ? (
                        <div className="text-center py-12 opacity-50">
                            <i className="ri-file-search-line text-3xl mb-2"></i>
                            <p className="text-sm">{searchQuery ? 'No documents found' : 'No documents yet'}</p>
                            {searchQuery && (
                                <button
                                    className="mt-2 px-3 py-1 rounded text-xs hover:opacity-80"
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
                        <div className="space-y-1 pb-2">
                            {filteredDocuments.map(doc => (
                                <DocumentItem
                                    key={doc.id}
                                    document={doc}
                                    isActive={activeDocument?.id === doc.id}
                                    onClick={() => onSelectDocument && onSelectDocument(doc)}
                                    onContextMenu={(e) => handleContextMenu(e, doc)}
                                    viewMode="list"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Minimalistic footer - only shows when needed */}
                {(activeDocument || documents.length > 0) && (
                    <div className="border-t px-3 py-2 flex items-center justify-between"
                         style={{borderColor: currentTheme.colors.border}}
                    >
                        <div className="flex items-center gap-1">
                            {/* Save button (only show if manual save is needed) */}
                            {needsSave && (
                                <IconButton
                                    icon="save-line"
                                    onClick={handleManualSave}
                                    title={`Save ${getShortcutKey('Cmd')}S`}
                                    className="text-yellow-500"
                                />
                            )}

                            {/* Export button */}
                            {activeDocument && (
                                <IconButton
                                    icon="download-line"
                                    onClick={handleExport}
                                    title={`Export ${getShortcutKey('Cmd')}E`}
                                />
                            )}
                        </div>

                        <div className="text-xs opacity-50">
                            {activeDocument && documentStates[parseInt(activeDocument.id)]?.isSaving && (
                                <span className="mr-2">
                                    <i className="ri-loader-4-line animate-spin"></i> Saving...
                                </span>
                            )}
                            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                        </div>
                    </div>
                )}

                {/* Resize handle */}
                <div
                    ref={resizeRef}
                    className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-opacity-20 hover:bg-gray-500 transition-colors"
                    onMouseDown={() => setIsResizing(true)}
                />
            </div>
        </>);
};

export default Sidebar;
