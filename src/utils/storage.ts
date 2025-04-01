// src/utils/storage.ts
import { Document } from '../types/document';
import { SerializedDockview } from 'dockview';

// Helper function to load documents from localStorage
export const loadDocumentsFromStorage = (): Document[] => {
  try {
    const savedDocs = localStorage.getItem('engineer-notepad-docs');
    if (savedDocs) {
      return JSON.parse(savedDocs).map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt)
      }));
    }
  } catch (e) {
    console.error('Error loading documents from localStorage:', e);
  }
  return [];
};

// Helper function to load layout from localStorage
export const loadLayoutFromStorage = (): SerializedDockview | undefined => {
  try {
    const savedLayout = localStorage.getItem('engineer-notepad-layout');
    if (savedLayout) {
      return JSON.parse(savedLayout);
    }
  } catch (e) {
    console.error('Error loading layout from localStorage:', e);
  }
  return undefined;
};