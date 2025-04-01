// src/components/Tools/Terminal.tsx
import React, { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useSettings } from '../../contexts/SettingsContext';

const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { currentTheme } = useSettings();

  // Initialize and configure terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    xtermRef.current = new XTerminal({
      theme: {
        background: currentTheme.isDark ? '#1e1e1e' : '#ffffff',
        foreground: currentTheme.isDark ? '#d4d4d4' : '#333333',
        cursor: currentTheme.colors.accent,
        selection: 'rgba(128, 128, 255, 0.3)',
      },
      fontFamily: 'monospace',
      fontSize: 14,
      cursorBlink: true,
      convertEol: true,
    });

    // Setup fit addon
    fitAddonRef.current = new FitAddon();
    xtermRef.current.loadAddon(fitAddonRef.current);

    // Open terminal in the container
    xtermRef.current.open(terminalRef.current);
    fitAddonRef.current.fit();

    // Welcome message and instructions
    xtermRef.current.writeln('Engineer\'s Notepad Terminal (Simulated)');
    xtermRef.current.writeln('This is a basic terminal emulation for local JavaScript execution');
    xtermRef.current.writeln('Type "help" for available commands');
    xtermRef.current.writeln('');
    xtermRef.current.write('$ ');

    // Setup command handling
    let commandBuffer = '';
    
    xtermRef.current.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
      
      if (domEvent.keyCode === 13) { // Enter key
        xtermRef.current?.writeln('');
        executeCommand(commandBuffer);
        commandBuffer = '';
        xtermRef.current?.write('$ ');
      } else if (domEvent.keyCode === 8) { // Backspace
        if (commandBuffer.length > 0) {
          commandBuffer = commandBuffer.substring(0, commandBuffer.length - 1);
          xtermRef.current?.write('\b \b');
        }
      } else if (printable) {
        commandBuffer += key;
        xtermRef.current?.write(key);
      }
    });

    // Handle terminal resizing
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      xtermRef.current?.dispose();
    };
  }, [currentTheme]);

  // Execute terminal commands
  const executeCommand = (command: string) => {
    if (!xtermRef.current) return;

    const cmd = command.trim();
    
    if (cmd === '') {
      return;
    }
    
    if (cmd === 'help') {
      xtermRef.current.writeln('Available commands:');
      xtermRef.current.writeln('  help - Show this help message');
      xtermRef.current.writeln('  clear - Clear the terminal');
      xtermRef.current.writeln('  date - Show current date and time');
      xtermRef.current.writeln('  echo [text] - Echo text back to terminal');
      xtermRef.current.writeln('  eval [js] - Evaluate JavaScript (use with caution)');
      xtermRef.current.writeln('  systeminfo - Display browser information');
      return;
    }
    
    if (cmd === 'clear') {
      xtermRef.current.clear();
      return;
    }
    
    if (cmd === 'date') {
      xtermRef.current.writeln(new Date().toString());
      return;
    }
    
    if (cmd.startsWith('echo ')) {
      const text = cmd.substring(5);
      xtermRef.current.writeln(text);
      return;
    }
    
    if (cmd.startsWith('eval ')) {
      try {
        const js = cmd.substring(5);
        // eslint-disable-next-line no-eval
        const result = eval(js);
        xtermRef.current.writeln(result?.toString() || 'undefined');
      } catch (error) {
        xtermRef.current.writeln(`Error: ${error}`);
      }
      return;
    }
    
    if (cmd === 'systeminfo') {
      xtermRef.current.writeln(`User Agent: ${navigator.userAgent}`);
      xtermRef.current.writeln(`Platform: ${navigator.platform}`);
      xtermRef.current.writeln(`Language: ${navigator.language}`);
      xtermRef.current.writeln(`Online: ${navigator.onLine ? 'Yes' : 'No'}`);
      xtermRef.current.writeln(`Memory: ${(performance as any)?.memory?.usedJSHeapSize / 1048576 || 'Unknown'} MB`);
      return;
    }
    
    xtermRef.current.writeln(`Command not found: ${cmd}`);
    xtermRef.current.writeln('Type "help" for available commands');
  };

  return (
    <div 
      className="h-full w-full p-1 flex flex-col"
      style={{
        backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#ffffff',
      }}
    >
      <div className="flex-1 overflow-hidden" ref={terminalRef} />
    </div>
  );
};

export default Terminal;
