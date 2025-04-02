// src/types/settings.ts
export type ThemeName = 'light' | 'dark' | 'system';

export interface AppTheme {
    name: string;
    displayName: string;
    isDark: boolean;
    editorTheme: string;
    colors: {
        background: string;
        buttonBackground: string;
        foreground: string;
        accent: string;
        sidebar: string;
        inputBackground: string;
        inputText: string;
        sidebarText: string;
        headerBackground: string;
        headerText: string;
        border: string;
        buttonHover: string;
        buttonText: string;
        buttonActiveBackground: string;
        buttonActiveText: string;
    };
}

export interface EditorSettings {
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    highlightActiveLine: boolean;
    showStatistics: boolean;
    autoSaveInterval: number;
    autoSave: boolean;
    indentWithTabs: boolean;
    autoCloseBrackets: boolean;
    matchBrackets: boolean;
}

export interface AppSettings {
    id?: number;
    theme: ThemeName;
    editor: EditorSettings;
    customKeybindings?: Record<string, string>;
}
