// src/components/UI/SearchBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import 'remixicon/fonts/remixicon.css';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    showSearchIcon?: boolean;
    showClearButton?: boolean;
    className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
                                                 value,
                                                 onChange,
                                                 onSearch,
                                                 placeholder = 'Search...',
                                                 autoFocus = false,
                                                 showSearchIcon = true,
                                                 showClearButton = true,
                                                 className = ''
                                             }) => {
    const { currentTheme } = useSettings();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Auto focus if needed
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch();
        } else if (e.key === 'Escape') {
            inputRef.current?.blur();
            if (value) {
                onChange('');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleClear = () => {
        onChange('');
        inputRef.current?.focus();
    };

    return (
        <div
            className={`relative ${className}`}
        >
            <div
                className={`flex items-center w-full rounded transition-all duration-150 ${
                    isFocused ? 'ring-2' : ''
                }`}
                style={{
                    backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderColor: currentTheme.colors.border,
                    borderWidth: '1px',
                    ringColor: currentTheme.colors.accent + '40'
                }}
            >
                {showSearchIcon && (
                    <div
                        className="pl-3"
                        style={{
                            color: currentTheme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                        }}
                    >
                        <i className="ri-search-line text-lg"></i>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    className="w-full py-2 px-3 bg-transparent outline-none text-sm"
                    style={{
                        color: currentTheme.colors.foreground
                    }}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                {showClearButton && value && (
                    <button
                        className="pr-3 hover:bg-opacity-10 hover:bg-gray-500 rounded-full flex items-center justify-center"
                        onClick={handleClear}
                        style={{
                            color: currentTheme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                        }}
                        title="Clear search"
                    >
                        <i className="ri-close-line"></i>
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
