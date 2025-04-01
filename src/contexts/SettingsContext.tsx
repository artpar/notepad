// src/contexts/SettingsContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, AppTheme, EditorSettings } from '../types/settings';
import * as StorageService from '../services/storage';

// Default themes
const lightTheme: AppTheme = {
  name: 'light',
  displayName: 'Light',
  isDark: false,
  editorTheme: 'light',
  colors: {
    background: '#ffffff',
    foreground: '#333333',
    accent: '#4a7bab',
    sidebar: '#f5f5f5',
    border: '#e0e0e0'
  }
};

const darkTheme: AppTheme = {
  name: 'dark',
  displayName: 'Dark',
  isDark: true,
  editorTheme: 'dark',
  colors: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    accent: '#569cd6',
    sidebar: '#252526',
    border: '#3e3e42'
  }
};

// Default editor settings
const defaultEditorSettings: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  highlightActiveLine: true,
  indentWithTabs: false,
  autoCloseBrackets: true,
  matchBrackets: true
};

// Default app settings
const defaultSettings: AppSettings = {
  theme: 'system',
  editor: defaultEditorSettings,
  autosaveInterval: 5000
};

interface SettingsContextType {
  settings: AppSettings;
  currentTheme: AppTheme;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  updateEditorSettings: (newSettings: Partial<EditorSettings>) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(lightTheme);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await StorageService.getSettings();
        
        // Map stored settings to our AppSettings type
        const appSettings: AppSettings = {
          id: storedSettings.id,
          theme: storedSettings.theme || defaultSettings.theme,
          editor: {
            fontSize: storedSettings.fontSize || defaultEditorSettings.fontSize,
            tabSize: storedSettings.tabSize || defaultEditorSettings.tabSize,
            wordWrap: storedSettings.wordWrap || defaultEditorSettings.wordWrap,
            lineNumbers: true,
            highlightActiveLine: true,
            indentWithTabs: false,
            autoCloseBrackets: true,
            matchBrackets: true
          },
          autosaveInterval: storedSettings.autosaveInterval || defaultSettings.autosaveInterval,
          customKeybindings: storedSettings.customKeybindings
        };
        
        setSettings(appSettings);
        
        // Set the theme based on settings
        updateTheme(appSettings.theme);
      } catch (error) {
        console.error('Failed to load settings', error);
      }
    };

    loadSettings();
  }, []);

  // Update theme based on system preference changes
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setCurrentTheme(e.matches ? darkTheme : lightTheme);
      };
      
      setCurrentTheme(mediaQuery.matches ? darkTheme : lightTheme);
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'light') {
      setCurrentTheme(lightTheme);
    } else if (theme === 'dark') {
      setCurrentTheme(darkTheme);
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCurrentTheme(prefersDark ? darkTheme : lightTheme);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (newSettings.theme) {
      updateTheme(newSettings.theme);
    }
    
    // Map our settings to the storage format
    await StorageService.updateSettings({
      theme: updatedSettings.theme,
      fontSize: updatedSettings.editor.fontSize,
      tabSize: updatedSettings.editor.tabSize,
      wordWrap: updatedSettings.editor.wordWrap,
      autosaveInterval: updatedSettings.autosaveInterval,
      customKeybindings: updatedSettings.customKeybindings
    });
  };

  const updateEditorSettings = async (newEditorSettings: Partial<EditorSettings>): Promise<void> => {
    const updatedEditorSettings = { ...settings.editor, ...newEditorSettings };
    const updatedSettings = { ...settings, editor: updatedEditorSettings };
    
    setSettings(updatedSettings);
    
    // Map our settings to the storage format
    await StorageService.updateSettings({
      fontSize: updatedEditorSettings.fontSize,
      tabSize: updatedEditorSettings.tabSize,
      wordWrap: updatedEditorSettings.wordWrap
    });
  };

  const toggleTheme = async (): Promise<void> => {
    let newTheme: 'light' | 'dark' | 'system';
    
    if (settings.theme === 'light') {
      newTheme = 'dark';
    } else if (settings.theme === 'dark') {
      newTheme = 'system';
    } else {
      newTheme = 'light';
    }
    
    await updateSettings({ theme: newTheme });
  };

  const value = {
    settings,
    currentTheme,
    updateSettings,
    updateEditorSettings,
    toggleTheme
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
