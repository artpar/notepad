// src/components/Layout/AppHeader.tsx
import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useDocuments } from '../../contexts/DocumentContext';
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
                    backgroundColor: currentTheme.colors.headerBackground,
                    color: currentTheme.colors.headerText,
                    borderColor: currentTheme.colors.border
                }}
        >
            {/* Logo and sidebar toggle */}
            <div className="flex items-center">
                <button
                    className="p-2 rounded-md mr-2 transition-colors"
                    style={{
                        color: currentTheme.colors.buttonText,
                        hover: { backgroundColor: currentTheme.colors.buttonHover }
                    }}
                    onClick={onToggleSidebar}
                    title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <i className={`ri-${showSidebar ? 'menu-fold-line' : 'menu-unfold-line'} text-lg`}></i>
                </button>

                <div className="flex items-center">
                    <i className="ri-quill-pen-line text-xl mr-2" style={{color: currentTheme.colors.accent}}></i>
                    <h1 className="text-lg font-bold" style={{color: currentTheme.colors.headerText}}>Engineer's Notepad</h1>
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
                                'file-text-line'} mr-2`} style={{color: currentTheme.colors.headerText}}></i>
                        <span className="font-medium" style={{color: currentTheme.colors.headerText}}>{activeDocument.title}</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
                {/* New document button */}
                <div className="relative">
                    <button
                        className="p-2 rounded-md transition-colors flex items-center"
                        style={{
                            color: currentTheme.colors.buttonText,
                            backgroundColor: showCreateMenu ? currentTheme.colors.buttonActiveBackground : 'transparent'
                        }}
                        onClick={() => setShowCreateMenu(!showCreateMenu)}
                        title="Create New Document"
                    >
                        <i className="ri-add-line text-lg mr-1"></i>
                        <span className="hidden sm:inline">New</span>
                    </button>

                    {showCreateMenu && (
                        <div
                            className="absolute right-0 mt-1 w-60 rounded-md shadow-lg z-50 border overflow-hidden"
                            style={{
                                backgroundColor: currentTheme.colors.background,
                                borderColor: currentTheme.colors.border,
                                color: currentTheme.colors.foreground
                            }}
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
                                        className="w-full text-left px-4 py-2 transition-colors flex items-start gap-3"
                                        style={{
                                            backgroundColor: currentTheme.colors.background,
                                            color: currentTheme.colors.foreground,
                                            hover: { backgroundColor: currentTheme.colors.buttonHover }
                                        }}
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
                        </div>
                    )}
                </div>

                {/* Document actions - only show when document is active */}
                {activeDocument && (
                    <>
                        {/* Preview toggle */}
                        <button
                            className="p-2 rounded-md transition-colors flex items-center"
                            style={{
                                color: currentTheme.colors.buttonText,
                                hover: { backgroundColor: currentTheme.colors.buttonHover }
                            }}
                            onClick={onTogglePreview}
                            title={`Toggle Preview (${getShortcutKey('P')})`}
                        >
                            <i className="ri-eye-line text-lg mr-1"></i>
                            <span className="hidden sm:inline">Preview</span>
                        </button>

                        {/* Export */}
                        <button
                            className="p-2 rounded-md transition-colors flex items-center"
                            style={{
                                color: currentTheme.colors.buttonText,
                                hover: { backgroundColor: currentTheme.colors.buttonHover }
                            }}
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
                    className="p-2 rounded-md transition-colors flex items-center"
                    style={{
                        color: currentTheme.colors.buttonText,
                        hover: { backgroundColor: currentTheme.colors.buttonHover }
                    }}
                    onClick={onSaveLayout}
                    title={`Save Layout (${getShortcutKey('S')})`}
                >
                    <i className="ri-save-line text-lg mr-1"></i>
                    <span className="hidden sm:inline">Save Layout</span>
                </button>

                {/* Theme toggle */}
                <button
                    className="p-2 rounded-md transition-colors"
                    style={{
                        color: currentTheme.colors.buttonText,
                        hover: { backgroundColor: currentTheme.colors.buttonHover }
                    }}
                    onClick={toggleTheme}
                    title="Toggle Light/Dark Theme"
                >
                    <i className={`ri-${currentTheme.isDark ? 'sun' : 'moon'}-line text-lg`}></i>
                </button>

                {/* Help menu */}
                <div className="relative">
                    <button
                        className="p-2 rounded-md transition-colors"
                        style={{
                            color: currentTheme.colors.buttonText,
                            backgroundColor: showHelpMenu ? currentTheme.colors.buttonActiveBackground : 'transparent'
                        }}
                        onClick={() => setShowHelpMenu(!showHelpMenu)}
                        title="Help & Keyboard Shortcuts"
                    >
                        <i className="ri-question-line text-lg"></i>
                    </button>

                    {showHelpMenu && (
                        <div
                            className="absolute right-0 mt-1 w-80 rounded-md shadow-lg z-50 border"
                            style={{
                                backgroundColor: currentTheme.colors.background,
                                borderColor: currentTheme.colors.border,
                                color: currentTheme.colors.foreground
                            }}
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
                                                <span className="font-mono px-1 rounded"
                                                      style={{
                                                          backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                      }}>
                                                    {getShortcutKey('N')}
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Toggle Preview</span>
                                                <span className="font-mono px-1 rounded"
                                                      style={{
                                                          backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                      }}>
                                                    {getShortcutKey('P')}
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Export Document</span>
                                                <span className="font-mono px-1 rounded"
                                                      style={{
                                                          backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                      }}>
                                                    {getShortcutKey('E')}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium mb-1">Workspace</p>
                                        <ul className="text-xs space-y-2">
                                            <li className="flex justify-between">
                                                <span>Save Layout</span>
                                                <span className="font-mono px-1 rounded"
                                                      style={{
                                                          backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                      }}>
                                                    {getShortcutKey('S')}
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Toggle Sidebar</span>
                                                <span className="font-mono px-1 rounded"
                                                      style={{
                                                          backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                      }}>
                                                    {getShortcutKey('B')}
                                                </span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Find in Document</span>
                                                <span className="font-mono px-1 rounded"
                                                      style={{
                                                          backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                                      }}>
                                                    {getShortcutKey('F')}
                                                </span>
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
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
