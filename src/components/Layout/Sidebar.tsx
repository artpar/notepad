// src/components/Layout/Sidebar.tsx
import React, {useEffect, useRef, useState} from 'react';
import {useSettings} from '../../contexts/SettingsContext';
import {Document} from '../../types/document';
import PropertiesPanel from '../Properties/PropertiesPanel';
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
    const {currentTheme, toggleTheme, settings, updateEditorSettings} = useSettings();
    const [activeTab, setActiveTab] = useState<SidebarTab>(SidebarTab.Files);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Document[]>([]);
    const [isPinned, setIsPinned] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const [width, setWidth] = useState(260); // Default width
    const sidebarRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);

    // Handle search functionality
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        // Simple client-side search implementation
        const results = documents.filter(doc =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.content.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setSearchResults(results);
    };

    // Handle document creation
    const handleNewFile = (type: 'text' | 'markdown' | 'code', language?: string) => {
        onCreateDocument(type, language);
    };

    // Handle document deletion
    const handleDeleteDocument = (e: React.MouseEvent, docId: number) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this document?')) {
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

        // Calculate new width based on mouse position
        const newWidth = e.clientX;

        // Set min and max width constraints
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
        if (!isPinned) {
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        if (!isPinned) {
            setIsVisible(false);
        }
    };

    // Toggle pin state
    const togglePin = () => {
        setIsPinned(!isPinned);
        if (!isPinned) {
            setIsVisible(true);
        }
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

    // Get file icon based on document type and language
    const getFileIcon = (doc: Document) => {
        if (doc.type === 'text') return 'ri-file-text-line';
        if (doc.type === 'markdown') return 'ri-markdown-line';

        if (doc.type === 'code') {
            switch (doc.language) {
                case 'javascript':
                    return 'ri-javascript-line';
                case 'typescript':
                    return 'ri-code-s-slash-line';
                case 'python':
                    return 'ri-code-line';
                case 'html':
                    return 'ri-html5-line';
                case 'css':
                    return 'ri-css3-line';
                case 'java':
                    return 'ri-code-box-line';
                default:
                    return 'ri-file-code-line';
            }
        }

        return 'ri-file-line';
    };

    return (
        <>
            {/* Sidebar toggle button (visible when sidebar is hidden) */}
            {!isVisible && (
                <button
                    className="fixed top-4 left-4 z-10 p-2 rounded-full shadow-md"
                    onClick={toggleSidebar}
                    style={{
                        backgroundColor: currentTheme.colors.accent,
                        color: '#fff'
                    }}
                >
                    <i className="ri-menu-line text-lg"></i>
                </button>
            )}

            {/* Main sidebar container */}
            <div
                ref={sidebarRef}
                className={`h-full flex flex-col transition-all duration-300 ease-in-out ${isVisible ? '' : 'translate-x-[-100%]'}`}
                style={{
                    width: `${width}px`,
                    backgroundColor: currentTheme.colors.sidebar,
                    borderRight: `1px solid ${currentTheme.colors.border}`,
                    position: 'relative',
                    zIndex: 10
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
                    </div>
                    <div className="flex">
                        <button
                            className="p-1.5 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
                            onClick={toggleTheme}
                            title="Toggle Theme"
                        >
                            <i className={`ri-${settings.theme === 'dark' ? 'sun' : 'moon'}-line text-lg`}></i>
                        </button>
                        <button
                            className="p-1.5 rounded-full hover:bg-opacity-20 hover:bg-gray-500 ml-1"
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

                {/* Sidebar content */}
                {/* Files tab */}
                {activeTab === SidebarTab.Files && (
                    <>
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-semibold">Documents</h2>
                            <div className="relative group">
                                <button
                                    className="px-2 py-1 rounded flex items-center text-sm"
                                    style={{
                                        backgroundColor: `${currentTheme.colors.accent}20`,
                                        color: currentTheme.colors.accent
                                    }}
                                >
                                    <i className="ri-add-line mr-1"></i>New
                                </button>
                                <div
                                    className="absolute right-0 mt-1 w-48 shadow-lg rounded border hidden group-hover:block z-20"
                                    style={{
                                        backgroundColor: currentTheme.colors.background,
                                        borderColor: currentTheme.colors.border
                                    }}
                                >
                                    <button
                                        className="block w-full text-left px-4 py-2 hover:bg-opacity-10 hover:bg-gray-500"
                                        onClick={() => handleNewFile('text')}
                                    >
                                        <i className="ri-file-text-line mr-2"></i>Text File
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 hover:bg-opacity-10 hover:bg-gray-500"
                                        onClick={() => handleNewFile('markdown')}
                                    >
                                        <i className="ri-markdown-line mr-2"></i>Markdown
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 hover:bg-opacity-10 hover:bg-gray-500"
                                        onClick={() => handleNewFile('code', 'javascript')}
                                    >
                                        <i className="ri-javascript-line mr-2"></i>JavaScript
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 hover:bg-opacity-10 hover:bg-gray-500"
                                        onClick={() => handleNewFile('code', 'python')}
                                    >
                                        <i className="ri-code-line mr-2"></i>Python
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 hover:bg-opacity-10 hover:bg-gray-500"
                                        onClick={() => handleNewFile('code', 'html')}
                                    >
                                        <i className="ri-html5-line mr-2"></i>HTML
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1 h-2/3 max-h-2/3 overflow-y-auto flex flex-col">
                            {documents && documents.length > 0 ? (
                                documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className={`p-2 rounded cursor-pointer flex items-center group transition-colors ${
                                            activeDoc?.id === doc.id ? 'bg-opacity-20 bg-gray-500' : 'hover:bg-opacity-10 hover:bg-gray-500'
                                        }`}
                                        onClick={() => onSelectDocument(doc)}
                                    >
                                        <i className={`mr-2 ${getFileIcon(doc)}`} style={{
                                            color: activeDoc?.id === doc.id ? currentTheme.colors.accent : 'inherit'
                                        }}></i>
                                        <span className="truncate flex-1">{doc.title}</span>
                                        <span className="text-xs opacity-60 ml-1">
                        {doc.type === 'code' ? doc.language : doc.type}
                      </span>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 ml-1 p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
                                            onClick={(e) => handleDeleteDocument(e, doc.id!)}
                                            title="Delete document"
                                        >
                                            <i className="ri-delete-bin-line text-sm"></i>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-4 opacity-60">
                                    <i className="ri-file-list-3-line text-3xl mb-2 block"></i>
                                    <p>No documents yet</p>
                                    <p className="text-sm">Create a new document to get started</p>
                                </div>
                            )}
                        </div>
                        <PropertiesPanel
                            params={{
                                document: activeDoc,
                                onUpdateTitle: onUpdateTitle
                            }}
                        />
                    </>
                )}

                {/* Search tab */}
                {activeTab === SidebarTab.Search && (
                    <div className="">
                        <div className="mb-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    className="w-full p-2 pr-8 rounded border"
                                    style={{
                                        backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        borderColor: currentTheme.colors.border
                                    }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 top-2 text-gray-500"
                                >
                                    <i className="ri-search-line"></i>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {searchResults.length > 0 ? (
                                searchResults.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-2 hover:bg-opacity-10 hover:bg-gray-500 rounded cursor-pointer flex items-center"
                                        onClick={() => onSelectDocument(doc)}
                                    >
                                        <i className={`mr-2 ${getFileIcon(doc)}`}></i>
                                        <span className="truncate flex-1">{doc.title}</span>
                                        <span className="text-xs opacity-60 ml-1">
                        {doc.type === 'code' ? doc.language : doc.type}
                      </span>
                                    </div>
                                ))
                            ) : searchQuery ? (
                                <div className="text-center p-4 opacity-60">
                                    <i className="ri-search-line text-3xl mb-2 block"></i>
                                    <p>No results found</p>
                                </div>
                            ) : (
                                <div className="text-center p-4 opacity-60">
                                    <i className="ri-search-line text-3xl mb-2 block"></i>
                                    <p>Enter a search term</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Resize handle */}
            <div
                ref={resizeRef}
                className="absolute h-full w-1 cursor-ew-resize z-20"
                style={{
                    left: `${width}px`,
                    top: 0,
                    backgroundColor: isResizing ? currentTheme.colors.accent : 'transparent'
                }}
                onMouseDown={handleMouseDown}
            />
        </>
    );
};

export default Sidebar;
