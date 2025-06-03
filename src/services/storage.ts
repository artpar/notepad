// src/services/storage.ts
import Dexie, { Table } from 'dexie';
import {Document} from "../types/document"
export interface Snippet {
  id?: number;
  name: string;
  content: string;
  language: string;
  tags?: string[];
}

export interface Settings {
  id?: number;
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  autosaveInterval: number;
  customKeybindings?: Record<string, string>;
}

// Create Dexie database
class NotepadDatabase extends Dexie {
  documents!: Table<Document>;
  snippets!: Table<Snippet>;
  settings!: Table<Settings>;

  constructor() {
    super('EngineersNotepadDB');
    this.version(1).stores({
      documents: '++id, title, type, tags, updatedAt',
      snippets: '++id, name, language, tags',
      settings: '++id'
    });
  }
}

const db = new NotepadDatabase();

// Initialize default settings if not exists
export const initializeSettings = async (): Promise<Settings> => {
  const settingsCount = await db.settings.count();

  if (settingsCount === 0) {
    const defaultSettings: Settings = {
      theme: 'system',
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      autosaveInterval: 5000,
    };

    await db.settings.add(defaultSettings);
    return defaultSettings;
  }

  return db.settings.toCollection().first() as Promise<Settings>;
};

// Document operations
export const saveDocument = async (document: Document): Promise<number> => {
  try {
    // Create a safe copy of the document to prevent serialization issues
    const safeDocument = {
      ...document,
      // Ensure content is always a string
      content: document.content || '',
      // Ensure dates are properly serialized
      createdAt: document.createdAt instanceof Date ? document.createdAt : new Date(document.createdAt || Date.now()),
      updatedAt: new Date()
    };

    // Check if document has a valid ID (not undefined, not empty string)
    if (document.id && document.id !== "") {
      const numericId = parseInt(document.id, 10);
      if (isNaN(numericId)) {
        throw new Error(`Invalid document ID: ${document.id}`);
      }
      
      // Don't include the id field when updating
      const { id, ...documentWithoutId } = safeDocument;
      
      // Check if document exists before updating
      const exists = await db.documents.get(numericId);
      if (!exists) {
        console.warn(`Document with ID ${numericId} not found, creating new document instead`);
        const newId = await db.documents.add(documentWithoutId);
        return newId;
      }
      
      await db.documents.update(numericId, documentWithoutId);
      return numericId;
    } else {
      // Remove id field for new documents to let Dexie auto-generate it
      const { id, ...documentWithoutId } = safeDocument;
      const newId = await db.documents.add(documentWithoutId);
      return newId;
    }
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
};

export const getDocument = async (id: number): Promise<Document | undefined> => {
  console.log(`[Storage] Getting document with ID: ${id}`);
  try {
    const doc = await db.documents.get(id);
    console.log(`[Storage] Raw document from DB:`, doc);
    
    if (doc) {
      // Create a new object to avoid modifying the original
      const processedDoc: Document = { ...doc };
      
      // Ensure document has string ID
      processedDoc.id = String(id);
      
      // Ensure document has proper type structure
      if (typeof processedDoc.type === 'string') {
        const typeStr = processedDoc.type as string;
        let icon = 'ri-file-text-line';
        
        // Set appropriate icon based on type
        if (typeStr === 'markdown') icon = 'ri-markdown-line';
        else if (typeStr === 'code') icon = 'ri-code-line';
        else if (typeStr === 'html') icon = 'ri-html5-line';
        else if (typeStr === 'richtext') icon = 'ri-file-text-line';
        
        processedDoc.type = {
          type: typeStr,
          label: typeStr.charAt(0).toUpperCase() + typeStr.slice(1),
          icon: icon,
          description: `${typeStr.charAt(0).toUpperCase() + typeStr.slice(1)} document`
        };
      }
      
      console.log(`[Storage] Processed document:`, processedDoc);
      return processedDoc;
    }
    
    console.log(`[Storage] Document not found`);
    return undefined;
  } catch (error) {
    console.error(`[Storage] Error getting document:`, error);
    return undefined;
  }
};

export const getAllDocuments = async (): Promise<Document[]> => {
  const docs = await db.documents.orderBy('updatedAt').reverse().toArray();
  
  // Ensure all documents have proper structure
  return docs.map(doc => {
    // Dexie automatically includes the id field when using ++id
    const processedDoc = { ...doc };
    
    // Ensure ID is a string
    if (processedDoc.id !== undefined) {
      processedDoc.id = String(processedDoc.id);
    }
    
    // Ensure document has proper type structure
    if (typeof processedDoc.type === 'string') {
      const typeStr = processedDoc.type as string;
      let icon = 'ri-file-text-line';
      
      // Set appropriate icon based on type
      if (typeStr === 'markdown') icon = 'ri-markdown-line';
      else if (typeStr === 'code') icon = 'ri-code-line';
      else if (typeStr === 'html') icon = 'ri-html5-line';
      else if (typeStr === 'richtext') icon = 'ri-file-text-line';
      
      processedDoc.type = {
        type: typeStr,
        label: typeStr.charAt(0).toUpperCase() + typeStr.slice(1),
        icon: icon,
        description: `${typeStr.charAt(0).toUpperCase() + typeStr.slice(1)} document`
      };
    }
    
    return processedDoc as Document;
  });
};

export const deleteDocument = async (id: number): Promise<void> => {
  await db.documents.delete(id);
};

export const searchDocuments = async (query: string): Promise<Document[]> => {
  // Simple search implementation - can be enhanced with full-text search
  const docs = await db.documents
    .filter(doc =>
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.content.toLowerCase().includes(query.toLowerCase())
    )
    .toArray();
  
  // Ensure all documents have proper structure
  return docs.map(doc => {
    // Dexie automatically includes the id field when using ++id
    const processedDoc = { ...doc };
    
    // Ensure ID is a string
    if (processedDoc.id !== undefined) {
      processedDoc.id = String(processedDoc.id);
    }
    
    // Ensure document has proper type structure
    if (typeof processedDoc.type === 'string') {
      const typeStr = processedDoc.type as string;
      let icon = 'ri-file-text-line';
      
      // Set appropriate icon based on type
      if (typeStr === 'markdown') icon = 'ri-markdown-line';
      else if (typeStr === 'code') icon = 'ri-code-line';
      else if (typeStr === 'html') icon = 'ri-html5-line';
      else if (typeStr === 'richtext') icon = 'ri-file-text-line';
      
      processedDoc.type = {
        type: typeStr,
        label: typeStr.charAt(0).toUpperCase() + typeStr.slice(1),
        icon: icon,
        description: `${typeStr.charAt(0).toUpperCase() + typeStr.slice(1)} document`
      };
    }
    
    return processedDoc as Document;
  });
};

// Snippet operations
export const saveSnippet = async (snippet: Snippet): Promise<number> => {
  if (snippet.id) {
    await db.snippets.update(snippet.id, snippet);
    return snippet.id;
  } else {
    return await db.snippets.add(snippet);
  }
};

export const getAllSnippets = async (): Promise<Snippet[]> => {
  return await db.snippets.toArray();
};

export const deleteSnippet = async (id: number): Promise<void> => {
  await db.snippets.delete(id);
};

// Settings operations
export const getSettings = async (): Promise<Settings> => {
  const settings = await db.settings.toCollection().first();
  return settings || initializeSettings();
};

export const updateSettings = async (settings: Partial<Settings>): Promise<void> => {
  const currentSettings = await getSettings();
  await db.settings.update(currentSettings.id!, settings);
};

export default db;
