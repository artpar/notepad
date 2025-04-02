// src/components/Explorer/ExplorerPanel.tsx
import React, {useCallback, useMemo, useState} from 'react';
import {IDockviewPanelProps} from 'dockview';
import {Document} from '../../types/document';
import {useSettings} from '../../contexts/SettingsContext';
import SearchBar from '../UI/SearchBar';
import DocumentItem from '../Layout/DocumentItem';
import ConfirmationModal from '../UI/ConfirmationModal';
import {AnimatePresence, motion} from 'framer-motion';
import 'remixicon/fonts/remixicon.css';
import {DocumentType} from "../../types/DocumentType"

type DocType = 'text' | 'markdown' | 'javascript' | 'python' | 'html';

interface ExplorerPanelProps {
    documents: Document[];
    onSelectDocument: (doc: Document) => void;
    onCreateDocument: (type: DocType) => void;
    onDeleteDocument: (id: number) => void;
}

const ExplorerPanel: React.FC<IDockviewPanelProps<ExplorerPanelProps>> = (props) => {
    const {params} = props;
    const {documents, onSelectDocument, onCreateDocument, onDeleteDocument} = params;
    const {currentTheme} = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<'name' | 'date' | 'type'>('date');

    // Define document categories and tags
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
        let filtered = [...documents];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(doc =>
                doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.type.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (doc.language && doc.language.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
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
                    return a.type.type.localeCompare(b.type.type);
                case 'date':
                default:
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
        });

        return filtered;
    }, [documents, searchTerm, filterTag, sortOption]);

    // Get document type icon
    const getDocTypeIcon = (type: DocumentType): string => {
        switch (type.type) {
            case 'text':
                return 'ri-file-text-line';
            case 'markdown':
                return 'ri-markdown-line';
            case 'javascript':
                return 'ri-javascript-line';
            case 'python':
                return 'ri-code-line';
            case 'html':
                return 'ri-html5-line';
            default:
                return 'ri-file-line';
        }
    };

    // Handle document deletion confirmation
    const handleConfirmDelete = useCallback(() => {
        if (documentToDelete && documentToDelete.id) {
            onDeleteDocument(parseInt(documentToDelete.id));
            setDocumentToDelete(null);
        }
    }, [documentToDelete, onDeleteDocument]);

    // Handle document deletion cancellation
    const handleCancelDelete = useCallback(() => {
        setDocumentToDelete(null);
    }, []);

    // Handle delete button click
    const handleDeleteClick = useCallback((e: React.MouseEvent, doc: Document) => {
        e.stopPropagation();
        setDocumentToDelete(doc);
    }, []);

    // Update search term without immediately filtering
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
    }, []);

    // Toggle view mode
    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'list' ? 'grid' : 'list');
    }, []);

    // Cycle through sort options
    const cycleSortOption = useCallback(() => {
        setSortOption(current => {
            if (current === 'date') return 'name';
            if (current === 'name') return 'type';
            return 'date';
        });
    }, []);

    // Render document item
    const renderDocumentItem = useCallback((doc: Document) => {
        return (
            <DocumentItem
                key={doc.id}
                document={doc}
                isActive={false} // This will be set by the parent component if needed
                onClick={() => onSelectDocument(doc)}
                onDelete={(e) => handleDeleteClick(e, doc)}
                highlightText={searchTerm}
            />
        );
    }, [currentTheme, handleDeleteClick, onSelectDocument, searchTerm]);

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800 overflow-hidden">
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={documentToDelete !== null}
                title="Delete Document"
                message={`Are you sure you want to delete "${documentToDelete?.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                isDestructive={true}
                icon="ri-delete-bin-line"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />

            {/* Header with search and controls */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Explorer</h3>
                <div className="flex items-center space-x-2">
                    {/* View mode toggle */}
                    <button
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={toggleViewMode}
                        title="Toggle View Mode"
                    >
                        <i className={`ri-${viewMode === 'list' ? 'list-check' : 'grid-line'}`}></i>
                    </button>

                    {/* Sort button */}
                    <button
                        className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={cycleSortOption}
                        title={`Sorted by ${sortOption}`}
                    >
                        <i className={`ri-${sortOption === 'date' ? 'time' : sortOption === 'name' ? 'sort-alpha' : 'file-list'}-line`}></i>
                    </button>

                    {/* Create new document button */}
                    <div className="relative">
                        <button
                            className="flex items-center gap-1 p-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            onClick={() => setCreateMenuOpen(!createMenuOpen)}
                        >
                            <i className="ri-add-line"></i>
                        </button>

                        <AnimatePresence>
                            {createMenuOpen && (
                                <motion.div
                                    initial={{opacity: 0, y: -10}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, y: -10}}
                                    transition={{duration: 0.2}}
                                    className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded shadow-lg z-10 border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="py-1">
                                        {[
                                            {type: 'text', label: 'Text File'},
                                            {type: 'markdown', label: 'Markdown'},
                                            {type: 'javascript', label: 'JavaScript'},
                                            {type: 'python', label: 'Python'},
                                            {type: 'html', label: 'HTML'}
                                        ].map(item => (
                                            <button
                                                key={item.type}
                                                className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                onClick={() => {
                                                    onCreateDocument(item.type as DocType);
                                                    setCreateMenuOpen(false);
                                                }}
                                            >
                                                <i className={getDocTypeIcon(item.type as DocType)}></i>
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Search input */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <SearchBar
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search documents..."
                />
            </div>

            {/* Filter tags */}
            {tags.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-1">
                    <button
                        className={`text-xs px-2 py-1 rounded-full ${filterTag === null ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                        onClick={() => setFilterTag(null)}
                    >
                        All
                    </button>
                    {tags.map(tag => (
                        <button
                            key={tag}
                            className={`text-xs px-2 py-1 rounded-full ${filterTag === tag ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                            onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            {/* Documents list */}
            <div className="flex-1 overflow-y-auto">
                {filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        {documents.length === 0 ? (
                            <motion.div
                                initial={{opacity: 0, scale: 0.9}}
                                animate={{opacity: 1, scale: 1}}
                                transition={{duration: 0.3}}
                                className="max-w-xs"
                            >
                                <i className="ri-file-add-line text-5xl text-gray-300 dark:text-gray-600 mb-3"></i>
                                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No documents
                                    yet</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Create your first document to get started with Engineer's Notepad
                                </p>
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    onClick={() => setCreateMenuOpen(true)}
                                >
                                    Create Document
                                </button>
                            </motion.div>
                        ) : (
                            <div className="text-gray-500 dark:text-gray-400">
                                <i className="ri-search-line text-3xl mb-2"></i>
                                <p>No documents match your search criteria</p>
                            </div>
                        )}
                    </div>
                ) : viewMode === 'list' ? (
                    // List view
                    <div className="py-1 space-y-1 px-2">
                        <AnimatePresence initial={false}>
                            {filteredDocuments.map(doc => (
                                <motion.div
                                    key={doc.id}
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0, height: 0}}
                                    transition={{duration: 0.2}}
                                >
                                    {renderDocumentItem(doc)}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    // Grid view
                    <div className="p-3 grid grid-cols-2 gap-3">
                        {filteredDocuments.map(doc => (
                            <motion.div
                                key={doc.id}
                                initial={{opacity: 0, scale: 0.9}}
                                animate={{opacity: 1, scale: 1}}
                                transition={{duration: 0.2}}
                                className="relative group"
                            >
                                <div
                                    className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600 h-full flex flex-col cursor-pointer"
                                    onClick={() => onSelectDocument(doc)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="rounded-full p-2 bg-gray-100 dark:bg-gray-800">
                                            <i className={`${getDocTypeIcon(doc.type as DocumentType)} text-lg text-blue-500 dark:text-blue-400`}></i>
                                        </div>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1"
                                            onClick={(e) => handleDeleteClick(e, doc)}
                                        >
                                            <i className="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                    <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate">{doc.title}</h4>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                        <span>{doc.type.type}</span>
                                        <span className="mx-1">•</span>
                                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExplorerPanel;
