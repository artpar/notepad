// src/services/fileImport.ts
import { Document, CodeLanguage } from '../types/document';
import * as StorageService from './storage';
import {DocumentType} from '../types/DocumentType';

/**
 * Detect document type based on file extension and content
 * @param fileName The name of the file
 * @param content The content of the file
 * @returns The detected document type and language (if applicable)
 */
const detectDocumentType = (
  fileName: string,
  content: string
): { type: DocumentType; language?: CodeLanguage } => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  // Detect markdown
  if (extension === 'md' || extension === 'markdown') {
    return { type: {type: 'markdown'} as DocumentType };
  }

  // Detect code files based on extensions
  switch (extension) {
    case 'js':
      return { type: {type: 'code'} as DocumentType, language: 'javascript' };
    case 'ts':
      return { type: {type: 'code'} as DocumentType, language: 'typescript' };
    case 'py':
      return { type: {type: 'code'} as DocumentType, language: 'python' };
    case 'java':
      return { type: {type: 'code'} as DocumentType, language: 'java' };
    case 'c':
      return { type: {type: 'code'} as DocumentType, language: 'c' };
    case 'cpp':
    case 'cc':
      return { type: {type: 'code'} as DocumentType, language: 'cpp' };
    case 'cs':
      return { type: {type: 'code'} as DocumentType, language: 'csharp' };
    case 'go':
      return { type: {type: 'code'} as DocumentType, language: 'go' };
    case 'rs':
      return { type: {type: 'code'} as DocumentType, language: 'rust' };
    case 'rb':
      return { type: {type: 'code'} as DocumentType, language: 'ruby' };
    case 'php':
      return { type: {type: 'code'} as DocumentType, language: 'php' };
    case 'html':
    case 'htm':
      return { type: {type: 'code'} as DocumentType, language: 'html' };
    case 'css':
      return { type: {type: 'code'} as DocumentType, language: 'css' };
    case 'json':
      return { type: {type: 'code'} as DocumentType, language: 'json' };
    case 'yml':
    case 'yaml':
      return { type: {type: 'code'} as DocumentType, language: 'yaml' };
    case 'xml':
      return { type: {type: 'code'} as DocumentType, language: 'xml' };
    case 'sql':
      return { type: {type: 'code'} as DocumentType, language: 'sql' };
    case 'sh':
    case 'bash':
      return { type: {type: 'code'} as DocumentType, language: 'bash' };
    case 'ps1':
      return { type: {type: 'code'} as DocumentType, language: 'powershell' };
    case 'txt':
    default:
      return { type: {type: 'text'} as DocumentType };
  }
};

/**
 * Import a file into the application
 * @param file The file to import
 * @returns Promise that resolves to the imported document's ID
 */
export const importFile = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const { type, language } = detectDocumentType(file.name, content);

        // Create a title from the file name (without extension)
        const title = file.name.split('.').slice(0, -1).join('.') || file.name;

        // Create and save the document
        const document: Document = {
          id: "",
          title,
          content,
          type,
          language,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const id = await StorageService.saveDocument(document);
        resolve(id);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Import multiple files into the application
 * @param files The files to import
 * @returns Promise that resolves to an array of imported document IDs
 */
export const importMultipleFiles = async (files: FileList): Promise<number[]> => {
  const importPromises = Array.from(files).map(file => importFile(file));
  return Promise.all(importPromises);
};

/**
 * Import settings from a JSON file
 * @param file The JSON file containing settings
 * @returns Promise that resolves to the imported settings
 */
export const importSettings = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const settings = JSON.parse(content);
        resolve(settings);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read settings file'));
    };

    reader.readAsText(file);
  });
};
