// src/components/Editor/MarkdownEditor.tsx
import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import CodeEditor from './CodeEditor';
import { marked } from 'marked';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ content, onChange }) => {
  const { currentTheme } = useSettings();
  const [previewMode, setPreviewMode] = useState<'split' | 'edit' | 'preview'>('split');

  // Convert markdown to HTML for preview
  const renderMarkdown = (markdownContent: string) => {
    try {
      return marked(markdownContent);
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return '<div class="text-red-500">Error rendering markdown</div>';
    }
  };

  const insertMarkdown = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = document.querySelector('textarea');
    if (!textarea) {
      onChange(content + before + defaultText + after);
      return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    onChange(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* View Mode Selector */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                previewMode === 'edit'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              onClick={() => setPreviewMode('edit')}
              title="Edit mode"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </span>
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                previewMode === 'split'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              onClick={() => setPreviewMode('split')}
              title="Split view"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Split
              </span>
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                previewMode === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              onClick={() => setPreviewMode('preview')}
              title="Preview mode"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </span>
            </button>
          </div>
          
          {/* Formatting Tools */}
          {previewMode !== 'preview' && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 mr-2">
                <button
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => insertMarkdown('## ', '\n', 'Heading')}
                  title="Heading (Ctrl+H)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10m-7 4h4" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold"
                  onClick={() => insertMarkdown('**', '**', 'bold text')}
                  title="Bold (Ctrl+B)"
                >
                  B
                </button>
                <button
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors italic"
                  onClick={() => insertMarkdown('*', '*', 'italic text')}
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>
              </div>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              
              <div className="flex items-center gap-1">
                <button
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => insertMarkdown('- ', '\n', 'List item')}
                  title="Bullet List"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => insertMarkdown('[', '](url)', 'link text')}
                  title="Insert Link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => insertMarkdown('```\n', '\n```', 'code')}
                  title="Code Block"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>
                <button
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => insertMarkdown('> ', '\n', 'Quote')}
                  title="Blockquote"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {previewMode === 'edit' && (
          <CodeEditor 
            content={content} 
            language="markdown"
            onChange={onChange}
          />
        )}
        
        {previewMode === 'preview' && (
          <div 
            className="h-full w-full p-4 overflow-auto markdown-preview"
            style={{
              backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#ffffff',
              color: currentTheme.isDark ? '#d4d4d4' : '#333333',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}
        
        {previewMode === 'split' && (
          <div className="h-full flex overflow-hidden">
            <div className="w-1/2 h-full overflow-hidden">
              <CodeEditor 
                content={content} 
                language="markdown"
                onChange={onChange}
              />
            </div>
            <div 
              className="w-1/2 h-full p-4 overflow-auto markdown-preview"
              style={{
                backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#ffffff',
                color: currentTheme.isDark ? '#d4d4d4' : '#333333',
                borderLeft: `1px solid ${currentTheme.colors.border}`
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
