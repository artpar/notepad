// src/components/Layout/Sidebar.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useSettings} from '../../contexts/SettingsContext';
import {useDocuments} from '../../contexts/DocumentContext';
import {Document} from '../../types/document';
import DocumentItem from './DocumentItem';
import SearchBar from '../UI/SearchBar';
import ConfirmationModal from '../UI/ConfirmationModal';
import ContextMenu, {ContextMenuItem} from '../UI/ContextMenu';
import 'remixicon/fonts/remixicon.css';

enum SidebarTab {
    Files = 'files',
    Search = 'search',
    Settings = 'settings'
}

interface SidebarProps {
    onToggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({onToggleSidebar}) => {
    const {currentTheme} = useSettings();
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

    const [activeTab, setActiveTab] = useState<SidebarTab>(SidebarTab.Files);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Document[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [width, setWidth] = useState(260); // Default width
    const sidebarRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [documentToRename, setDocumentToRename] = useState<Document | null>(null);
    const [newDocumentTitle, setNewDocumentTitle] = useState('');
    const [contextMenu, setContextMenu] = useState<{
        position: { x: number; y: number } | null;
        document: Document | null
    }>({
        position: null,
        document: null
    });
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<'name' | 'date' | 'type'>('date');

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
            tagSet.add(doc.type);
            if (doc.type === 'code' && doc.language) {
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
                doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (doc.language && doc.language.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
            );
        }

        // Apply tag filter
        if (filterTag) {
            filtered = filtered.filter(doc =>
                doc.type === filterTag ||
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
                    return a.type.localeCompare(b.type);
                case 'date':
                default:
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
        });

        return filtered;
    }, [documents, searchQuery, filterTag, sortOption, activeTab, searchResults]);

    // Handle document creation
    const handleNewFile = (type: 'text' | 'markdown' | 'code', language?: string) => {
        createDocument(type, language);
        setCreateMenuOpen(false);
    };

    // Handle document deletion
    const handleDeleteDocument = (doc: Document) => {
        setDocumentToDelete(doc);
    };

    // Handle delete confirmation
    const handleConfirmDelete = () => {
        if (documentToDelete && documentToDelete.id) {
            closeDocument(documentToDelete.id);
            setDocumentToDelete(null);
        }
    };

    // Handle rename confirmation
    const handleConfirmRename = () => {
        if (documentToRename && documentToRename.id && newDocumentTitle.trim()) {
            updateDocumentTitle(documentToRename.id, newDocumentTitle);
            setDocumentToRename(null);
        }
    };

    // Handle context menu
    const handleContextMenu = (e: React.MouseEvent, doc: Document) => {
        e.preventDefault();
        setContextMenu({
            position: {x: e.clientX, y: e.clientY},
            document: doc
        });
    };

    // Close context menu
    const closeContextMenu = () => {
        setContextMenu({position: null, document: null});
    };

    // Get context menu items
    const getContextMenuItems = useMemo((): ContextMenuItem[] => {
        if (!contextMenu.document) return [];

        return [
            {
                id: 'open',
                label: 'Open',
                icon: 'ri-file-line',
                action: () => openDocument(contextMenu.document!.id!),
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
                    // Implement duplicate functionality
                    const docToDuplicate = contextMenu.document!;
                    createDocument(docToDuplicate.type as any, docToDuplicate.language)
                        .then(id => {
                            // Find the new document
                            const newDoc = documents.find(d => d.id === id);
                            if (newDoc) {
                                // Update with duplicated content
                                updateDocumentTitle(id, `${docToDuplicate.title} (Copy)`);
                                // You would also update content here
                            }
                        });
                }
            },
            {
                id: 'delete',
                label: 'Delete',
                icon: 'ri-delete-bin-line',
                action: () => handleDeleteDocument(contextMenu.document!),
                isDestructive: true,
                divider: true
            }
        ];
    }, [contextMenu.document, openDocument, createDocument, documents, updateDocumentTitle]);

    // Handle resizing
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        // Calculate new width based on mouse position
        const newWidth = e.clientX;

        // Set min and max width constraints
        if (newWidth >= 200 && newWidth <= 500) {
            setWidth(newWidth);
        }
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    // Clean up event listeners
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Get document type icon
    const getDocTypeIcon = (type: string, language?: string): string => {
        if (type === 'text') return 'ri-file-text-line';
        if (type === 'markdown') return 'ri-markdown-line';

        // Code icons
        if (language === 'javascript') return 'ri-javascript-line';
        if (language === 'typescript') return 'ri-code-s-slash-line';
        if (language === 'python') return 'ri-code-line';
        if (language === 'html') return 'ri-html5-line';
        if (language === 'css') return 'ri-css3-line';
        if (language === 'java') return 'ri-code-box-line';

        return 'ri-file-code-line';
    };

    return (
        <div
            ref={sidebarRef}
            className="h-full flex flex-col"
            style={{
                width: `${width}px`,
                backgroundColor: currentTheme.colors.sidebar,
                color: currentTheme.colors.sidebarText,
                borderRight: `1px solid ${currentTheme.colors.border}`,
                position: 'relative',
                zIndex: 10
            }}
        >
            {/* Confirmation Modal for deletion */}
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

            {/* Rename Modal */}
            <ConfirmationModal
                isOpen={documentToRename !== null}
                title="Rename Document"
                message={
                    <div className="mt-2">
                        <input
                            type="text"
                            value={newDocumentTitle}
                            onChange={e => setNewDocumentTitle(e.target.value)}
                            className="w-full p-2 border rounded"
                            style={{
                                backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                borderColor: currentTheme.colors.border,
                                color: currentTheme.colors.foreground
                            }}
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

            {/* Sidebar header */}
            <div className="p-3 flex justify-between items-center border-b"
                 style={{borderColor: currentTheme.colors.border}}
            >
                <div className="flex items-center">
                    <i className="ri-book-2-line text-xl mr-2" style={{color: currentTheme.colors.accent}}></i>
                    <span className="font-semibold">Engineer's Notes</span>
                </div>
                <div className="flex">
                    <button
                        className="p-1.5 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
                        onClick={onToggleSidebar}
                        title="Hide Sidebar"
                        style={{color: currentTheme.colors.sidebarText}}
                    >
                        <i className="ri-arrow-left-s-line text-lg"></i>
                    </button>
                </div>
            </div>

            {/* Sidebar tabs */}
            <div className="flex border-b" style={{borderColor: currentTheme.colors.border}}>
                <button
                    className={`flex-1 p-2 text-center transition-colors ${activeTab === SidebarTab.Files ? 'border-b-2' : ''}`}
                    style={{
                        borderColor: activeTab === SidebarTab.Files ? currentTheme.colors.accent : 'transparent',
                        backgroundColor: activeTab === SidebarTab.Files ? `${currentTheme.colors.accent}20` : 'transparent',
                        color: currentTheme.colors.sidebarText
                    }}
                    onClick={() => setActiveTab(SidebarTab.Files)}
                >
                    <i className="ri-folder-line mr-1"></i>Files
                </button>
                <button
                    className={`flex-1 p-2 text-center transition-colors ${activeTab === SidebarTab.Search ? 'border-b-2' : ''}`}
                    style={{
                        borderColor: activeTab === SidebarTab.Search ? currentTheme.colors.accent : 'transparent',
                        backgroundColor: activeTab === SidebarTab.Search ? `${currentTheme.colors.accent}20` : 'transparent',
                        color: currentTheme.colors.sidebarText
                    }}
                    onClick={() => setActiveTab(SidebarTab.Search)}
                >
                    <i className="ri-search-line mr-1"></i>Search
                </button>
            </div>

            {/* Search input - shown for both tabs */}
            <div className="p-2 border-b" style={{borderColor: currentTheme.colors.border}}>
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={activeTab === SidebarTab.Search ? "Search all documents..." : "Filter files..."}
                    theme={currentTheme}
                    onSearch={() => activeTab === SidebarTab.Files && setActiveTab(SidebarTab.Search)}
                />

                {isSearching && (
                    <div className="flex justify-center py-1 text-xs opacity-60">
                        <i className="ri-loader-4-line animate-spin mr-1"></i> Searching...
                    </div>
                )}
            </div>

            {/* View and sort controls */}
            <div className="px-3 py-2 flex items-center justify-between border-b"
                 style={{borderColor: currentTheme.colors.border}}>
                <div className="flex items-center space-x-2">
                    {/* View mode toggle */}
                    <button
                        className={`p-1.5 rounded-sm ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <i className="ri-list-check"></i>
                    </button>
                    <button
                        className={`p-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <i className="ri-grid-line"></i>
                    </button>
                </div>

                <div className="flex items-center">
                    {/* Sort dropdown */}
                    <div className="relative">
                        <button
                            className="p-1.5 rounded-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setSortOption(sortOption === 'date' ? 'name' : sortOption === 'name' ? 'type' : 'date')}
                            title={`Sorted by ${sortOption}`}
                        >
                            <i className={`ri-${sortOption === 'date' ? 'time' : sortOption === 'name' ? 'sort-alpha' : 'file-list'}-line`}></i>
                        </button>
                    </div>

                    {/* Create new document button */}
                    <button
                        className="p-1.5 rounded-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 ml-2"
                        onClick={() => setCreateMenuOpen(!createMenuOpen)}
                        title="Create New Document"
                    >
                        <i className="ri-add-line"></i>
                    </button>
                </div>
            </div>

            {/* Create new document menu */}
            {createMenuOpen && (
                <div className="p-2 border-b" style={{borderColor: currentTheme.colors.border}}>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            {type: 'text', label: 'Text', icon: 'ri-file-text-line'},
                            {type: 'markdown', label: 'Markdown', icon: 'ri-markdown-line'},
                            {type: 'javascript', label: 'JavaScript', icon: 'ri-javascript-line'},
                            {type: 'python', label: 'Python', icon: 'ri-code-line'},
                            {type: 'html', label: 'HTML', icon: 'ri-html5-line'}
                        ].map(item => (
                            <button
                                key={item.type}
                                className="p-2 rounded-md border text-center hover:bg-opacity-10 hover:bg-gray-500 flex flex-col items-center"
                                style={{
                                    borderColor: currentTheme.colors.border,
                                    color: currentTheme.colors.sidebarText
                                }}
                                onClick={() => handleNewFile(item.type as any)}
                            >
                                <i className={`${item.icon} text-lg mb-1`}
                                   style={{color: currentTheme.colors.accent}}></i>
                                <span className="text-xs">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter tags */}
            {tags.length > 0 && (
                <div className="px-3 py-2 border-b flex flex-wrap gap-1"
                     style={{borderColor: currentTheme.colors.border}}>
                    <button
                        className={`text-xs px-2 py-1 rounded-full ${filterTag === null ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                        onClick={() => setFilterTag(null)}
                    >
                        All
                    </button>
                    {tags.slice(0, 10).map(tag => (
                        <button
                            key={tag}
                            className={`text-xs px-2 py-1 rounded-full ${filterTag === tag ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                            onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                        >
                            {tag}
                        </button>
                    ))}
                    {tags.length > 10 && (
                        <button
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            onClick={() => {/* Show all tags */
                            }}
                        >
                            +{tags.length - 10} more
                        </button>
                    )}
                </div>
            )}

            {/* Documents list */}
            <div className="flex-1 overflow-y-auto">
                {filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        {documents.length === 0 ? (
                            <div className="max-w-xs">
                                <i className="ri-file-add-line text-5xl mb-3"
                                   style={{color: currentTheme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}}></i>
                                <h4 className="text-lg font-medium mb-2">No documents yet</h4>
                                <p className="text-sm opacity-60 mb-4">
                                    Create your first document to get started with Engineer's Notepad
                                </p>
                                <button
                                    className="px-4 py-2 rounded-md text-white"
                                    style={{backgroundColor: currentTheme.colors.accent}}
                                    onClick={() => setCreateMenuOpen(true)}
                                >
                                    Create Document
                                </button>
                            </div>
                        ) : (
                            <div style={{color: currentTheme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}}>
                                <i className="ri-search-line text-3xl mb-2"></i>
                                <p>No documents match your search criteria</p>
                                {searchQuery && (
                                    <button
                                        className="mt-4 px-3 py-1 rounded-md text-xs"
                                        style={{
                                            backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                            color: currentTheme.colors.foreground
                                        }}
                                        onClick={() => setSearchQuery('')}
                                    >
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ) : viewMode === 'list' ? (
                    // List view
                    <div className="py-1">
                        {filteredDocuments.map(doc => (
                            <div
                                key={doc.id}
                                onContextMenu={(e) => handleContextMenu(e, doc)}
                            >
                                <DocumentItem
                                    document={doc}
                                    isActive={activeDocument?.id === doc.id}
                                    onClick={() => openDocument(doc.id!)}
                                    onDelete={() => handleDeleteDocument(doc)}
                                    theme={currentTheme}
                                    highlightText={searchQuery}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    // Grid view
                    <div className="p-3 grid grid-cols-2 gap-3">
                        {filteredDocuments.map(doc => (
                            <div
                                key={doc.id}
                                className="relative group"
                                onContextMenu={(e) => handleContextMenu(e, doc)}
                            >
                                <div
                                    className={`p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border h-full flex flex-col cursor-pointer ${
                                        activeDocument?.id === doc.id ? 'border-blue-400 dark:border-blue-600' : 'border-gray-200 dark:border-gray-600'
                                    }`}
                                    style={{
                                        backgroundColor: activeDocument?.id === doc.id ?
                                            (currentTheme.isDark ? 'rgba(66, 153, 225, 0.1)' : 'rgba(66, 153, 225, 0.05)') :
                                            (currentTheme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)')
                                    }}
                                    onClick={() => openDocument(doc.id!)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div
                                            className="rounded-full p-2"
                                            style={{
                                                backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <i className={`${getDocTypeIcon(doc.type, doc.language)} text-lg`}
                                               style={{color: currentTheme.colors.accent}}></i>
                                        </div>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteDocument(doc);
                                            }}
                                            title="Delete document"
                                            style={{color: currentTheme.colors.sidebarText}}
                                        >
                                            <i className="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                    <h4
                                        className="font-medium truncate"
                                        style={{color: activeDocument?.id === doc.id ? currentTheme.colors.accent : currentTheme.colors.sidebarText}}
                                    >
                                        {doc.title}
                                    </h4>
                                    <div className="mt-1 text-xs flex items-center"
                                         style={{color: currentTheme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}}>
                                        <span>{doc.type}</span>
                                        <span className="mx-1">•</span>
                                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Resize handle */}
            <div
                ref={resizeRef}
                className="absolute h-full w-1 cursor-ew-resize z-20"
                style={{
                    right: 0,
                    top: 0,
                    backgroundColor: isResizing ? currentTheme.colors.accent : 'transparent'
                }}
                onMouseDown={handleMouseDown}
            />
        </div>
    )
};
export default Sidebar;
