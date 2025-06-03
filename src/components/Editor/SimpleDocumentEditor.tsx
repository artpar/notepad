import React from 'react';
import { Document } from '../../types/document';
import { useAutoSave } from '../../hooks/useAutoSave';
import CodeEditor from './CodeEditor';
import MarkdownEditor from './MarkdownEditor';
import RichTextEditor from './RichTextEditor';
import { useSettings } from '../../contexts/SettingsContext';
import SimpleSaveStatusIndicator from '../UI/SimpleSaveStatusIndicator';

interface SimpleDocumentEditorProps {
  document: Document;
  onSaveComplete?: () => void;
}

const SimpleDocumentEditor: React.FC<SimpleDocumentEditorProps> = ({ 
  document, 
  onSaveComplete 
}) => {
  const { currentTheme } = useSettings();
  
  // Get save delay based on document size
  const getSaveDelay = (size: number) => {
    if (size < 10000) return 500;
    if (size < 100000) return 1000;
    return 2000;
  };
  
  // Use auto-save hook
  const { saveDocument, isSaving, isDirty, lastSaved, lastModified, error } = useAutoSave({
    document,
    debounceMs: getSaveDelay(document.content?.length || 0),
    onSaveComplete,
    onSaveError: (err) => {
      console.error('Failed to save document:', err);
    }
  });
  
  // Handle content changes
  const handleContentChange = (newContent: string) => {
    saveDocument(newContent);
  };
  
  // Render appropriate editor based on document type
  const renderEditor = () => {
    switch (document.type?.type) {
      case 'markdown':
        return (
          <MarkdownEditor
            content={document.content}
            onChange={handleContentChange}
          />
        );
      case 'richtext':
        return (
          <RichTextEditor
            content={document.content}
            onChange={handleContentChange}
          />
        );
      case 'code':
      case 'text':
      default:
        return (
          <CodeEditor
            content={document.content}
            language={document.language || 'plaintext'}
            onChange={handleContentChange}
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
      
      {/* Save status bar */}
      <div 
        className="h-6 px-2 flex items-center justify-between text-xs"
        style={{
          backgroundColor: currentTheme.colors.sidebar,
          borderTop: `1px solid ${currentTheme.colors.border}`,
        }}
      >
        <div className="flex items-center space-x-2">
          <span>{document.title}</span>
          <span className="text-gray-500">•</span>
          <span>{
            typeof document.type === 'string' 
              ? document.type.toUpperCase() 
              : document.type?.type?.toUpperCase() || 'TEXT'
          }</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {error && (
            <span className="text-red-500 text-xs">
              <i className="ri-error-warning-line mr-1"></i>
              Save failed
            </span>
          )}
          <SimpleSaveStatusIndicator
            isSaving={isSaving}
            isDirty={isDirty}
            lastSaved={lastSaved}
            lastModified={lastModified}
            saveDelay={getSaveDelay(document.content?.length || 0)}
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleDocumentEditor;