// src/components/UI/Buttons.tsx
import React, { ReactNode } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface IconButtonProps {
  icon: string;
  onClick: () => void;
  title?: string;
  label?: string;
  showLabel?: boolean | 'sm' | 'md' | 'lg';
  isActive?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  title,
  label,
  showLabel = false,
  isActive = false
}) => {
  const { currentTheme } = useSettings();
  
  return (
    <button
      className={`p-2 rounded-md transition-colors hover:bg-opacity-10 hover:bg-gray-500 ${label ? 'flex items-center' : ''}`}
      style={{
        color: currentTheme.colors.buttonText,
        backgroundColor: isActive ? currentTheme.colors.buttonActiveBackground : 'transparent'
      }}
      onClick={onClick}
      title={title}
    >
      <i className={`ri-${icon} text-lg ${label ? 'mr-1' : ''}`}></i>
      {label && (
        <span className={`${showLabel === 'sm' ? 'hidden sm:inline' : 
          showLabel === 'md' ? 'hidden md:inline' : 
          showLabel === 'lg' ? 'hidden lg:inline' : 
          showLabel ? 'inline' : 'hidden'}`}>
          {label}
        </span>
      )}
    </button>
  );
};

interface MenuButtonProps {
  icon: string;
  onClick: () => void;
  title?: string;
  label?: string;
  showLabel?: boolean | 'sm' | 'md' | 'lg';
  isOpen?: boolean;
  children: ReactNode;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  icon,
  onClick,
  title,
  label,
  showLabel = false,
  isOpen = false,
  children
}) => {
  const { currentTheme } = useSettings();
  
  return (
    <div className="relative">
      <IconButton
        icon={icon}
        onClick={onClick}
        title={title}
        label={label}
        showLabel={showLabel}
        isActive={isOpen}
      />
      
      {isOpen && (
        <div
          className="absolute right-0 mt-1 rounded-md shadow-lg z-50 border overflow-hidden"
          style={{
            backgroundColor: currentTheme.colors.background,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.foreground,
            width: '240px'
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default MenuButton;