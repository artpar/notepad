// src/components/Editor/CodeEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { languages } from '@codemirror/language-data';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import { useSettings } from '../../contexts/SettingsContext';
import { CodeLanguage } from '../../types/document';

interface CodeEditorProps {
  content: string;
  language: CodeLanguage;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  content,
  language,
  onChange,
  readOnly = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { settings, currentTheme } = useSettings();
  const [editorContent, setEditorContent] = useState(content);

  // Get the language extension based on the language prop
  const getLanguageExtension = (lang: CodeLanguage) => {
    switch (lang) {
      case 'javascript':
      case 'typescript':
        return javascript();
      case 'python':
        return python();
      case 'html':
      case 'xml':
        return html();
      case 'markdown':
        return markdown();
      default:
        // Default to javascript for now, can be expanded for more languages
        return javascript();
    }
  };

  useEffect(() => {
    if (!editorRef.current) return;

    // Clean up previous editor instance
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    // Create editor state
    const startState = EditorState.create({
      doc: content,
      extensions: [
        getLanguageExtension(language),
        lineNumbers(),
        highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle),
        EditorView.theme({
          "&": {
            fontSize: `${settings.editor.fontSize}px`,
            height: "100%",
          },
          ".cm-content": {
            fontFamily: "monospace",
          },
          "&.cm-focused": {
            outline: "none"
          },
          ".cm-line": {
            padding: "0 4px",
            lineHeight: "1.6",
            fontFamily: "monospace",
          },
          ".cm-matchingBracket": {
            backgroundColor: "rgba(128, 128, 255, 0.3)",
            border: "1px solid #88f"
          },
        }, { dark: currentTheme.isDark }),
        keymap.of([
          ...defaultKeymap,
          ...(settings.editor.indentWithTabs ? [indentWithTab] : [])
        ]),
        EditorState.tabSize.of(settings.editor.tabSize),
        settings.editor.wordWrap ? EditorView.lineWrapping : [],
        autocompletion(),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            setEditorContent(newContent);
            onChange(newContent);
          }
        }),
        EditorView.editable.of(!readOnly)
      ]
    });

    // Create and mount editor view
    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });


    viewRef.current = view;

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, [language, settings.editor, currentTheme.isDark, readOnly]);

  // Update content if it changes externally
  useEffect(() => {
    if (viewRef.current && content !== editorContent) {
      const { state } = viewRef.current;
      viewRef.current.dispatch({
        changes: { from: 0, to: state.doc.length, insert: content }
      });
    }
  }, [content]);

  return (
    <div className="flex flex-1 h-full w-full">
      <div
        ref={editorRef}
        className="h-full  h-max w-full overflow-auto"
        style={{
          backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#ffffff',
          color: currentTheme.isDark ? '#d4d4d4' : '#333333',
        }}
      />
    </div>
  );
};

export default CodeEditor;
