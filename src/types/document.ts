// src/types/document.ts
export type DocumentType = 'text' | 'markdown' | 'code';

export type CodeLanguage = 
  | 'javascript' 
  | 'typescript'
  | 'python'
  | 'java' 
  | 'c' 
  | 'cpp' 
  | 'csharp'
  | 'go'
  | 'rust'
  | 'ruby'
  | 'php'
  | 'html'
  | 'css'
  | 'json'
  | 'yaml'
  | 'xml'
  | 'sql'
  | 'bash'
  | 'powershell'
  | 'plaintext';

export interface DocumentMeta {
  id?: number;
  title: string;
  type: DocumentType;
  language?: CodeLanguage;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document extends DocumentMeta {
  content: string;
}

export interface DocumentState {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: Date;
}

// src/types/settings.ts
export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  highlightActiveLine: boolean;
  indentWithTabs: boolean;
  autoCloseBrackets: boolean;
  matchBrackets: boolean;
}

export interface AppTheme {
  name: string;
  displayName: string;
  isDark: boolean;
  editorTheme: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
    sidebar: string;
    border: string;
  };
}

export interface AppSettings {
  id?: number;
  theme: 'light' | 'dark' | 'system';
  currentTheme?: AppTheme;
  editor: EditorSettings;
  autosaveInterval: number;
  customKeybindings?: Record<string, string>;
}

// src/types/ui.ts
export interface TabInfo {
  id: string;
  title: string;
  documentId?: number;
  type: 'document' | 'terminal' | 'diagram' | 'math';
  isDirty?: boolean;
}

export interface SplitPaneConfig {
  direction: 'horizontal' | 'vertical';
  sizes: number[];
  minSize: number;
  children: (TabInfo[] | SplitPaneConfig)[];
}

export interface LayoutConfig {
  rootPane: SplitPaneConfig;
  activeTabId?: string;
}
