// src/services/tabStateService.ts
import { TabInfo } from '../types/ui';

const TAB_STATE_KEY = 'engineer-notepad-tabs';
const ACTIVE_TAB_KEY = 'engineer-notepad-active-tab';

export interface TabState {
  openTabs: TabInfo[];
  activeTabId: string | null;
}

/**
 * Saves the current tab state to localStorage
 */
export const saveTabState = (openTabs: TabInfo[], activeTabId: string | null): void => {
  try {
    const state: TabState = {
      openTabs,
      activeTabId
    };
    localStorage.setItem(TAB_STATE_KEY, JSON.stringify(state));
    if (activeTabId) {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
    } else {
      localStorage.removeItem(ACTIVE_TAB_KEY);
    }
  } catch (error) {
    console.error('Error saving tab state:', error);
  }
};

/**
 * Loads the saved tab state from localStorage
 */
export const loadTabState = (): TabState | null => {
  try {
    const savedState = localStorage.getItem(TAB_STATE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Error loading tab state:', error);
  }
  return null;
};

/**
 * Clears the saved tab state
 */
export const clearTabState = (): void => {
  localStorage.removeItem(TAB_STATE_KEY);
  localStorage.removeItem(ACTIVE_TAB_KEY);
};

/**
 * Gets just the active tab ID
 */
export const getActiveTabId = (): string | null => {
  return localStorage.getItem(ACTIVE_TAB_KEY);
};