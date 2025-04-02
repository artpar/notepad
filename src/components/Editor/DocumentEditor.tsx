// src/components/Editor/DocumentEditor.tsx
import React, {useEffect, useState} from 'react';
import {calculateDocumentStats, Document} from '../../types/document';
import CodeEditor from './CodeEditor';
import MarkdownEditor from './MarkdownEditor';
import RichTextEditor from './RichTextEditor';
import {useSettings} from '../../contexts/SettingsContext';
import {useToast} from '../UI/ToastSystem';

interface DocumentEditorProps {
    document: Document;
    onUpdate: (content: string) => void;
    readOnly?: boolean;
    showInfo?: boolean;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
                                                           document, onUpdate, readOnly = false, showInfo = false
                                                       }) => {
    const {settings, currentTheme} = useSettings();
    const [stats, setStats] = useState(calculateDocumentStats(document.content));
    const {showToast} = useToast();
    const [lastSaved, setLastSaved] = useState<Date>(document.updatedAt);

    // Map DocType to editor component
    const getEditorComponent = () => {
        switch (document.type) {
            case 'markdown':
                return (<MarkdownEditor
                        content={document.content}
                        onChange={handleContentChange}
                    />);

            case 'richtext':
                return (<RichTextEditor
                        content={document.content}
                        onChange={handleContentChange}
                    />);

            case 'html':
            case 'code':
            case 'text':
            default:
                return (<CodeEditor
                        content={document.content}
                        language={document.type === 'html' ? 'html' : document.language || 'plaintext'}
                        onChange={handleContentChange}
                        readOnly={readOnly}
                    />);
        }
    };

    // Handle content updates
    const handleContentChange = (content: string) => {
        if (typeof onUpdate === 'function' && !readOnly) {
            onUpdate(content);
            setLastSaved(new Date());

            // Update statistics
            if (settings.editor.showStatistics) {
                const newStats = calculateDocumentStats(content);
                setStats(newStats);
            }
        }
    };

    // Auto-save functionality
    useEffect(() => {
        let autoSaveInterval: NodeJS.Timeout;

        if (settings.editor.autoSave && !readOnly) {
            autoSaveInterval = setInterval(() => {
                showToast('Document auto-saved', {type: 'success', duration: 2000});
                // The actual save happens through onUpdate, this just shows a notification
            }, settings.editor.autoSaveInterval * 1000);
        }

        return () => {
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
            }
        };
    }, [settings.editor.autoSave, settings.editor.autoSaveInterval, readOnly]);

    return (<div className="h-full flex flex-col">
            {/* Document editor */}
            <div className="flex-1 overflow-hidden">
                {getEditorComponent()}
            </div>

            {/* Info footer - optional */}
            {showInfo && (<div
                    className="py-1 px-3 flex justify-between text-xs border-t"
                    style={{
                        backgroundColor: currentTheme.colors.sidebar,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                    }}
                >
                    <div>
                        {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                        {document.language && ` • ${document.language}`}
                    </div>

                    <div className="space-x-3">
                        <span>Words: {stats.wordCount}</span>
                        <span>Chars: {stats.characterCount}</span>
                        <span>Lines: {stats.lineCount}</span>
                        <span>Read: ~{stats.readingTimeMinutes} min</span>
                        <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                    </div>
                </div>)}
        </div>);
};

export default DocumentEditor;
