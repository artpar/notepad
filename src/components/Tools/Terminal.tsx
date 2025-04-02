// src/components/Tools/Terminal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { IDockviewPanelProps } from 'dockview';
import { useSettings } from '../../contexts/SettingsContext';
import { useDocuments } from '../../contexts/DocumentContext';
import { Document } from '../../types/document';
import { useToast } from '../UI/ToastSystem';
import 'remixicon/fonts/remixicon.css';

interface TerminalPanelProps {
  document?: Document;
}

interface CommandResult {
  input: string;
  output: string;
  isError: boolean;
  timestamp: Date;
}

const Terminal: React.FC<IDockviewPanelProps<TerminalPanelProps>> = (props) => {
  const { currentTheme } = useSettings();
  const { documents, activeDocument, createDocument, openDocument } = useDocuments();
  const { showToast } = useToast();

  const [commandHistory, setCommandHistory] = useState<CommandResult[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message
  useEffect(() => {
    setCommandHistory([
      {
        input: '',
        output: `Engineer's Notepad Terminal v1.0.0
Type 'help' to see available commands.`,
        isError: false,
        timestamp: new Date()
      }
    ]);
  }, []);

  // Auto scroll to bottom when command history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Focus input when component mounts or when clicked anywhere in the terminal
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Process commands
  const processCommand = (command: string) => {
    // Trim command and convert to lowercase for easier matching
    const trimmedCommand = command.trim();
    const commandLower = trimmedCommand.toLowerCase();

    // Split command into parts
    const parts = trimmedCommand.split(' ');
    const mainCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output = '';
    let isError = false;

    // Process different commands
    switch (mainCommand) {
      case 'help':
        output = `Available commands:
- help: Show this help message
- clear: Clear the terminal
- ls: List all documents
- open <id>: Open a document by ID
- new <type> <title>: Create a new document (types: text, markdown, code)
- search <query>: Search documents
- echo <text>: Display text
- info: Show information about current document`;
        break;

      case 'clear':
        setCommandHistory([]);
        return;

      case 'ls':
        if (documents.length === 0) {
          output = 'No documents found.';
        } else {
          output = 'Documents:\n' + documents.map(doc =>
              `${doc.id} - ${doc.title} (${doc.type}${doc.language ? `:${doc.language}` : ''}) - ${doc.updatedAt.toLocaleString()}`
          ).join('\n');
        }
        break;

      case 'open':
        if (args.length === 0) {
          output = 'Error: Please provide a document ID';
          isError = true;
        } else {
          const docId = args[0];
          const doc = documents.find(d => d.id === docId);

          if (doc) {
            openDocument(docId);
            output = `Opened document: ${doc.title}`;
          } else {
            output = `Error: Document with ID ${docId} not found`;
            isError = true;
          }
        }
        break;

      case 'new':
        if (args.length < 2) {
          output = 'Error: Please provide a document type and title';
          isError = true;
        } else {
          const type = args[0] as any;
          const title = args.slice(1).join(' ');

          if (!['text', 'markdown', 'code', 'html', 'richtext'].includes(type)) {
            output = `Error: Invalid document type. Valid types are text, markdown, code, html, richtext`;
            isError = true;
          } else {
            createDocument(type)
                .then(id => {
                  if (id) {
                    showToast(`Document created: ${title}`, { type: 'success' });
                  }
                });
            output = `Created new ${type} document: ${title}`;
          }
        }
        break;

      case 'search':
        if (args.length === 0) {
          output = 'Error: Please provide a search query';
          isError = true;
        } else {
          const query = args.join(' ');
          const results = documents.filter(doc =>
              doc.title.toLowerCase().includes(query.toLowerCase()) ||
              doc.content.toLowerCase().includes(query.toLowerCase())
          );

          if (results.length === 0) {
            output = `No documents found matching query: "${query}"`;
          } else {
            output = `Found ${results.length} document(s) matching "${query}":\n` +
                results.map(doc => `${doc.id} - ${doc.title} (${doc.type})`).join('\n');
          }
        }
        break;

      case 'echo':
        output = args.join(' ');
        break;

      case 'info':
        if (activeDocument) {
          output = `Current document:
ID: ${activeDocument.id}
Title: ${activeDocument.title}
Type: ${activeDocument.type}${activeDocument.language ? ` (${activeDocument.language})` : ''}
Created: ${activeDocument.createdAt.toLocaleString()}
Updated: ${activeDocument.updatedAt.toLocaleString()}
Size: ${activeDocument.content.length} characters`;
        } else {
          output = 'No document currently active';
        }
        break;

      case '':
        // Empty command, just show a new prompt
        output = '';
        break;

      default:
        output = `Command not found: ${mainCommand}. Type 'help' for available commands.`;
        isError = true;
    }

    // Add command and output to history
    setCommandHistory(prev => [
      ...prev,
      {
        input: trimmedCommand,
        output,
        isError,
        timestamp: new Date()
      }
    ]);

    // Reset current command and history index
    setCurrentCommand('');
    setHistoryIndex(-1);
  };

  // Handle Enter key to submit command
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      // Navigate up through command history
      e.preventDefault();

      const commandInputs = commandHistory
          .filter(cmd => cmd.input)
          .map(cmd => cmd.input);

      if (commandInputs.length > 0) {
        const newIndex = historyIndex < commandInputs.length - 1
            ? historyIndex + 1
            : historyIndex;

        setHistoryIndex(newIndex);
        setCurrentCommand(commandInputs[commandInputs.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      // Navigate down through command history
      e.preventDefault();

      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);

        const commandInputs = commandHistory
            .filter(cmd => cmd.input)
            .map(cmd => cmd.input);

        setCurrentCommand(commandInputs[commandInputs.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  return (
      <div
          className="terminal-panel h-full flex flex-col"
          style={{
            backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#f5f5f5',
            color: currentTheme.isDark ? '#d4d4d4' : '#333333',
          }}
          onClick={handleTerminalClick}
      >
        {/* Terminal output */}
        <div
            ref={terminalRef}
            className="flex-1 p-3 font-mono text-sm overflow-auto"
        >
          {commandHistory.map((cmd, index) => (
              <div key={index} className="mb-2">
                {cmd.input && (
                    <div className="flex">
                      <span style={{ color: currentTheme.colors.accent }}>$ </span>
                      <span className="ml-1">{cmd.input}</span>
                    </div>
                )}
                {cmd.output && (
                    <div
                        className="whitespace-pre-wrap ml-2"
                        style={{
                          color: cmd.isError ? '#e74c3c' : (currentTheme.isDark ? '#d4d4d4' : '#333333')
                        }}
                    >
                      {cmd.output}
                    </div>
                )}
              </div>
          ))}

          {/* Current command prompt */}
          <div className="flex items-center">
            <span style={{ color: currentTheme.colors.accent }}>$ </span>
            <input
                ref={inputRef}
                type="text"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="ml-1 bg-transparent border-none outline-none flex-1 font-mono text-sm"
                style={{
                  color: currentTheme.isDark ? '#d4d4d4' : '#333333',
                  caretColor: currentTheme.colors.accent
                }}
                spellCheck={false}
                autoComplete="off"
            />
          </div>
        </div>
      </div>
  );
};

export default Terminal;
