// src/types/ui.ts
export interface TabInfo {
    id: string;
    title: string;
    isDirty: boolean;
    type: string;
}

export interface PanelInfo {
    id: string;
    title: string;
    component: string;
    icon?: string;
}

export interface SidebarState {
    visible: boolean;
    width: number;
}

export interface SearchResult {
    documentId: string;
    title: string;
    matches: {
        content: string;
        line: number;
        column: number;
    }[];
}
