// src/components/Preview/DocumentPreviewPanel.tsx
import React, { useState, useEffect } from 'react';
import { IDockviewPanelProps } from 'dockview';
import { Document, calculateDocumentStats } from '../../types/document';
import { marked } from 'marked';
import { useSettings } from '../../contexts/SettingsContext';
import { getDocumentTypeIcon } from '../../types/document';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';

interface DocumentPreviewPanelProps {
  document: Document;
}

const DocumentPreviewPanel: React.FC<IDockviewPanelProps<DocumentPreviewPanelProps>> = (props) => {
  const { params } = props;
  const { document } = params;
  const { currentTheme, settings } = useSettings();
  const [stats, setStats] = useState(document ? calculateDocumentStats(document.content) : { wordCount: 0, charCount: 0, readingTimeMinutes: 0 });

  // Configure marked with syntax highlighting
  useEffect(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }, []);

  // Update stats when document changes
  useEffect(() => {
    if (document) {
      setStats(calculateDocumentStats(document.content));
    }
  }, [document?.content]);

  // Simple preview rendering based on document type
  const renderPreview = () => {
    if (!document) {
      return (
        <div className="preview text-preview p-6 text-center opacity-50">
          No document to preview
        </div>
      );
    }
    
    switch (document.type.type) {
      case 'markdown':
        return (
            <div
                className="preview markdown-preview p-6"
                dangerouslySetInnerHTML={{ __html: marked(document.content) }}
            />
        );
      case 'richtext':
        return (
            <div
                className="preview richtext-preview p-6"
                dangerouslySetInnerHTML={{ __html: document.content }}
            />
        );
      case 'html':
        return (
            <div className="h-full">
              <iframe
                  srcDoc={document.content}
                  className="preview html-preview w-full h-full border-0"
                  title={document.title}
                  sandbox="allow-scripts allow-same-origin"
              />
            </div>
        );
      case 'code':
        // For code, we show syntax-highlighted version
        return (
            <div className="preview code-preview p-6">
            <pre>
              <code className={document.language || 'plaintext'}>
                {document.content}
              </code>
            </pre>
            </div>
        );
      default:
        return (
            <pre className="preview text-preview p-6 whitespace-pre-wrap">
            {document.content}
          </pre>
        );
    }
  };

  return (
      <div
          className="preview-container h-full flex flex-col"
          style={{
            backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#ffffff',
            color: currentTheme.isDark ? '#d4d4d4' : '#333333',
          }}
      >
        <div
            className="preview-header flex justify-between items-center p-3 border-b"
            style={{ borderColor: currentTheme.colors.border }}
        >
          <div className="flex items-center">
            {document && (
              <>
                <i
                    className={`${getDocumentTypeIcon(document.type, document.language)} mr-2`}
                    style={{ color: currentTheme.colors.accent }}
                ></i>
                <h3 className="font-medium">Preview: {document.title}</h3>
              </>
            )}
            {!document && <h3 className="font-medium">Preview</h3>}
          </div>

          {settings.editor.showStatistics && (
              <div className="text-xs space-x-3" style={{ color: currentTheme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                <span>Words: {stats.wordCount}</span>
                <span>Read: ~{stats.readingTimeMinutes} min</span>
              </div>
          )}
        </div>

        <div className="preview-content flex-1 overflow-auto">
          {renderPreview()}
        </div>
      </div>
  );
};

export default DocumentPreviewPanel;
