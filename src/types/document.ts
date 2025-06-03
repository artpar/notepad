// src/types/document.ts
import {DocumentType} from "./DocumentType.tsx";

export type CodeLanguage =
    'javascript'
    | 'typescript'
    | 'python'
    | 'html'
    | 'css'
    | 'java'
    | 'c'
    | 'csharp'
    | 'go'
    | 'cpp'
    | 'rust'
    | 'ruby'
    | 'php'
    | 'json'
    | 'yaml'
    | 'sql'
    | 'bash'
    | 'powershell'
    | 'text'
    | 'code'
    | 'markdown'
    | 'plaintext'
    | 'xml';

export type DocType = 'text' | 'markdown' | 'richtext' | 'code' | 'html';

export interface Document {
    id?: string;
    title: string;
    type: DocumentType;
    language?: CodeLanguage;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
    favorite?: boolean;
    metadata?: {
        wordCount?: number;
        characterCount?: number;
        readingTime?: number;
        lastEditedBy?: string;
        version?: number;
        [key: string]: any;
    };
}

export interface TabInfo {
    id: string;
    title: string;
    isDirty: boolean;
    documentId?: number;
    type: 'document' | 'editor' | 'preview' | 'split' | 'terminal' | 'diagram';
}

export const DEFAULT_DOCUMENT_TEMPLATES: Record<DocType, (title: string) => Partial<Document>> = {
    text: (title) => ({
        title, type: {type: 'text'} as DocumentType, content: '',
    }), markdown: (title) => ({
        title, type: {type: 'markdown'} as DocumentType, content: `# ${title}\n\n## Introduction\n\nStart writing here...\n`,
    }), richtext: (title) => ({
        title, type: {type: 'richtext'} as DocumentType, content: `<h1>${title}</h1><p>Start writing here...</p>`,
    }), code: (title) => ({
        title, type: {type: 'code'} as DocumentType, language: 'javascript', content: '// Start coding here\n\n',
    }), html: (title) => ({
        title,
        type: {type: 'html'} as DocumentType,
        content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${title}</title>\n  <style>\n    /* Add your styles here */\n  </style>\n</head>\n<body>\n  <h1>${title}</h1>\n  <p>Your content here</p>\n\n  <script>\n    // Add your JavaScript here\n  </script>\n</body>\n</html>`,
    }),
};

export const getDocumentTypeIcon = (type: DocumentType, language?: CodeLanguage): string => {
    if (type.type === 'text') return 'ri-file-text-line';
    if (type.type === 'markdown') return 'ri-markdown-line';
    if (type.type === 'richtext') return 'ri-file-text-line';
    if (type.type === 'html') return 'ri-html5-line';

    // Code icons based on language
    if (language === 'javascript') return 'ri-javascript-line';
    if (language === 'typescript') return 'ri-code-s-slash-line';
    if (language === 'python') return 'ri-code-line';
    if (language === 'html') return 'ri-html5-line';
    if (language === 'css') return 'ri-css3-line';
    if (language === 'java') return 'ri-code-box-line';

    return 'ri-file-code-line';
};


export interface DocumentState {
    isDirty: boolean;
    isSaving: boolean;
    lastSaved?: Date;
    lastModified?: Date;
}


export interface DocumentStats {
    wordCount: number;
    characterCount: number;
    lineCount: number;
    readingTimeMinutes: number;
}

export const calculateDocumentStats = (content: string): DocumentStats => {
    const plainText = content.replace(/<[^>]*>/g, ' '); // Remove HTML tags

    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = plainText.replace(/\s/g, '').length;
    const lines = content.split(/\r\n|\r|\n/).length;

    // Average reading speed is ~200-250 words per minute
    const readingTimeMinutes = Math.max(1, Math.ceil(words.length / 225));

    return {
        wordCount: words.length, characterCount: characters, lineCount: lines, readingTimeMinutes
    };
};
