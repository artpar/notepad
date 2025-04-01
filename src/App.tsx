// src/App.tsx
import {useEffect, useMemo, useState, useCallback} from 'react';
import './App.css';
import Sidebar from './components/Layout/Sidebar';
import {useDocuments} from './contexts/DocumentContext';

import {DockviewReact, DockviewReadyEvent, IDockviewApi, PanelCollection, SerializedDockview} from 'dockview';
import 'dockview/dist/styles/dockview.css';

// Import components
import DocumentEditorPanel from './components/Editor/DocumentEditorPanel';
import DocumentPreviewPanel from './components/Preview/DocumentPreviewPanel';
import ExplorerPanel from './components/Explorer/ExplorerPanel';
import PropertiesPanel from './components/Properties/PropertiesPanel';
import {CustomGroupPanel, CustomWatermarkPanel} from './components/Panels/CustomPanels';
// Helper functions
import {loadDocumentsFromStorage, loadLayoutFromStorage} from './utils/storage';
import * as StorageService from './services/storage';
import 'remixicon/fonts/remixicon.css';

// Types for our document system
type DocType = 'text' | 'markdown' | 'javascript' | 'python' | 'html';

interface Document {
    id: string;
    title: string;
    content: string;
    type: DocType;
    createdAt: Date;
    updatedAt: Date;
}

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

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [dockviewApi, setDockviewApi] = useState<IDockviewApi | null>(null);
    const [savedLayout, setSavedLayout] = useState<SerializedDockview | undefined>(loadLayoutFromStorage());

    // Save layout to localStorage whenever it changes
    const saveLayout = () => {
        if (dockviewApi) {
            try {
                const layout = dockviewApi.toJSON();
                localStorage.setItem('engineer-notepad-layout', JSON.stringify(layout));
            } catch (e) {
                console.error('Error saving layout to localStorage:', e);
            }
        }
    };

    // Create a new document - wrapper around context function
    const createDocument = (type: DocType) => {
        createContextDocument(type).then(id => {
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
                }
            }
        });
    };

    // Update document title
    const updateDocumentTitle = (title: string) => {
        if (!activeDoc) return;

        const updatedDoc = {
            ...activeDoc,
            title,
            updatedAt: new Date()
        };

        saveDocument(updatedDoc);

        // Update panel title if it exists
        if (dockviewApi) {
            const panel = dockviewApi.getPanel(`editor-${activeDoc.id}`);
            if (panel) {
                panel.setTitle(title);
            }
        }
    };

    // Delete a document
    const deleteDocument = (id: number) => {
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
    };

    // Toggle dark mode
    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    // Export the current document
    const exportDocument = () => {
        if (!activeDoc) return;

        const blob = new Blob([activeDoc.content], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeDoc.title}.${getFileExtension(activeDoc.type)}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Get file extension based on document type
    const getFileExtension = (type: DocType): string => {
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

    // Open document in editor - wrapper around context function
    const openDocument = (doc: Document) => {
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
    };

    // Toggle preview for the current document
    const togglePreview = () => {
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
                    document: activeDoc,
                    onUpdate: (content: string) => updateDocument(doc.id!, content)
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
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeDoc, dockviewApi]);

    // Components for the dockview
    const components = useMemo<PanelCollection>(() => ({
        documentEditor: DocumentEditorPanel,
        documentPreview: DocumentPreviewPanel,
        explorer: ExplorerPanel,
        properties: PropertiesPanel
    }), []);

    // Handle dockview ready event
    const handleDockviewReady = (event: DockviewReadyEvent) => {
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
                        panelObject.params["onUpdate"] = ((panelObject) => {
                            return (content: string) => {
                                console.log("on update from layout", panelObject.params, content);
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
    };

    // Initialize default layout
    const initializeDefaultLayout = (api: IDockviewApi) => {
        // If we have an active document, open it
        if (activeDoc) {
            api.addPanel({
                id: `editor-${activeDoc.id}`,
                component: 'documentEditor',
                params: {
                    document: activeDoc,
                    onUpdate: (content: string) => {
                        console.log("on update", content);
                        updateDocument(activeDoc.id!, content);
                    }
                },
                title: activeDoc.title
            });
        }
    };

    // Render the UI
    return (
        <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <header className="app-header">
                <h1>Engineer's Notepad</h1>
                <div className="header-controls">
                    <div className="header-buttons">
                        <button onClick={toggleDarkMode}>
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <button onClick={saveLayout} title="Save Layout (Ctrl+S)">
                            Save Layout
                        </button>
                        {activeDoc && (
                            <>
                                <button onClick={togglePreview} title="Toggle Preview (Ctrl+P)">
                                    Toggle Preview
                                </button>
                                <button onClick={exportDocument} title="Export Document (Ctrl+E)">
                                    Export
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="app-content flex">
                <Sidebar
                    documents={documents}
                    activeDoc={activeDoc}
                    onSelectDocument={openDocument}
                    onCreateDocument={createDocument}
                    onDeleteDocument={deleteDocument}
                    onUpdateTitle={updateDocumentTitle}
                />
                <DockviewReact
                    components={components}
                    onReady={handleDockviewReady}
                    watermarkComponent={CustomWatermarkPanel}
                    groupPanel={CustomGroupPanel}
                    className="dockview-theme-light"
                />
            </div>

            <footer className="app-footer">
                <p>Engineer's Notepad | Keyboard Shortcuts: Ctrl+S (Save Layout), Ctrl+P (Preview), Ctrl+N (New), Ctrl+E
                    (Export)</p>
            </footer>
        </div>
    );
}

export default App;
