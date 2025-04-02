// src/components/UI/TagSelector.tsx
import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface TagSelectorProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ 
  tags, 
  selectedTag, 
  onSelectTag 
}) => {
  const { currentTheme } = useSettings();
  
  if (tags.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <button
          key={tag}
          className={`px-2 py-1 text-xs rounded-full flex items-center ${
            selectedTag === tag ? 'font-medium' : 'opacity-70'
          }`}
          style={{
            backgroundColor: selectedTag === tag 
              ? currentTheme.colors.accent 
              : currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: selectedTag === tag 
              ? currentTheme.isDark ? '#000' : '#fff'
              : currentTheme.colors.foreground
          }}
          onClick={() => onSelectTag(tag)}
        >
          <span>{tag}</span>
        </button>
      ))}
    </div>
  );
};

export default TagSelector;