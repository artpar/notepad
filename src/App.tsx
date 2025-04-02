// src/App.tsx
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import './App.css';
import {useSettings} from './contexts/SettingsContext';
import {Document} from './types/document';

import {DockviewReact, DockviewReadyEvent, DockviewApi, PanelCollection, SerializedDockview} from 'dockview';
import 'dockview/dist/styles/dockview.css';
import 'remixicon/fonts/remixicon.css';
import {AnimatePresence, motion} from 'framer-motion';

// Import components
import AppHeader from './components/Layout/AppHeader';
import Sidebar from './components/Layout/Sidebar';
import DocumentEditorPanel from './components/Editor/DocumentEditorPanel';
import DocumentPreviewPanel from './components/Preview/DocumentPreviewPanel';
import ExplorerPanel from './components/Explorer/ExplorerPanel';
import PropertiesPanel from './components/Properties/PropertiesPanel';
import {CustomGroupPanel, CustomWatermarkPanel} from './components/Panels/CustomPanels';
import ConfirmationModal from './components/UI/ConfirmationModal';
import ContextMenu, {ContextMenuItem} from './components/UI/ContextMenu';

// Import services and utils
import * as StorageService from './services/storage';
import * as LayoutService from './services/layoutService';
import ToastProvider, {useToast} from "./components/UI/ToastSystem.tsx";
import DocumentSearch from "./components/Search/DocumentSearch.tsx";
import Welcome from "./components/UI/Welcome.tsx";
import {useDocuments} from "./contexts/UseDocuments.tsx";
import {DocumentType} from "./types/DocumentType.tsx";

// App component wrapper with Toast provider
const AppWithProviders = () => {
    return (<ToastProvider>
            <AppContent/>
        </ToastProvider>);
};

// Main App content component
function AppContent() {
    const {showToast} = useToast();
    // Use the document context
    const {
        documents,
        activeDocument,
        updateDocument,
        createDocument: createContextDocument,
        openDocument: openContextDocument,
        saveDocument,
        closeDocument,
        documentStates
    } = useDocuments();

    const {currentTheme} = useSettings();
    const [dockviewApi, setDockviewApi] = useState<DockviewApi | null>(null);
    const [savedLayout, setSavedLayout] = useState<SerializedDockview | undefined>(LayoutService.loadLayout());
    const [showSidebar, setShowSidebar] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        position: { x: number; y: number } | null; document: Document | null
    }>({
        position: null, document: null
    });

    // Add global search state
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Add welcome screen state
    const [showWelcome, setShowWelcome] = useState(false);

    // Add command palette state
    const [showCommandPalette, setShowCommandPalette] = useState(false);

    // Save layout reference - keeping this outside the lifecycle
    const saveLayoutRef = useRef<() => void>(() => {
    });

    // Define core functions first to avoid circular references

    // Close context menu
    const closeContextMenu = useCallback(() => {
        setContextMenu({position: null, document: null});
    }, []);

    // Toggle sidebar visibility
    const toggleSidebar = useCallback(() => {
        setShowSidebar(prev => !prev);
    }, []);

    // Create a new document - wrapper around context function
    const createDocument = useCallback((type: DocumentType, language?: string) => {
        createContextDocument(type, language).then(id => {
            // Open the document in the editor
            if (dockviewApi) {
                const newDoc = documents.find(doc => parseInt(doc.id) === id);
                if (newDoc) {
                    dockviewApi.addPanel({
                        id: `editor-${id}`, component: 'documentEditor', params: {
                            document: newDoc, onUpdate: (content: string) => updateDocument(id, content)
                        }, title: newDoc.title
                    });
                    saveLayoutRef.current();

                    // Show success toast
                    showToast(`Created new ${type} document`, {
                        type: 'success', duration: 2000
                    });
                }
            }
        });
    }, [createContextDocument, documents, dockviewApi, updateDocument, showToast]);

    // Open document in editor
    const openDocument = useCallback((doc: Document) => {
        openContextDocument(parseInt(doc.id));

        // Check if document is already open in editor
        if (dockviewApi) {
            const panel = dockviewApi.getPanel(`editor-${doc.id}`);
            if (panel) {
                panel.focus();
            } else {
                // Open new editor panel
                dockviewApi.addPanel({
                    id: `editor-${doc.id}`, component: 'documentEditor', params: {
                        document: doc, onUpdate: (content: string) => updateDocument(parseInt(doc.id), content)
                    }, title: doc.title
                });
            }
        }
    }, [dockviewApi, openContextDocument, updateDocument]);

    // Delete document with confirmation
    const deleteDocument = useCallback((id: number) => {
        const doc = documents.find(d => parseInt(d.id) === id);
        if (doc) {
            setDocumentToDelete(doc);
        }
    }, [documents]);

    // Handle delete confirmation
    const handleConfirmDelete = useCallback(() => {
        if (documentToDelete) {
            const docTitle = documentToDelete.title;
            closeDocument(parseInt(documentToDelete.id));

            // Delete the document from storage
            StorageService.deleteDocument(parseInt(documentToDelete.id))
                .then(() => {
                    console.log(`Document ${documentToDelete.id} deleted successfully`);
                    showToast(`Deleted "${docTitle}"`, {
                        type: 'success', action: {
                            label: 'Undo', onClick: () => {
                                // In a real app, you'd implement undo functionality here
                                showToast('Undo functionality would be implemented here', {type: 'info'});
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error(`Error deleting document ${documentToDelete.id}:`, error);
                    showToast('Failed to delete document', {type: 'error'});
                });

            // Close related panels if they exist
            saveLayoutRef.current();
            if (dockviewApi) {
                try {
                    // Find and close panels for this document
                    const groups = dockviewApi.groups;
                    groups.forEach(group => {
                        const panels = group.panels;
                        panels.forEach(panel => {
                            if (panel.id === `editor-${documentToDelete.id}` || panel.id === `preview-${documentToDelete.id}`) {
                                panel.api.close();
                            }
                        });
                    });
                } catch (error) {
                    console.error(`Error removing panels for document ${documentToDelete.id}:`, error);
                }
            }

            // Close the confirmation modal
            setDocumentToDelete(null);
        }
    }, [documentToDelete, closeDocument, dockviewApi, showToast]);

    // Handle delete cancellation
    const handleCancelDelete = useCallback(() => {
        setDocumentToDelete(null);
    }, []);

    // Update document title
    const updateDocumentTitle = useCallback((title: string) => {
        if (!activeDocument) return;

        // Create updated document
        const updatedDoc = {
            ...activeDocument, title, updatedAt: new Date()
        };

        // Save document to storage
        saveDocument(updatedDoc).then(() => {
            // Update panel titles if they exist
            if (dockviewApi) {
                // Update the editor panel
                const editorPanel = dockviewApi.getPanel(`editor-${activeDocument.id}`);
                if (editorPanel) {
                    editorPanel.setTitle(title);
                }

                // Also update any preview panels that might exist
                const previewPanel = dockviewApi.getPanel(`preview-${activeDocument.id}`);
                if (previewPanel) {
                    previewPanel.setTitle(`Preview: ${title}`);
                }
            }

            // Save the updated layout
            saveLayoutRef.current();
        });
    }, [activeDocument, dockviewApi, saveDocument]);

    // Export the current document
    const exportDocument = useCallback(() => {
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
            const fileName = `${activeDocument.title}.${getFileExtension(activeDocument.type.type)}`;
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

    // Toggle preview for the current document
    const togglePreview = useCallback(() => {
        if (!activeDocument) {
            showToast('No document to preview', {type: 'warning'});
            return;
        }

        if (!dockviewApi) return;

        const previewPanelId = `preview-${activeDocument.id}`;
        const editorPanelId = `editor-${activeDocument.id}`;
        const existingPanel = dockviewApi.getPanel(previewPanelId);
        const editorPanel = dockviewApi.getPanel(editorPanelId);

        if (existingPanel) {
            existingPanel.api.close();
            showToast('Preview closed', {type: 'info', duration: 1500});
        } else {
            // Create panel config
            const panelConfig: any = {
                id: previewPanelId, component: 'documentPreview', params: {
                    document: activeDocument
                }, title: `Preview: ${activeDocument.title}`
            };

            // Only add position if editor panel exists
            if (editorPanel) {
                panelConfig.position = {
                    referencePanel: editorPanelId, direction: 'right'
                };
            }

            dockviewApi.addPanel(panelConfig);

            if (activeDocument.type.type === 'markdown') {
                showToast('Markdown preview opened', {
                    type: 'info', duration: 2000, action: {
                        label: 'Split View', onClick: () => {
                            // This would ideally switch to a split view mode
                            showToast('Split view would be implemented here', {type: 'info'});
                        }
                    }
                });
            } else {
                showToast('Preview opened', {type: 'info', duration: 1500});
            }
        }
    }, [activeDocument, dockviewApi, showToast]);

    // Context menu items
    const getContextMenuItems = useCallback((): ContextMenuItem[] => {
        if (!contextMenu.document) return [];

        return [{
            id: 'open',
            label: 'Open',
            icon: 'ri-file-line',
            action: () => openDocument(contextMenu.document!),
            shortcut: '↵'
        }, {
            id: 'preview', label: 'Preview', icon: 'ri-eye-line', action: () => {
                openDocument(contextMenu.document!);
                setTimeout(() => togglePreview(), 100);
            }, shortcut: 'Ctrl+P'
        }, {
            id: 'rename', label: 'Rename', icon: 'ri-edit-line', action: () => {
                openDocument(contextMenu.document!);
                // This will trigger the rename UI in PropertiesPanel
            }
        }, {
            id: 'export', label: 'Export', icon: 'ri-download-line', action: () => {
                openDocument(contextMenu.document!);
                exportDocument();
            }, shortcut: 'Ctrl+E'
        }, {
            id: 'duplicate', label: 'Duplicate', icon: 'ri-file-copy-line', action: () => {
                // Implement duplicate functionality
                const docToDuplicate = contextMenu.document!;
                const newDoc = {
                    ...docToDuplicate,
                    id: undefined,
                    title: `${docToDuplicate.title} (Copy)`,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                createDocument(newDoc.type, newDoc.language);
            }
        }, {
            id: 'delete',
            label: 'Delete',
            icon: 'ri-delete-bin-line',
            action: () => setDocumentToDelete(contextMenu.document),
            isDestructive: true,
            divider: true
        }];
    }, [contextMenu.document, openDocument, togglePreview, exportDocument, createDocument]);

    // Initialize default layout
    const initializeDefaultLayout = useCallback((api: DockviewApi) => {
        // Add explorer panel by default
        api.addPanel({
            id: 'explorer', component: 'explorer', params: {
                documents,
                onSelectDocument: openDocument,
                onCreateDocument: createDocument,
                onDeleteDocument: deleteDocument
            }, title: 'Explorer'
        });

        // If we have an active document, open it
        if (activeDocument) {
            api.addPanel({
                id: `editor-${activeDocument.id}`, component: 'documentEditor', params: {
                    document: activeDocument, onUpdate: (content: string) => {
                        updateDocument(parseInt(activeDocument.id), content);
                    }
                }, title: activeDocument.title
            });
        }
    }, [activeDocument, documents, openDocument, createDocument, deleteDocument, updateDocument]);

    // Handle dockview ready event
    const handleDockviewReady = useCallback(async (event: DockviewReadyEvent) => {
        setDockviewApi(event.api);

        // If we have a saved layout, restore it
        if (savedLayout) {
            try {
                const panelKeys = Object.keys(savedLayout.panels);
                for (const panelKey of panelKeys) {
                    const panelObject = savedLayout.panels[panelKey];
                    if (!panelObject.params) {
                        panelObject.params = {};
                    }

                    // Get the document ID from the layout
                    const docId = panelObject.params.documentId || panelObject.params.document?.id;
                    if (docId) {
                        // Fetch the latest document from the database
                        const doc = await StorageService.getDocument(docId);
                        if (doc) {
                            // Add the document to the panel params
                            panelObject.params.document = doc;
                            // Set up the update function
                            panelObject.params.onUpdate = (content: string) => {
                                updateDocument(docId, content);
                            };
                        } else {
                            console.warn(`Document with ID ${docId} not found in database`);
                            // Remove this panel if the document doesn't exist anymore
                            delete savedLayout.panels[panelKey];
                        }
                    }
                }
                event.api.fromJSON(savedLayout);
            } catch (e) {
                console.error('Error restoring layout:', e);
                initializeDefaultLayout(event.api);
            }
        } else {
            initializeDefaultLayout(event.api);
        }

        // Save layout when panels are moved or resized
        event.api.onDidLayoutChange(() => {
            // Only save layout, not documents
            LayoutService.saveLayout(event.api).catch(error => {
                console.error('Error auto-saving layout on change:', error);
            });
        });

        // Set loading to false once everything is initialized
        setIsLoading(false);
    }, [savedLayout, updateDocument, initializeDefaultLayout]);

    // Components for the dockview
    const components = useMemo<PanelCollection>(() => ({
        documentEditor: DocumentEditorPanel,
        documentPreview: DocumentPreviewPanel,
        explorer: ExplorerPanel,
        properties: PropertiesPanel
    }), []);

    // Setup save layout function reference
    useEffect(() => {
        if (dockviewApi) {
            saveLayoutRef.current = async () => {
                try {
                    // Don't set global isLoading - this affects the entire app
                    // Instead, we'll track saving state at the document level

                    // First save all dirty documents
                    const dirtyDocIds = Object.entries(documentStates)
                        .filter(([, state]) => state.isDirty)
                        .map(([id]) => parseInt(id));

                    // Save each dirty document
                    const savePromises = dirtyDocIds.map(id => {
                        const doc = documents.find(d => parseInt(d.id) === id);
                        if (doc) {
                            return saveDocument(doc);
                        }
                        return Promise.resolve();
                    });

                    // Wait for all documents to save
                    await Promise.all(savePromises);

                    // Then save the layout
                    await LayoutService.saveLayout(dockviewApi);

                    // Show success toast when layout is explicitly saved (not auto-saved)
                    showToast('Layout saved successfully', {
                        type: 'success', duration: 2000
                    });
                } catch (e) {
                    console.error('Error saving layout to localStorage:', e);
                    showToast('Failed to save layout', {type: 'error'});
                }
            };
        }
    }, [dockviewApi, showToast, documents, documentStates, saveDocument]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only process if not in an input or textarea
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl/Cmd + S: Save layout
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveLayoutRef.current();
            }

            // Ctrl/Cmd + P: Toggle preview
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                togglePreview();
            }

            // Ctrl/Cmd + N: New document
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                createDocument({type: 'text'} as DocumentType);
            }

            // Ctrl/Cmd + E: Export document
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                exportDocument();
            }

            // Ctrl/Cmd + B: Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                toggleSidebar();
            }

            // Ctrl/Cmd + F: Global search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setIsSearchOpen(true);
            }

            // Alt + Space or Ctrl + Space: Quick search
            if (((e.altKey || e.ctrlKey) && e.key === ' ') || e.key === 'F1') {
                e.preventDefault();
                setIsSearchOpen(true);
            }

            // Ctrl+K or Cmd+K: Command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePreview, createDocument, exportDocument, toggleSidebar]);

    // Apply theme to body
    useEffect(() => {
        if (currentTheme.isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [currentTheme.isDark]);

    // Check if this is the first run and show welcome
    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('engineers-notepad-welcome-seen');
        if (!hasSeenWelcome && !isLoading) {
            setShowWelcome(true);
            // Mark welcome as seen for future visits
            localStorage.setItem('engineers-notepad-welcome-seen', 'true');
        }
    }, [isLoading]);

    // Render the UI
    return (<div
            className="app-container h-screen flex flex-col overflow-hidden"
            style={{
                backgroundColor: currentTheme.colors.background, color: currentTheme.colors.foreground
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
                onCancel={handleCancelDelete}
            />

            {/* Context Menu for document actions */}
            <ContextMenu
                items={getContextMenuItems()}
                position={contextMenu.position}
                onClose={closeContextMenu}
            />

            {/* Global Document Search */}
            <DocumentSearch
                documents={documents}
                onSelectDocument={openDocument}
                onClose={() => setIsSearchOpen(false)}
                isOpen={isSearchOpen}
            />

            {/* Welcome screen for first-time users */}
            <Welcome
                isOpen={showWelcome}
                onClose={() => setShowWelcome(false)}
                onCreateDocument={createDocument}
            />

            {/* Loading overlay */}
            <AnimatePresence>
                {isLoading && (<motion.div
                        initial={{opacity: 1}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.5}}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{backgroundColor: currentTheme.colors.background}}
                    >
                        <div className="text-center">
                            <i className="ri-quill-pen-line text-6xl mb-4"
                               style={{color: currentTheme.colors.accent}}></i>
                            <h1 className="text-2xl font-bold mb-2">Engineer's Notepad</h1>
                            <p className="text-lg opacity-70">Loading your workspace...</p>
                        </div>
                    </motion.div>)}
            </AnimatePresence>

            {/* App header */}
            <AppHeader
                onSaveLayout={saveLayoutRef.current}
                onTogglePreview={togglePreview}
                onExportDocument={exportDocument}
                onToggleSidebar={toggleSidebar}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenCommandPalette={() => setShowCommandPalette(true)}
                showSidebar={showSidebar}
            />

            <div className="app-content flex-1 flex overflow-hidden">
                {/* Sidebar - conditionally rendered based on showSidebar state */}
                {showSidebar && (<Sidebar
                        onToggleSidebar={toggleSidebar}
                        onSelectDocument={openDocument}
                    />)}

                {/* Main content area with dockview */}
                <div className="flex-1 overflow-hidden relative">
                    <DockviewReact
                        components={components}
                        onReady={handleDockviewReady}
                        watermarkComponent={CustomWatermarkPanel}
                        groupPanel={CustomGroupPanel}
                        className={`dockview-theme-${currentTheme.isDark ? 'dark' : 'light'}`}
                    />
                </div>
            </div>

            <footer className="app-footer p-2 text-xs border-t flex justify-between items-center"
                    style={{
                        backgroundColor: currentTheme.colors.sidebar, borderColor: currentTheme.colors.border
                    }}
            >
                <div className="flex space-x-4">
                    {activeDocument && (<>
                            <span className="flex items-center">
                                <i className="ri-file-type-line mr-1"></i>
                                {activeDocument.type.type.toUpperCase()}
                                {activeDocument.language && ` - ${activeDocument.language}`}
                            </span>
                            <span className="flex items-center">
                                <i className="ri-time-line mr-1"></i>
                                Last modified: {new Date(activeDocument.updatedAt).toLocaleString()}
                            </span>
                        </>)}
                </div>
                <div className="flex items-center">
                    <span className="flex items-center text-green-500 dark:text-green-400">
                        <i className="ri-save-line mr-1"></i>
                        Autosaved
                    </span>
                </div>
            </footer>
        </div>);
}

export default AppWithProviders;
