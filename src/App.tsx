// src/App.tsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import './App.css';
import Sidebar from './components/Layout/Sidebar';
import AppHeader from './components/Layout/AppHeader';
import { useDocuments } from './contexts/DocumentContext';
import { useSettings } from './contexts/SettingsContext';

import { DockviewReact, DockviewReadyEvent, IDockviewApi, PanelCollection, SerializedDockview } from 'dockview';
import 'dockview/dist/styles/dockview.css';

// Import components
import DocumentEditorPanel from './components/Editor/DocumentEditorPanel';
import DocumentPreviewPanel from './components/Preview/DocumentPreviewPanel';
import ExplorerPanel from './components/Explorer/ExplorerPanel';
import PropertiesPanel from './components/Properties/PropertiesPanel';
import { CustomGroupPanel, CustomWatermarkPanel } from './components/Panels/CustomPanels';

// Helper functions
import { loadDocumentsFromStorage, loadLayoutFromStorage } from './utils/storage';
import * as StorageService from './services/storage';
import 'remixicon/fonts/remixicon.css';
import { getDocument } from "./services/storage";
import { motion, AnimatePresence } from 'framer-motion';

function App() {
    // Use the document context instead of managing documents locally
    const {
        documents,
        activeDocument: activeDoc,
        updateDocument,
        createDocument: createContextDocument,
        openDocument: openContextDocument,
        saveDocument,
        closeDocument
    } = useDocuments();

    const { currentTheme } = useSettings();
    const [dockviewApi, setDockviewApi] = useState<IDockviewApi | null>(null);
    const [savedLayout, setSavedLayout] = useState<SerializedDockview | undefined>(loadLayoutFromStorage());
    const [showSidebar, setShowSidebar] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Save layout to localStorage whenever it changes
    const saveLayout = useCallback(() => {
        if (dockviewApi) {
            try {
                const layout = dockviewApi.toJSON();
                localStorage.setItem('engineer-notepad-layout', JSON.stringify(layout));
            } catch (e) {
                console.error('Error saving layout to localStorage:', e);
            }
        }
    }, [dockviewApi]);

    // Create a new document - wrapper around context function
    const createDocument = useCallback((type: string, language?: string) => {
        createContextDocument(type, language).then(id => {
            // Open the document in the editor
            if (dockviewApi) {
                const newDoc = documents.find(doc => doc.id === id);
                if (newDoc) {
                    dockviewApi.addPanel({
                        id: `editor-${id}`,
                        component: 'documentEditor',
                        params: {
                            document: newDoc,
                            onUpdate: (content: string) => updateDocument(id, content)
                        },
                        title: newDoc.title
                    });
                    saveLayout();
                }
            }
        });
    }, [createContextDocument, documents, dockviewApi, updateDocument, saveLayout]);

    // Update document title
    const updateDocumentTitle = useCallback((title: string) => {
        if (!activeDoc) return;

        const updatedDoc = {
            ...activeDoc,
            title,
            updatedAt: new Date()
        };

        saveDocument(updatedDoc);

        // Update panel title if it exists
        saveLayout();
        if (dockviewApi) {
            const panel = dockviewApi.getPanel(`editor-${activeDoc.id}`);
            if (panel) {
                panel.setTitle(title);
            }
        }
    }, [activeDoc, dockviewApi, saveDocument, saveLayout]);

    // Delete a document
    const deleteDocument = useCallback((id: number) => {
        closeDocument(id);

        // Delete the document from storage
        StorageService.deleteDocument(id)
            .then(() => {
                console.log(`Document ${id} deleted successfully`);
            })
            .catch(error => {
                console.error(`Error deleting document ${id}:`, error);
            });

        // Close related panels if they exist
        saveLayout();
        if (dockviewApi) {
            try {
                // Instead of trying to remove panels directly, let's get all groups and panels
                const groups = dockviewApi.groups;

                // Iterate through all groups to find and close panels by ID
                groups.forEach(group => {
                    const panels = group.panels;

                    // Look for editor and preview panels for this document
                    panels.forEach(panel => {
                        if (panel.id === `editor-${id}` || panel.id === `preview-${id}`) {
                            // Use the panel's close method which is safer
                            panel.close();
                        }
                    });
                });
            } catch (error) {
                console.error(`Error removing panels for document ${id}:`, error);
            }
        }
    }, [closeDocument, dockviewApi, saveLayout]);

    // Toggle sidebar visibility
    const toggleSidebar = useCallback(() => {
        setShowSidebar(prev => !prev);
    }, []);

    // Export the current document
    const exportDocument = useCallback(() => {
        if (!activeDoc) return;

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

        const blob = new Blob([activeDoc.content], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeDoc.title}.${getFileExtension(activeDoc.type)}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [activeDoc]);

    // Open document in editor - wrapper around context function
    const openDocument = useCallback((doc: any) => {
        openContextDocument(doc.id!);

        // Check if document is already open in editor
        if (dockviewApi) {
            const panel = dockviewApi.getPanel(`editor-${doc.id}`);
            if (panel) {
                panel.focus();
            } else {
                // Open new editor panel
                dockviewApi.addPanel({
                    id: `editor-${doc.id}`,
                    component: 'documentEditor',
                    params: {
                        document: doc,
                        onUpdate: (content: string) => updateDocument(doc.id!, content)
                    },
                    title: doc.title
                });
            }
        }
    }, [dockviewApi, openContextDocument, updateDocument]);

    // Toggle preview for the current document
    const togglePreview = useCallback(() => {
        if (!activeDoc || !dockviewApi) return;

        const previewPanelId = `preview-${activeDoc.id}`;
        const editorPanelId = `editor-${activeDoc.id}`;
        const existingPanel = dockviewApi.getPanel(previewPanelId);
        const editorPanel = dockviewApi.getPanel(editorPanelId);

        if (existingPanel) {
            existingPanel.close();
        } else {
            // Create panel config
            const panelConfig: any = {
                id: previewPanelId,
                component: 'documentPreview',
                params: {
                    document: activeDoc
                },
                title: `Preview: ${activeDoc.title}`
            };

            // Only add position if editor panel exists
            if (editorPanel) {
                panelConfig.position = {
                    referencePanel: editorPanelId,
                    direction: 'right'
                };
            }

            dockviewApi.addPanel(panelConfig);
        }
    }, [activeDoc, dockviewApi]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only process if not in an input or textarea
            if ((e.target as HTMLElement).tagName === 'INPUT' ||
                (e.target as HTMLElement).tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl/Cmd + S: Save layout
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveLayout();
            }

            // Ctrl/Cmd + P: Toggle preview
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                togglePreview();
            }

            // Ctrl/Cmd + N: New document
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                createDocument('text');
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
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeDoc, dockviewApi, saveLayout, togglePreview, createDocument, exportDocument, toggleSidebar]);

    // Components for the dockview
    const components = useMemo<PanelCollection>(() => ({
        documentEditor: DocumentEditorPanel,
        documentPreview: DocumentPreviewPanel,
        explorer: ExplorerPanel,
        properties: PropertiesPanel
    }), []);

    // Handle dockview ready event
    const handleDockviewReady = useCallback(async (event: DockviewReadyEvent) => {
        setDockviewApi(event.api);

        // If we have a saved layout, restore it
        if (savedLayout) {
            try {
                const panelKeys = Object.keys(savedLayout.panels);
                for (const panelKey of panelKeys) {
                    const panelObject = savedLayout.panels[panelKey];
                    if (!panelObject.params){
                        panelObject.params = {};
                    }

                    // Create a reference to the document ID instead of the document itself
                    const docId = panelObject.params.document?.id;
                    if (docId) {
                        // Use the updateDocument function directly without capturing it in a closure
                        const doc = await getDocument(docId);
                        panelObject.params.document = doc;
                        panelObject.params["onUpdate"] = ((panelObject) => {
                            return (content: string) => {
                                updateDocument(panelObject.params.document.id, content);
                            }
                        })(panelObject);
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
            saveLayout();
        });

        // Set loading to false once everything is initialized
        setIsLoading(false);
    }, [savedLayout, updateDocument]);

    // Initialize default layout
    const initializeDefaultLayout = useCallback((api: IDockviewApi) => {
        // Add explorer panel by default
        api.addPanel({
            id: 'explorer',
            component: 'explorer',
            params: {
                documents,
                onSelectDocument: openDocument,
                onCreateDocument: createDocument,
                onDeleteDocument: deleteDocument
            },
            title: 'Explorer'
        });

        // If we have an active document, open it
        if (activeDoc) {
            api.addPanel({
                id: `editor-${activeDoc.id}`,
                component: 'documentEditor',
                params: {
                    document: activeDoc,
                    onUpdate: (content: string) => {
                        updateDocument(activeDoc.id!, content);
                    }
                },
                title: activeDoc.title
            });
        }
    }, [activeDoc, documents, openDocument, createDocument, deleteDocument, updateDocument]);

    // Apply theme to body
    useEffect(() => {
        if (currentTheme.isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [currentTheme.isDark]);

    // Render the UI
    return (
        <div
            className="app-container h-screen flex flex-col overflow-hidden"
            style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.foreground
            }}
        >
            {/* Loading overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ backgroundColor: currentTheme.colors.background }}
                    >
                        <div className="text-center">
                            <i className="ri-quill-pen-line text-6xl mb-4" style={{ color: currentTheme.colors.accent }}></i>
                            <h1 className="text-2xl font-bold mb-2">Engineer's Notepad</h1>
                            <p className="text-lg opacity-70">Loading your workspace...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* App header */}
            <AppHeader
                onSaveLayout={saveLayout}
                onTogglePreview={togglePreview}
                onExportDocument={exportDocument}
                onToggleSidebar={toggleSidebar}
                showSidebar={showSidebar}
            />

            <div className="app-content flex-1 flex overflow-hidden">
                {/* Sidebar - conditionally rendered based on showSidebar state */}
                {showSidebar && (
                    <Sidebar
                        documents={documents}
                        activeDoc={activeDoc}
                        onSelectDocument={openDocument}
                        onCreateDocument={createDocument}
                        onDeleteDocument={deleteDocument}
                        onUpdateTitle={updateDocumentTitle}
                    />
                )}

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
                        backgroundColor: currentTheme.colors.sidebar,
                        borderColor: currentTheme.colors.border
                    }}
            >
                <div className="flex space-x-4">
                    {activeDoc && (
                        <>
                            <span className="flex items-center">
                                <i className="ri-file-type-line mr-1"></i>
                                {activeDoc.type.toUpperCase()}
                                {activeDoc.language && ` - ${activeDoc.language}`}
                            </span>
                            <span className="flex items-center">
                                <i className="ri-time-line mr-1"></i>
                                Last modified: {new Date(activeDoc.updatedAt).toLocaleString()}
                            </span>
                        </>
                    )}
                </div>
                <div className="flex items-center">
                    <span className="flex items-center text-green-500 dark:text-green-400">
                        <i className="ri-save-line mr-1"></i>
                        Autosaved
                    </span>
                </div>
            </footer>
        </div>
    );
}

export default App;
