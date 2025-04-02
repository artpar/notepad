// src/components/Layout/Sidebar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Document } from '../../types/document';
import PropertiesPanel from '../Properties/PropertiesPanel';
import DocumentItem from './DocumentItem';
import SearchBar from '../UI/SearchBar';
import { motion, AnimatePresence } from 'framer-motion';
import 'remixicon/fonts/remixicon.css';

enum SidebarTab {
    Files = 'files',
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
    const { currentTheme, toggleTheme, settings } = useSettings();
    const [activeTab, setActiveTab] = useState<SidebarTab>(SidebarTab.Files);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Document[]>([]);
    const [isPinned, setIsPinned] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const [width, setWidth] = useState(260);
    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [groupedDocuments, setGroupedDocuments] = useState<Record<string, Document[]>>({});

    // Group documents by type
    useEffect(() => {
        const groups: Record<string, Document[]> = {
            recent: documents.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
            markdown: documents.filter(doc => doc.type === 'markdown'),
            code: documents.filter(doc => doc.type === 'code' || doc.type === 'javascript' || doc.type === 'python' || doc.type === 'html'),
            text: documents.filter(doc => doc.type === 'text')
        };
        setGroupedDocuments(groups);
    }, [documents]);

    // Handle search functionality
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            // Simple client-side search
            const results = documents.filter(doc =>
                doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.content.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setSearchResults(results);
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [searchQuery, documents]);

    // Handle document creation
    const handleNewFile = (type: 'text' | 'markdown' | 'javascript' | 'python' | 'html') => {
        const mappedType = type === 'javascript' || type === 'python' || type === 'html' ? 'code' : type;
        const language = type === 'javascript' || type === 'python' || type === 'html' ? type : undefined;

        onCreateDocument(mappedType, language);
        setCreateMenuOpen(false);
    };

    // Handle document deletion with confirmation
    const handleDeleteDocument = (e: React.MouseEvent, docId: number) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            onDeleteDocument(docId);
        }
    };

    // Handle resizing
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 500) {
            setWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Handle sidebar visibility
    const handleMouseEnter = () => {
        if (!isPinned) setIsVisible(true);
    };

    const handleMouseLeave = () => {
        if (!isPinned) setIsVisible(false);
    };

    // Toggle pin state
    const togglePin = () => {
        setIsPinned(!isPinned);
        if (!isPinned) setIsVisible(true);
    };

    // Toggle sidebar visibility
    const toggleSidebar = () => {
        setIsVisible(!isVisible);
    };

    // Clean up event listeners
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Render document groups
    const renderDocumentGroup = (title: string, docs: Document[]) => {
        if (!docs || docs.length === 0) return null;

        return (
            <div className="mb-4">
                <h3 className="text-xs uppercase font-semibold tracking-wide mb-2 px-3 opacity-70">{title}</h3>
                <div className="space-y-1">
                    {docs.map((doc) => (
                        <DocumentItem
                            key={doc.id}
                            document={doc}
                            isActive={activeDoc?.id === doc.id}
                            onClick={() => onSelectDocument(doc)}
                            onDelete={(e) => handleDeleteDocument(e, doc.id!)}
                            theme={currentTheme}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Sidebar toggle button (visible when sidebar is hidden) */}
            <AnimatePresence>
                {!isVisible && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-4 left-4 z-10 p-2 rounded-full shadow-lg"
                        onClick={toggleSidebar}
                        style={{
                            backgroundColor: currentTheme.colors.accent,
                            color: '#fff'
                        }}
                    >
                        <i className="ri-menu-line text-lg"></i>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Main sidebar container */}
            <motion.div
                ref={sidebarRef}
                animate={{
                    width: isVisible ? width : 0,
                    opacity: isVisible ? 1 : 0,
                    boxShadow: isVisible ? (currentTheme.isDark ? "0 0 15px rgba(0,0,0,0.5)" : "0 0 15px rgba(0,0,0,0.1)") : "none"
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full flex flex-col relative"
                style={{
                    backgroundColor: currentTheme.colors.sidebar,
                    borderRight: `1px solid ${currentTheme.colors.border}`,
                    zIndex: 10,
                    overflow: "hidden"
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
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
                            className="p-1.5 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-colors"
                            onClick={toggleTheme}
                            title="Toggle Theme"
                        >
                            <i className={`ri-${settings.theme === 'dark' ? 'sun' : 'moon'}-line text-lg`}></i>
                        </button>
                        <button
                            className="p-1.5 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-colors ml-1"
                            onClick={togglePin}
                            title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
                        >
                            <i className={`ri-${isPinned ? 'pushpin-fill' : 'pushpin-line'} text-lg`}></i>
                        </button>
                    </div>
                </div>

                {/* Sidebar tabs */}
                <div className="flex border-b" style={{borderColor: currentTheme.colors.border}}>
                    <button
                        className={`flex-1 p-2 text-center transition-colors ${activeTab === SidebarTab.Files ? 'border-b-2' : ''}`}
                        style={{
                            borderColor: activeTab === SidebarTab.Files ? currentTheme.colors.accent : 'transparent',
                            backgroundColor: activeTab === SidebarTab.Files ? `${currentTheme.colors.accent}20` : 'transparent'
                        }}
                        onClick={() => setActiveTab(SidebarTab.Files)}
                    >
                        <i className="ri-folder-line mr-1"></i>Files
                    </button>
                    <button
                        className={`flex-1 p-2 text-center transition-colors ${activeTab === SidebarTab.Search ? 'border-b-2' : ''}`}
                        style={{
                            borderColor: activeTab === SidebarTab.Search ? currentTheme.colors.accent : 'transparent',
                            backgroundColor: activeTab === SidebarTab.Search ? `${currentTheme.colors.accent}20` : 'transparent'
                        }}
                        onClick={() => setActiveTab(SidebarTab.Search)}
                    >
                        <i className="ri-search-line mr-1"></i>Search
                    </button>
                </div>

                {/* Create new document button - always visible */}
                <div className="p-3 relative">
                    <button
                        className="w-full px-3 py-2 rounded-md flex items-center justify-center text-sm transition-colors"
                        style={{
                            backgroundColor: currentTheme.colors.accent,
                            color: '#fff'
                        }}
                        onClick={() => setCreateMenuOpen(!createMenuOpen)}
                    >
                        <i className="ri-add-line mr-2"></i>
                        Create New Document
                    </button>

                    {/* Create document dropdown */}
                    <AnimatePresence>
                        {createMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute left-3 right-3 mt-1 shadow-lg rounded-md z-30 border overflow-hidden"
                                style={{
                                    backgroundColor: currentTheme.colors.background,
                                    borderColor: currentTheme.colors.border
                                }}
                            >
                                {[
                                    { type: 'text', label: 'Text File', icon: 'ri-file-text-line' },
                                    { type: 'markdown', label: 'Markdown', icon: 'ri-markdown-line' },
                                    { type: 'javascript', label: 'JavaScript', icon: 'ri-javascript-line' },
                                    { type: 'python', label: 'Python', icon: 'ri-code-line' },
                                    { type: 'html', label: 'HTML', icon: 'ri-html5-line' }
                                ].map(item => (
                                    <button
                                        key={item.type}
                                        className="block w-full text-left px-4 py-3 hover:bg-opacity-10 hover:bg-gray-500 transition-colors flex items-center gap-2"
                                        onClick={() => handleNewFile(item.type as any)}
                                    >
                                        <i className={`${item.icon} text-lg`} style={{color: currentTheme.colors.accent}}></i>
                                        <div>
                                            <div className="font-medium">{item.label}</div>
                                            <div className="text-xs opacity-60">Create a new {item.label.toLowerCase()} document</div>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar content - scrollable area */}
                <div className="flex-1 overflow-y-auto">
                    {/* Files tab */}
                    {activeTab === SidebarTab.Files && (
                        <div className="p-3">
                            {documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center opacity-60">
                                    <i className="ri-file-list-3-line text-5xl mb-4"></i>
                                    <h3 className="font-medium mb-2">No documents yet</h3>
                                    <p className="text-sm">Create your first document to get started</p>
                                </div>
                            ) : (
                                <>
                                    {renderDocumentGroup('Recent', groupedDocuments.recent)}
                                    {renderDocumentGroup('Markdown', groupedDocuments.markdown)}
                                    {renderDocumentGroup('Code', groupedDocuments.code)}
                                    {renderDocumentGroup('Text', groupedDocuments.text)}
                                </>
                            )}
                        </div>
                    )}

                    {/* Search tab */}
                    {activeTab === SidebarTab.Search && (
                        <div className="p-3">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search documents..."
                                theme={currentTheme}
                            />

                            <div className="mt-4">
                                {searchQuery.trim() === '' ? (
                                    <div className="text-center p-4 opacity-60">
                                        <i className="ri-search-line text-3xl mb-2 block"></i>
                                        <p>Enter a search term to find documents</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div>
                                        <h3 className="text-xs uppercase font-semibold tracking-wide mb-2 px-1 opacity-70">
                                            Search Results ({searchResults.length})
                                        </h3>
                                        <div className="space-y-1">
                                            {searchResults.map((doc) => (
                                                <DocumentItem
                                                    key={doc.id}
                                                    document={doc}
                                                    isActive={activeDoc?.id === doc.id}
                                                    onClick={() => onSelectDocument(doc)}
                                                    onDelete={(e) => handleDeleteDocument(e, doc.id!)}
                                                    theme={currentTheme}
                                                    highlightText={searchQuery}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-4 opacity-60">
                                        <i className="ri-error-warning-line text-3xl mb-2 block"></i>
                                        <p>No results found for "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Properties panel */}
                {activeDoc && (
                    <div className="border-t" style={{borderColor: currentTheme.colors.border}}>
                        <PropertiesPanel
                            params={{
                                document: activeDoc,
                                onUpdateTitle: onUpdateTitle
                            }}
                        />
                    </div>
                )}
            </motion.div>

            {/* Resize handle */}
            {isVisible && (
                <div
                    ref={resizeRef}
                    className="absolute h-full w-1 cursor-ew-resize z-20 hover:bg-opacity-50 hover:bg-blue-400 transition-colors"
                    style={{
                        left: `${width}px`,
                        top: 0,
                        backgroundColor: isResizing ? currentTheme.colors.accent : 'transparent'
                    }}
                    onMouseDown={handleMouseDown}
                />
            )}
        </>
    );
};

export default Sidebar;
