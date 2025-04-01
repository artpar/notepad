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

  return (
    <div className="h-full flex flex-col">
      <div 
        className="flex justify-between items-center p-2"
        style={{ 
          backgroundColor: currentTheme.colors.sidebar,
          borderBottom: `1px solid ${currentTheme.colors.border}` 
        }}
      >
        <div className="flex space-x-1">
          <button
            className={`px-3 py-1 rounded ${previewMode === 'edit' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            onClick={() => setPreviewMode('edit')}
          >
            Edit
          </button>
          <button
            className={`px-3 py-1 rounded ${previewMode === 'split' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            onClick={() => setPreviewMode('split')}
          >
            Split
          </button>
          <button
            className={`px-3 py-1 rounded ${previewMode === 'preview' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            onClick={() => setPreviewMode('preview')}
          >
            Preview
          </button>
        </div>
        
        <div className="flex space-x-1">
          <button
            className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              const cursor = document.getSelection()?.toString() || '';
              onChange(content + `\n## Heading\n\n${cursor}`);
            }}
          >
            H
          </button>
          <button
            className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              const cursor = document.getSelection()?.toString() || '';
              onChange(content + `\n**${cursor || 'bold'}**`);
            }}
          >
            B
          </button>
          <button
            className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              const cursor = document.getSelection()?.toString() || '';
              onChange(content + `\n*${cursor || 'italic'}*`);
            }}
          >
            I
          </button>
          <button
            className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              onChange(content + '\n- List item\n- List item\n- List item');
            }}
          >
            • List
          </button>
          <button
            className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              onChange(content + '\n```\ncode block\n```');
            }}
          >
            Code
          </button>
          <button
            className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              onChange(content + '\n> Blockquote');
            }}
          >
            Quote
          </button>
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
