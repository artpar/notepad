// src/services/fileImport.ts
import { Document, DocumentType, CodeLanguage } from '../types/document';
import * as StorageService from './storage';

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
    return { type: 'markdown' };
  }
  
  // Detect code files based on extensions
  switch (extension) {
    case 'js':
      return { type: 'code', language: 'javascript' };
    case 'ts':
      return { type: 'code', language: 'typescript' };
    case 'py':
      return { type: 'code', language: 'python' };
    case 'java':
      return { type: 'code', language: 'java' };
    case 'c':
      return { type: 'code', language: 'c' };
    case 'cpp':
    case 'cc':
      return { type: 'code', language: 'cpp' };
    case 'cs':
      return { type: 'code', language: 'csharp' };
    case 'go':
      return { type: 'code', language: 'go' };
    case 'rs':
      return { type: 'code', language: 'rust' };
    case 'rb':
      return { type: 'code', language: 'ruby' };
    case 'php':
      return { type: 'code', language: 'php' };
    case 'html':
    case 'htm':
      return { type: 'code', language: 'html' };
    case 'css':
      return { type: 'code', language: 'css' };
    case 'json':
      return { type: 'code', language: 'json' };
    case 'yml':
    case 'yaml':
      return { type: 'code', language: 'yaml' };
    case 'xml':
      return { type: 'code', language: 'xml' };
    case 'sql':
      return { type: 'code', language: 'sql' };
    case 'sh':
    case 'bash':
      return { type: 'code', language: 'bash' };
    case 'ps1':
      return { type: 'code', language: 'powershell' };
    case 'txt':
    default:
      return { type: 'text' };
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
