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
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  title,
  label,
  showLabel = false,
  isActive = false,
  disabled = false
}) => {
  const { currentTheme } = useSettings();
  
  return (
    <button
      className={`p-2 rounded-md transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-10 hover:bg-gray-500'} ${label ? 'flex items-center' : ''}`}
      style={{
        color: currentTheme.colors.buttonText,
        backgroundColor: isActive ? currentTheme.colors.buttonActiveBackground : 'transparent'
      }}
      onClick={onClick}
      title={title}
      disabled={disabled}
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
  dropdownAlign?: 'left' | 'right';
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  icon,
  onClick,
  title,
  label,
  showLabel = false,
  isOpen = false,
  children,
  dropdownAlign = 'right'
}) => {
  const { currentTheme } = useSettings();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (isOpen && dropdownRef.current && buttonRef.current) {
      const dropdown = dropdownRef.current;
      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      
      // Check if dropdown goes beyond viewport bottom
      if (rect.bottom + dropdownRect.height > window.innerHeight) {
        // Position above the button instead
        dropdown.style.bottom = `${button.offsetHeight + 4}px`;
        dropdown.style.top = 'auto';
      } else {
        // Normal positioning below
        dropdown.style.top = '100%';
        dropdown.style.bottom = 'auto';
      }
      
      // Check horizontal overflow
      if (dropdownAlign === 'right' && rect.right - dropdownRect.width < 0) {
        dropdown.style.left = '0';
        dropdown.style.right = 'auto';
      } else if (dropdownAlign === 'left' && rect.left + dropdownRect.width > window.innerWidth) {
        dropdown.style.right = '0';
        dropdown.style.left = 'auto';
      }
    }
  }, [isOpen, dropdownAlign]);
  
  return (
    <div className="relative" ref={buttonRef}>
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
          ref={dropdownRef}
          className={`absolute ${dropdownAlign === 'left' ? 'left-0' : 'right-0'} mt-1 rounded-md shadow-lg z-50 border overflow-hidden`}
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