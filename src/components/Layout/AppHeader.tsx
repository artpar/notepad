// src/components/Layout/AppHeader.tsx
import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import useDocumentActions from '../../hooks/useDocumentActions';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import { IconButton, MenuButton } from '../UI/Buttons';
import HelpMenu from '../UI/HelpMenu';
import 'remixicon/fonts/remixicon.css';
import {useDocuments} from "../../contexts/UseDocuments.tsx";

interface AppHeaderProps {
  onSaveLayout: () => void;
  onTogglePreview: () => void;
  onExportDocument: () => void;
  onToggleSidebar: () => void;
  showSidebar: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onSaveLayout,
  onTogglePreview,
  onExportDocument,
  onToggleSidebar,
  showSidebar
}) => {
  const { currentTheme, toggleTheme } = useSettings();
  const { activeDocument } = useDocuments();
  const { getDocumentIcon } = useDocumentActions();
  const { getShortcutKey } = useKeyboardShortcuts();

  const [showHelpMenu, setShowHelpMenu] = useState(false);

  return (
    <header
      className="app-header flex items-center justify-between p-2 border-b"
      style={{
        backgroundColor: currentTheme.colors.headerBackground,
        color: currentTheme.colors.headerText,
        borderColor: currentTheme.colors.border
      }}
    >
      {/* Logo and sidebar toggle */}
      <div className="flex items-center">
        <IconButton
          icon={showSidebar ? 'menu-fold-line' : 'menu-unfold-line'}
          onClick={onToggleSidebar}
          title={showSidebar ? "Hide Sidebar (Ctrl+B)" : "Show Sidebar (Ctrl+B)"}
        />
      </div>

      {/* Center section - document title when available */}
      <div className="flex-1 mx-6 text-center hidden md:block">
        {activeDocument && (
          <div className="flex items-center justify-center">
            <i
              className={`${getDocumentIcon(activeDocument.type.type, activeDocument.language)} mr-2`}
              style={{color: currentTheme.colors.headerText}}
            />
            <span
              className="font-medium"
              style={{color: currentTheme.colors.headerText}}
            >
              {activeDocument.title}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-1 md:space-x-2">
        {/* Document actions - only show when document is active */}
        {activeDocument && (
          <>
            {/* Preview toggle */}
            <IconButton
              icon="eye-line"
              label="Preview"
              onClick={onTogglePreview}
              title={`Toggle Preview (${getShortcutKey('P')})`}
              showLabel="sm"
            />

            {/* Export */}
            <IconButton
              icon="download-line"
              label="Export"
              onClick={onExportDocument}
              title={`Export Document (${getShortcutKey('E')})`}
              showLabel="sm"
            />
          </>
        )}

        {/* Save layout */}
        <IconButton
          icon="save-line"
          label="Save"
          onClick={onSaveLayout}
          title={`Save Layout (${getShortcutKey('S')})`}
          showLabel="sm"
        />

        {/* Theme toggle */}
        <IconButton
          icon={currentTheme.isDark ? 'sun-line' : 'moon-line'}
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
        />

        {/* Help menu */}
        <MenuButton
          icon="question-line"
          isOpen={showHelpMenu}
          onClick={() => setShowHelpMenu(!showHelpMenu)}
          title="Help & Keyboard Shortcuts"
        >
          <HelpMenu getShortcutKey={getShortcutKey} />
        </MenuButton>
      </div>
    </header>
  );
};

export default AppHeader;
