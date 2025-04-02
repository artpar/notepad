// src/components/Editor/RichTextEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Editor, EditorState, RichUtils, getDefaultKeyBinding, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
    const { currentTheme } = useSettings();

    // Initialize with HTML content
    const [editorState, setEditorState] = useState(() => {
        try {
            const contentState = content
                ? stateFromHTML(content)
                : ContentState.createFromText('');
            return EditorState.createWithContent(contentState);
        } catch (e) {
            console.error('Error parsing HTML content:', e);
            return EditorState.createEmpty();
        }
    });

    const editorRef = useRef<Editor>(null);

    // Focus the editor when component mounts
    useEffect(() => {
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
            }
        }, 100);
    }, []);

    // When content changes externally, update the editor
    useEffect(() => {
        try {
            if (content) {
                const contentState = stateFromHTML(content);
                const newEditorState = EditorState.createWithContent(contentState);
                setEditorState(newEditorState);
            }
        } catch (e) {
            console.error('Error parsing HTML content on update:', e);
        }
    }, [content]);

    // Handle editor state changes
    const handleEditorChange = (state: EditorState) => {
        setEditorState(state);

        // Convert to HTML and call the onChange prop
        const html = stateToHTML(state.getCurrentContent());
        onChange(html);
    };

    // Handle keyboard shortcuts
    const handleKeyCommand = (command: string, state: EditorState) => {
        const newState = RichUtils.handleKeyCommand(state, command);

        if (newState) {
            handleEditorChange(newState);
            return 'handled';
        }

        return 'not-handled';
    };

    // Map keys to commands
    const mapKeyToEditorCommand = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            const newEditorState = RichUtils.onTab(e, editorState, 4);

            if (newEditorState !== editorState) {
                handleEditorChange(newEditorState);
                return 'handled';
            }
        }

        return getDefaultKeyBinding(e);
    };

    // Toggle block type (paragraph, h1, h2, etc.)
    const toggleBlockType = (blockType: string) => {
        handleEditorChange(RichUtils.toggleBlockType(editorState, blockType));
    };

    // Toggle inline style (bold, italic, etc.)
    const toggleInlineStyle = (inlineStyle: string) => {
        handleEditorChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    };

    // Style functions
    const getBlockStyle = (block: any) => {
        switch (block.getType()) {
            case 'blockquote':
                return 'rich-editor-blockquote';
            default:
                return '';
        }
    };

    // Style map for custom styles
    const styleMap = {
        CODE: {
            backgroundColor: currentTheme.isDark ? '#2d2d2d' : '#f5f5f5',
            fontFamily: 'monospace',
            padding: '0.2em 0.4em',
            borderRadius: '3px',
            fontSize: '85%',
        },
    };

    // Get CSS class for active button
    const getActiveButtonClass = (style: string, type: 'block' | 'inline') => {
        if (type === 'inline') {
            return editorState.getCurrentInlineStyle().has(style)
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700';
        } else {
            const selection = editorState.getSelection();
            const blockType = editorState
                .getCurrentContent()
                .getBlockForKey(selection.getStartKey())
                .getType();

            return blockType === style
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700';
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
                        className={`px-3 py-1 rounded ${getActiveButtonClass('header-one', 'block')}`}
                        onClick={() => toggleBlockType('header-one')}
                        title="Heading 1"
                    >
                        H1
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${getActiveButtonClass('header-two', 'block')}`}
                        onClick={() => toggleBlockType('header-two')}
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${getActiveButtonClass('header-three', 'block')}`}
                        onClick={() => toggleBlockType('header-three')}
                        title="Heading 3"
                    >
                        H3
                    </button>
                </div>

                <div className="flex space-x-1">
                    <button
                        className={`px-3 py-1 rounded ${getActiveButtonClass('BOLD', 'inline')}`}
                        onClick={() => toggleInlineStyle('BOLD')}
                        title="Bold"
                    >
                        B
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${getActiveButtonClass('ITALIC', 'inline')}`}
                        onClick={() => toggleInlineStyle('ITALIC')}
                        title="Italic"
                    >
                        I
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${getActiveButtonClass('UNDERLINE', 'inline')}`}
                        onClick={() => toggleInlineStyle('UNDERLINE')}
                        title="Underline"
                    >
                        U
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${getActiveButtonClass('CODE', 'inline')}`}
                        onClick={() => toggleInlineStyle('CODE')}
                        title="Code"
                    >
                        Code
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${getActiveButtonClass('unordered-list-item', 'block')}`}
                        onClick={() => toggleBlockType('unordered-list-item')}
                        title="Bullet List"
                    >
                        • List
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${getActiveButtonClass('ordered-list-item', 'block')}`}
                        onClick={() => toggleBlockType('ordered-list-item')}
                        title="Numbered List"
                    >
                        1. List
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${getActiveButtonClass('blockquote', 'block')}`}
                        onClick={() => toggleBlockType('blockquote')}
                        title="Quote"
                    >
                        Quote
                    </button>
                </div>
            </div>

            <div
                className="flex-1 overflow-auto p-4"
                style={{
                    backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#ffffff',
                    color: currentTheme.isDark ? '#d4d4d4' : '#333333',
                }}
            >
                <div className="rich-editor-container">
                    <Editor
                        ref={editorRef}
                        editorState={editorState}
                        onChange={handleEditorChange}
                        handleKeyCommand={handleKeyCommand}
                        keyBindingFn={mapKeyToEditorCommand}
                        blockStyleFn={getBlockStyle}
                        customStyleMap={styleMap}
                        spellCheck={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;
