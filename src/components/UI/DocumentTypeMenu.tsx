// src/components/UI/DocumentTypeMenu.tsx
import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface DocumentType {
  type: string;
  label: string;
  icon: string;
  description: string;
  language?: string;
}

interface DocumentTypeMenuProps {
  onSelectType: (type: string, language?: string) => void;
}

export const DocumentTypeMenu: React.FC<DocumentTypeMenuProps> = ({ onSelectType }) => {
  const { currentTheme } = useSettings();
  
  const documentTypes: DocumentType[] = [
    {
      type: 'text',
      label: 'Plain Text',
      icon: 'ri-file-text-line',
      description: 'Simple text document'
    },
    {
      type: 'markdown',
      label: 'Markdown',
      icon: 'ri-markdown-line',
      description: 'Format with Markdown syntax'
    },
    {
      type: 'javascript',
      label: 'JavaScript',
      icon: 'ri-javascript-line',
      description: 'JavaScript code',
      language: 'javascript'
    },
    {
      type: 'python',
      label: 'Python',
      icon: 'ri-code-line',
      description: 'Python code',
      language: 'python'
    },
    {
      type: 'html',
      label: 'HTML',
      icon: 'ri-html5-line',
      description: 'HTML document',
      language: 'html'
    }
  ];

  return (
    <>
      <div className="p-2 border-b" style={{ borderColor: currentTheme.colors.border }}>
        <h3 className="font-medium">Create New Document</h3>
      </div>
      
      <div className="py-1">
        {documentTypes.map(item => (
          <button
            key={item.type}
            className="w-full text-left px-4 py-2 transition-colors hover:bg-opacity-10 hover:bg-gray-500 flex items-start gap-3"
            style={{
              color: currentTheme.colors.foreground
            }}
            onClick={() => onSelectType(item.type, item.language)}
          >
            <i 
              className={`${item.icon} text-xl mt-0.5`}
              style={{ color: currentTheme.colors.accent }}
            />
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-xs opacity-60">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
};

export default DocumentTypeMenu;