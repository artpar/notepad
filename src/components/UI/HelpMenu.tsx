// src/components/UI/HelpMenu.tsx
import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface HelpMenuProps {
  getShortcutKey: (key: string) => string;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ getShortcutKey }) => {
  const { currentTheme } = useSettings();
  
  const shortcuts = {
    document: [
      { name: 'New Document', key: 'N' },
      { name: 'Toggle Preview', key: 'P' },
      { name: 'Export Document', key: 'E' }
    ],
    workspace: [
      { name: 'Save Layout', key: 'S' },
      { name: 'Toggle Sidebar', key: 'B' },
      { name: 'Find in Documents', key: 'F' }
    ]
  };

  return (
    <>
      <div className="p-3 border-b" style={{ borderColor: currentTheme.colors.border }}>
        <h3 className="font-medium">Keyboard Shortcuts</h3>
      </div>
      
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium mb-1">Document</p>
            <ul className="text-xs space-y-2">
              {shortcuts.document.map(shortcut => (
                <li key={shortcut.key} className="flex justify-between">
                  <span>{shortcut.name}</span>
                  <span 
                    className="font-mono px-1 rounded"
                    style={{
                      backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }}
                  >
                    {getShortcutKey(shortcut.key)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-1">Workspace</p>
            <ul className="text-xs space-y-2">
              {shortcuts.workspace.map(shortcut => (
                <li key={shortcut.key} className="flex justify-between">
                  <span>{shortcut.name}</span>
                  <span 
                    className="font-mono px-1 rounded"
                    style={{
                      backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }}
                  >
                    {getShortcutKey(shortcut.key)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div 
          className="mt-4 pt-3 border-t text-center"
          style={{ borderColor: currentTheme.colors.border }}
        >
          <p className="text-xs opacity-70">
            Engineer's Notepad v1.2.0 — A code-focused note-taking app
          </p>
        </div>
      </div>
    </>
  );
};

export default HelpMenu;