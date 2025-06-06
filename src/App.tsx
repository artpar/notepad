// src/App.tsx
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import './App.css';
import {useSettings} from './contexts/SettingsContext';
import {Document} from './types/document';

import {DockviewApi, DockviewReact, DockviewReadyEvent, PanelCollection, SerializedDockview} from 'dockview';
import 'dockview/dist/styles/dockview.css';
import 'remixicon/fonts/remixicon.css';
import {AnimatePresence, motion} from 'framer-motion';

// Import components
import Sidebar from './components/Layout/Sidebar';
import SimpleDocumentEditorPanel from './components/Editor/SimpleDocumentEditorPanel';
import DocumentPreviewPanel from './components/Preview/DocumentPreviewPanel';
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
import {useDocuments} from "./contexts/DocumentProvider.tsx";
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
        documentStates,
        openTabs,
        activeTabId
    } = useDocuments();

    const {currentTheme} = useSettings();
    const [dockviewApi, setDockviewApi] = useState<DockviewApi | null>(null);
    const [savedLayout] = useState<SerializedDockview | undefined>(LayoutService.loadLayout());
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
                const newDoc = documents.find(doc => doc.id && parseInt(doc.id) === id);
                if (newDoc) {
                    dockviewApi.addPanel({
                        id: `editor-${id}`,
                        component: 'documentEditor',
                        params: {document: newDoc, documentId: id},
                        title: newDoc.title
                    });
                    saveLayoutRef.current();

                    // Show success toast
                    showToast(`Created new ${type.type} document`, {
                        type: 'success', duration: 2000
                    });
                }
            }
        });
    }, [createContextDocument, documents, dockviewApi, updateDocument, showToast]);

    // Open document in editor
    const openDocument = useCallback((doc: Document) => {
        if (doc.id) {
            openContextDocument(parseInt(doc.id));
        }

        // Check if document is already open in editor
        if (dockviewApi && doc.id) {
            const panel = dockviewApi.getPanel(`editor-${doc.id}`);
            if (panel) {
                panel.focus();
            } else {
                // Open new editor panel
                dockviewApi.addPanel({
                    id: `editor-${doc.id}`,
                    component: 'documentEditor',
                    params: {document: doc, documentId: parseInt(doc.id)},
                    title: doc.title
                });
            }
        }
    }, [dockviewApi, openContextDocument, updateDocument]);


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
            const panelConfig = {
                id: previewPanelId,
                component: 'documentPreview',
                params: {
                    document: activeDocument
                },
                title: `Preview: ${activeDocument.title}`,
                position: undefined as { referencePanel: string; direction: string } | undefined
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
        // If we have an active document, open it
        if (activeDocument) {
            api.addPanel({
                id: `editor-${activeDocument.id}`,
                component: 'documentEditor',
                params: {document: activeDocument, documentId: parseInt(activeDocument.id)},
                title: activeDocument.title
            });
        }
    }, [activeDocument]);

    // Handle dockview ready event
    const handleDockviewReady = useCallback(async (event: DockviewReadyEvent) => {
        setDockviewApi(event.api);

        // If we have a saved layout, restore it
        if (savedLayout) {
            try {
                const panelKeys = Object.keys(savedLayout.panels);
                const panelsToRemove: string[] = [];

                for (const panelKey of panelKeys) {
                    const panelObject = savedLayout.panels[panelKey];
                    if (!panelObject.params) {
                        panelObject.params = {};
                    }

                    // Get the document ID from the layout
                    const docId = panelObject.params.documentId || panelObject.params.document?.id;
                    if (docId && (panelObject.component === 'documentEditor' || panelObject.component === 'documentPreview')) {
                        // Fetch the latest document from the database
                        const numericDocId = typeof docId === 'string' ? parseInt(docId, 10) : docId;
                        console.log(`[App] Loading document ${numericDocId} for panel ${panelKey}`);
                        const doc = await StorageService.getDocument(numericDocId);
                        console.log(`[App] Document ${numericDocId} loaded:`, doc);
                        if (doc) {
                            // Add the document to the panel params
                            panelObject.params.document = doc;
                            panelObject.params.documentId = numericDocId;

                            // Open the document in context to set it as active
                            if (panelObject.component === 'documentEditor') {
                                const numericId = typeof docId === 'string' ? parseInt(docId, 10) : docId;
                                openContextDocument(numericId);
                            }
                        } else {
                            console.warn(`Document with ID ${docId} not found in database`);
                            // Mark this panel for removal
                            panelsToRemove.push(panelKey);
                        }
                    }
                }

                // Remove panels for missing documents
                for (const panelKey of panelsToRemove) {
                    delete savedLayout.panels[panelKey];
                }

                // Only restore layout if there are still panels left
                if (Object.keys(savedLayout.panels).length > 0) {
                    event.api.fromJSON(savedLayout);
                } else {
                    console.log('No valid panels in saved layout, initializing default layout');
                    initializeDefaultLayout(event.api);
                }

                // Active tab restoration will be handled by the separate useEffect
                // that syncs dockview panels with saved tabs
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

        // Track active panel changes
        event.api.onDidActivePanelChange((panel) => {
            if (panel && panel.id.startsWith('editor-')) {
                const docId = panel.id.replace('editor-', '');
                const numericId = parseInt(docId, 10);
                if (!isNaN(numericId)) {
                    console.log(`[App] Active panel changed, setting document: ${numericId}`);
                    openContextDocument(numericId);
                }
            }
        });

        // Set loading to false once everything is initialized
        setIsLoading(false);
    }, [savedLayout, initializeDefaultLayout, openContextDocument]);

    // Components for the dockview
    const components = useMemo<PanelCollection>(() => ({
        documentEditor: SimpleDocumentEditorPanel,
        documentPreview: DocumentPreviewPanel,
        properties: PropertiesPanel
    }), []);

    // Sync dockview panels with saved tabs when dockview is ready
    useEffect(() => {
        if (dockviewApi && !isLoading && openTabs.length > 0) {
            // Small delay to ensure layout is fully restored first
            const timeoutId = setTimeout(() => {
                // Check if we need to open any tabs that aren't already open
                openTabs.forEach(tab => {
                    if (tab.documentId) {
                        const panelId = `editor-${tab.documentId}`;
                        const existingPanel = dockviewApi.getPanel(panelId);
                        if (!existingPanel) {
                            // Panel doesn't exist, open it
                            const doc = documents.find(d => d.id === String(tab.documentId));
                            if (doc) {
                                dockviewApi.addPanel({
                                    id: panelId,
                                    component: 'documentEditor',
                                    params: { document: doc, documentId: tab.documentId },
                                    title: tab.title
                                });
                            }
                        }
                    }
                });

                // Focus the active tab if it exists
                if (activeTabId) {
                    const activeTab = openTabs.find(t => t.id === activeTabId);
                    if (activeTab && activeTab.documentId) {
                        const panelId = `editor-${activeTab.documentId}`;
                        const panel = dockviewApi.getPanel(panelId);
                        if (panel) {
                            console.log(`[App] Focusing active tab panel: ${activeTab.documentId}`);
                            panel.focus();
                            // Also ensure the document is set as active
                            openContextDocument(activeTab.documentId);
                        }
                    }
                }
            }, 200); // Give layout restoration time to complete

            return () => clearTimeout(timeoutId);
        }
    }, [dockviewApi, isLoading, openTabs, activeTabId, documents, openContextDocument]);

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
                        const doc = documents.find(d => d.id && parseInt(d.id) === id);
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

        <div className="app-content flex-1 flex overflow-hidden">
            {/* Sidebar - conditionally rendered based on showSidebar state */}
            {showSidebar && (<Sidebar
                onToggleSidebar={toggleSidebar}
                onSelectDocument={openDocument}
            />)}

            {/* Main content area with dockview */}
            <div className="flex-1 overflow-hidden relative">
                {/* Show sidebar button when sidebar is hidden */}
                {!showSidebar && (<button
                        onClick={toggleSidebar}
                        className="absolute top-4 left-4 z-40 p-2 rounded-md shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                        style={{
                            backgroundColor: currentTheme.colors.background,
                            border: `1px solid ${currentTheme.colors.border}`,
                            color: currentTheme.colors.buttonText
                        }}
                        title="Show Sidebar (Ctrl+B)"
                    >
                        <i className="ri-menu-unfold-line text-lg"></i>
                    </button>)}

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
                {activeDocument && (<span className="flex items-center">
                            <i className="ri-file-type-line mr-1"></i>
                        {activeDocument.type.type.toUpperCase()}
                        {activeDocument.language && ` - ${activeDocument.language}`}
                        </span>)}
            </div>
            <div className="text-gray-500">
                Offline Mode
            </div>
        </footer>
    </div>);
}

export default AppWithProviders;
