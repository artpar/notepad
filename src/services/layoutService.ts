// src/services/layoutService.ts
import { SerializedDockview, IDockviewApi } from 'dockview';

const LAYOUT_STORAGE_KEY = 'engineer-notepad-layout';

/**
 * Loads the saved layout from localStorage
 * @returns The saved layout or undefined if none exists
 */
export const loadLayout = (): SerializedDockview | undefined => {
  try {
    const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (savedLayout) {
      return JSON.parse(savedLayout);
    }
  } catch (e) {
    console.error('Error loading layout from localStorage:', e);
  }
  return undefined;
};

/**
 * Saves the current layout to localStorage
 * @param dockviewApi The dockview API instance
 * @returns A promise that resolves when the layout is saved
 */
export const saveLayout = (dockviewApi: IDockviewApi): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Get the layout from dockview
      const layout = dockviewApi.toJSON();
      
      // Process the layout to remove document objects and only keep IDs
      if (layout.panels) {
        Object.keys(layout.panels).forEach(panelKey => {
          const panel = layout.panels[panelKey];
          
          // If the panel has a document in its params, replace it with just the ID
          if (panel.params && panel.params.document) {
            const documentId = panel.params.document.id;
            if (documentId) {
              // Store only the document ID
              panel.params.documentId = documentId;
              // Remove the full document object
              delete panel.params.document;
            }
          }
          
          // Remove any callback functions that might be serialized
          if (panel.params && panel.params.onUpdate) {
            delete panel.params.onUpdate;
          }
        });
      }
      
      // Save the processed layout
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
      resolve();
    } catch (e) {
      console.error('Error saving layout to localStorage:', e);
      reject(e);
    }
  });
};

/**
 * Clears the saved layout from localStorage
 */
export const clearLayout = (): void => {
  localStorage.removeItem(LAYOUT_STORAGE_KEY);
};