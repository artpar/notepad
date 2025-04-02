// src/components/Layout/AppHeader.tsx
import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useDocuments } from '../../contexts/DocumentContext';
import { motion, AnimatePresence } from 'framer-motion';
import 'remixicon/fonts/remixicon.css';

interface AppHeaderProps {
    onSaveLayout: () => void;
    onTogglePreview: () => void;
    onExportDocument: () => void;
    onToggleSidebar: () => void;
    showSidebar: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
                                                 onSaveLayout,
                                                 onTogglePreview,
                                                 onExportDocument,
                                                 onToggleSidebar,
                                                 showSidebar
                                             }) => {
    const { currentTheme, toggleTheme } = useSettings();
    const { activeDocument, createDocument } = useDocuments();
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showHelpMenu, setShowHelpMenu] = useState(false);

    // Keyboard shortcuts
    const getShortcutKey = (key: string) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        return `${isMac ? '⌘' : 'Ctrl'} + ${key}`;
    };

    return (
        <header className="app-header flex items-center justify-between p-2 border-b"
                style={{
                    backgroundColor: currentTheme.colors.sidebar,
                    borderColor: currentTheme.colors.border
                }}>
            {/* Logo and sidebar toggle */}
            <div className="flex items-center">
                <button
                    className="p-2 rounded-md mr-2 hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
                    onClick={onToggleSidebar}
                    title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <i className={`ri-${showSidebar ? 'menu-fold-line' : 'menu-unfold-line'} text-lg`}></i>
                </button>

                <div className="flex items-center">
                    <i className="ri-quill-pen-line text-xl mr-2" style={{color: currentTheme.colors.accent}}></i>
                    <h1 className="text-lg font-bold">Engineer's Notepad</h1>
                </div>
            </div>

            {/* Center section - document title when available */}
            <div className="flex-1 mx-6 text-center">
                {activeDocument && (
                    <div className="flex items-center justify-center">
                        <i className={`ri-${activeDocument.type === 'markdown' ? 'markdown-line' :
                            activeDocument.type === 'code' ||
                            activeDocument.type === 'javascript' ||
                            activeDocument.type === 'python' ||
                            activeDocument.type === 'html' ? 'code-line' :
                                'file-text-line'} mr-2`}></i>
                        <span className="font-medium">{activeDocument.title}</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
                {/* New document button */}
                <div className="relative">
                    <button
                        className="p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500 transition-colors flex items-center"
                        onClick={() => setShowCreateMenu(!showCreateMenu)}
                        title="Create New Document"
                    >
                        <i className="ri-add-line text-lg mr-1"></i>
                        <span className="hidden sm:inline">New</span>
                    </button>

                    <AnimatePresence>
                        {showCreateMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-1 w-60 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border overflow-hidden"
                                style={{ borderColor: currentTheme.colors.border }}
                            >
                                <div className="p-2 border-b" style={{ borderColor: currentTheme.colors.border }}>
                                    <h3 className="font-medium">Create New Document</h3>
                                </div>

                                <div className="py-1">
                                    {[
                                        { type: 'text', label: 'Plain Text', icon: 'ri-file-text-line', description: 'Simple text document' },
                                        { type: 'markdown', label: 'Markdown', icon: 'ri-markdown-line', description: 'Format with Markdown syntax' },
                                        { type: 'javascript', label: 'JavaScript', icon: 'ri-javascript-line', description: 'JavaScript code' },
                                        { type: 'python', label: 'Python', icon: 'ri-code-line', description: 'Python code' },
                                        { type: 'html', label: 'HTML', icon: 'ri-html5-line', description: 'HTML document' }
                                    ].map(item => (
                                        <button
                                            key={item.type}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-start gap-3"
                                            onClick={() => {
                                                createDocument(item.type as any);
                                                setShowCreateMenu(false);
                                            }}
                                        >
                                            <i className={`${item.icon} text-xl mt-0.5`} style={{color: currentTheme.colors.accent}}></i>
                                            <div>
                                                <div className="font-medium">{item.label}</div>
                                                <div className="text-xs opacity-60">{item.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Document actions - only show when document is active */}
                {activeDocument && (
                    <>
                        {/* Preview toggle */}
                        <button
                            className="p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500 transition-colors flex items-center"
                            onClick={onTogglePreview}
                            title={`Toggle Preview (${getShortcutKey('P')})`}
                        >
                            <i className="ri-eye-line text-lg mr-1"></i>
                            <span className="hidden sm:inline">Preview</span>
                        </button>

                        {/* Export */}
                        <button
                            className="p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500 transition-colors flex items-center"
                            onClick={onExportDocument}
                            title={`Export Document (${getShortcutKey('E')})`}
                        >
                            <i className="ri-download-line text-lg mr-1"></i>
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </>
                )}

                {/* Save layout */}
                <button
                    className="p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500 transition-colors flex items-center"
                    onClick={onSaveLayout}
                    title={`Save Layout (${getShortcutKey('S')})`}
                >
                    <i className="ri-save-line text-lg mr-1"></i>
                    <span className="hidden sm:inline">Save Layout</span>
                </button>

                {/* Theme toggle */}
                <button
                    className="p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
                    onClick={toggleTheme}
                    title="Toggle Light/Dark Theme"
                >
                    <i className={`ri-${currentTheme.isDark ? 'sun' : 'moon'}-line text-lg`}></i>
                </button>

                {/* Help menu */}
                <div className="relative">
                    <button
                        className="p-2 rounded-md hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
                        onClick={() => setShowHelpMenu(!showHelpMenu)}
                        title="Help & Keyboard Shortcuts"
                    >
                        <i className="ri-question-line text-lg"></i>
                    </button>

                    <AnimatePresence>
                        {showHelpMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-1 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border"
                                style={{ borderColor: currentTheme.colors.border }}
                            >
                                <div className="p-3 border-b" style={{ borderColor: currentTheme.colors.border }}>
                                    <h3 className="font-medium">Keyboard Shortcuts</h3>
                                </div>

                                <div className="p-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-sm font-medium mb-1">Document</p>
                                            <ul className="text-xs space-y-2">
                                                <li className="flex justify-between">
                                                    <span>New Document</span>
                                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{getShortcutKey('N')}</span>
                                                </li>
                                                <li className="flex justify-between">
                                                    <span>Toggle Preview</span>
                                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{getShortcutKey('P')}</span>
                                                </li>
                                                <li className="flex justify-between">
                                                    <span>Export Document</span>
                                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{getShortcutKey('E')}</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium mb-1">Workspace</p>
                                            <ul className="text-xs space-y-2">
                                                <li className="flex justify-between">
                                                    <span>Save Layout</span>
                                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{getShortcutKey('S')}</span>
                                                </li>
                                                <li className="flex justify-between">
                                                    <span>Toggle Sidebar</span>
                                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{getShortcutKey('B')}</span>
                                                </li>
                                                <li className="flex justify-between">
                                                    <span>Find in Document</span>
                                                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{getShortcutKey('F')}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t text-center" style={{ borderColor: currentTheme.colors.border }}>
                                        <p className="text-xs opacity-70">
                                            Engineer's Notepad v1.1.0 — A code-focused note-taking app
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
