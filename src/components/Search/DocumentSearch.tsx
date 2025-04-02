// src/components/Search/DocumentSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Document } from '../../types/document';
import SearchBar from '../UI/SearchBar';
import { AnimatePresence, motion } from 'framer-motion';
import 'remixicon/fonts/remixicon.css';

interface DocumentSearchProps {
    documents: Document[];
    onSelectDocument: (doc: Document) => void;
    onClose: () => void;
    isOpen: boolean;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({
                                                           documents,
                                                           onSelectDocument,
                                                           onClose,
                                                           isOpen
                                                       }) => {
    const { currentTheme } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Document[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Filter documents based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }

        const filtered = documents.filter(doc => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            return (
                doc.title.toLowerCase().includes(lowerSearchTerm) ||
                doc.content.toLowerCase().includes(lowerSearchTerm) ||
                doc.type.toLowerCase().includes(lowerSearchTerm) ||
                (doc.language && doc.language.toLowerCase().includes(lowerSearchTerm)) ||
                (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
            );
        });

        setResults(filtered);
        setSelectedIndex(0); // Reset selection when results change
    }, [searchTerm, documents]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prevIndex =>
                        prevIndex < results.length - 1 ? prevIndex + 1 : prevIndex
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prevIndex =>
                        prevIndex > 0 ? prevIndex - 1 : prevIndex
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (results.length > 0 && selectedIndex >= 0) {
                        onSelectDocument(results[selectedIndex]);
                        onClose();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, onSelectDocument, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (containerRef.current && results.length > 0) {
            const selected = containerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            if (selected) {
                selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [selectedIndex, results.length]);

    // Helper function to get file icon based on document type
    const getDocumentIcon = (doc: Document): string => {
        switch (doc.type) {
            case 'markdown':
                return 'ri-markdown-line';
            case 'javascript':
                return 'ri-javascript-line';
            case 'python':
                return 'ri-code-line';
            case 'html':
                return 'ri-html5-line';
            default:
                return 'ri-file-text-line';
        }
    };

    // Highlight matching text in search results
    const highlightMatch = (text: string): React.ReactNode => {
        if (!searchTerm.trim()) return text;

        try {
            const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
            return parts.map((part, i) =>
                part.toLowerCase() === searchTerm.toLowerCase()
                    ? <span key={i} style={{ backgroundColor: `${currentTheme.colors.accent}40` }}>{part}</span>
                    : part
            );
        } catch (e) {
            return text;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-black"
                    onClick={onClose}
                />

                {/* Search modal */}
                <motion.div
                    ref={searchRef}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-2xl"
                >
                    <div
                        className="rounded-lg shadow-lg overflow-hidden"
                        style={{
                            backgroundColor: currentTheme.colors.background,
                            borderColor: currentTheme.colors.border,
                            borderWidth: '1px'
                        }}
                    >
                        {/* Search input */}
                        <div className="p-4 border-b" style={{ borderColor: currentTheme.colors.border }}>
                            <SearchBar
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Search documents (title, content, type, tags)..."
                                autoFocus={true}
                                showSearchIcon={true}
                                showClearButton={true}
                            />
                        </div>

                        {/* Search results */}
                        <div
                            ref={containerRef}
                            className="overflow-y-auto"
                            style={{ maxHeight: '400px' }}
                        >
                            {results.length > 0 ? (
                                <div>
                                    {results.map((doc, index) => (
                                        <div
                                            key={doc.id}
                                            data-index={index}
                                            className={`p-3 flex items-center cursor-pointer ${
                                                index === selectedIndex ? 'bg-opacity-10 bg-gray-500' : 'hover:bg-opacity-5 hover:bg-gray-500'
                                            }`}
                                            style={{
                                                backgroundColor: index === selectedIndex
                                                    ? (currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                                                    : 'transparent',
                                                color: currentTheme.colors.foreground
                                            }}
                                            onClick={() => {
                                                onSelectDocument(doc);
                                                onClose();
                                            }}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                        >
                                            <div className="mr-3 text-xl" style={{ color: currentTheme.colors.accent }}>
                                                <i className={getDocumentIcon(doc)}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{highlightMatch(doc.title)}</div>
                                                <div className="text-sm opacity-60 flex items-center">
                                                    <span className="capitalize">{doc.type}</span>
                                                    {doc.language && <span className="mx-1">• {doc.language}</span>}
                                                    <span className="mx-1">• {new Date(doc.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="text-xs opacity-50 ml-2">↵ to open</div>
                                        </div>
                                    ))}
                                </div>
                            ) : searchTerm ? (
                                <div className="p-10 text-center">
                                    <i className="ri-search-line text-4xl mb-3 opacity-30"></i>
                                    <p className="opacity-60">No documents found matching "{searchTerm}"</p>
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <i className="ri-search-line text-4xl mb-3 opacity-30"></i>
                                    <p className="opacity-60">Start typing to search documents</p>
                                </div>
                            )}
                        </div>

                        {/* Footer with keyboard shortcuts */}
                        <div className="p-3 border-t flex justify-between text-xs opacity-60" style={{ borderColor: currentTheme.colors.border }}>
                            <div>
                                <span className="mr-4">↑↓ to navigate</span>
                                <span>↵ to open</span>
                            </div>
                            <div>
                                <span>ESC to close</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DocumentSearch;
