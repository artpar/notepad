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
    // Don't include the id field when adding new document
    const { id, ...documentWithoutId } = safeDocument;
    await db.documents.update(parseInt(document.id, 10), documentWithoutId);
    return parseInt(document.id, 10);
  } else {
    // Remove id field for new documents to let Dexie auto-generate it
    const { id, ...documentWithoutId } = safeDocument;
    const newId = await db.documents.add(documentWithoutId);
    return newId;
  }
};

export const getDocument = async (id: number): Promise<Document | undefined> => {
  return await db.documents.get(id);
};

export const getAllDocuments = async (): Promise<Document[]> => {
  return await db.documents.orderBy('updatedAt').reverse().toArray();
};

export const deleteDocument = async (id: number): Promise<void> => {
  await db.documents.delete(id);
};

export const searchDocuments = async (query: string): Promise<Document[]> => {
  // Simple search implementation - can be enhanced with full-text search
  return db.documents
    .filter(doc =>
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.content.toLowerCase().includes(query.toLowerCase())
    )
    .toArray();
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
