import React, { useCallback } from 'react';
import { Document } from '../../types/document';
import CodeEditor from './CodeEditor';
import MarkdownEditor from './MarkdownEditor';
import RichTextEditor from './RichTextEditor';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useDocuments } from '../../contexts/DocumentProvider.tsx';
import { useToast } from '../UI/ToastSystem';
import { useSettings } from '../../contexts/SettingsContext';

interface DocumentEditorProps {
  document: Document;
  readOnly?: boolean;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ document, readOnly = false }) => {
  const { setDocumentContent, setDocumentState } = useDocuments();
  const { showToast } = useToast();
  const { settings } = useSettings();

  // Use the auto-save hook
  const {
    updateContent,
    saveNow,
    isSaving,
    isDirty,
    lastSaved
  } = useAutoSave(document, {
    delay: settings.editor.autoSave ? settings.editor.autoSaveInterval * 1000 : 2000,
    enabled: !readOnly && settings.editor.autoSave,
    onSaveStart: () => {
      if (document.id) {
        setDocumentState(parseInt(document.id), { isSaving: true });
      }
    },
    onSaveComplete: () => {
      if (document.id) {
        setDocumentState(parseInt(document.id), {
          isSaving: false,
          isDirty: false,
          lastSaved: new Date()
        });
      }
      showToast('Document saved', { type: 'success', duration: 2000 });
    },
    onSaveError: (error) => {
      if (document.id) {
        setDocumentState(parseInt(document.id), { isSaving: false });
      }
      showToast(`Failed to save: ${error.message}`, { type: 'error' });
    }
  });

  // Handle content changes
  const handleContentChange = useCallback((content: string) => {
    if (readOnly || !document.id) return;

    // Update local state immediately for responsive UI
    setDocumentContent(parseInt(document.id), content);

    // Update document state to show it's dirty
    setDocumentState(parseInt(document.id), { isDirty: true });

    // Trigger auto-save
    updateContent(content);
  }, [document.id, readOnly, setDocumentContent, setDocumentState, updateContent]);

  // Get document type
  const docType = document ? (typeof document.type === 'string' ? document.type : document.type?.type || 'text') : 'text';

  // Render the appropriate editor
  const renderEditor = () => {
    if (!document) {
      return <div className="h-full flex items-center justify-center">Loading document...</div>;
    }

    const content = document.content || '';

    switch (docType) {
      case 'markdown':
        return (
          <MarkdownEditor
            content={content}
            onChange={handleContentChange}
          />
        );

      case 'richtext':
        return (
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
          />
        );

      case 'html':
      case 'code':
      case 'text':
      default:
        return (
          <CodeEditor
            content={content}
            language={docType === 'html' ? 'html' : document.language || 'plaintext'}
            onChange={handleContentChange}
            readOnly={readOnly}
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {renderEditor()}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 dark:text-gray-400">
            {docType.charAt(0).toUpperCase() + docType.slice(1)}
            {document.language && ` • ${document.language}`}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {isDirty && !isSaving && (
            <span className="text-yellow-600 dark:text-yellow-400">• Unsaved changes</span>
          )}
          {isSaving && (
            <span className="text-blue-600 dark:text-blue-400">Saving...</span>
          )}
          {!isDirty && !isSaving && lastSaved && (
            <span className="text-green-600 dark:text-green-400">
              Saved at {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
