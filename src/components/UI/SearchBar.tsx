// src/components/UI/SearchBar.tsx
import React from 'react';
import { AppTheme } from '../../types/settings';
import 'remixicon/fonts/remixicon.css';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: () => void;
    placeholder?: string;
    theme: AppTheme;
}

const SearchBar: React.FC<SearchBarProps> = ({
                                                 value,
                                                 onChange,
                                                 onSearch,
                                                 placeholder = 'Search...',
                                                 theme
                                             }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleClear = () => {
        onChange('');
    };

    return (
        <div className="relative">
            <input
                type="text"
                placeholder={placeholder}
                className="w-full p-2 pl-8 pr-8 rounded border"
                style={{
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderColor: theme.colors.border,
                    color: theme.colors.sidebarText
                }}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />

            {/* Search icon */}
            <div
                className="absolute left-2 top-1/2 transform -translate-y-1/2"
                style={{color: theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}}
            >
                <i className="ri-search-line"></i>
            </div>

            {/* Clear button (only show when there's text) */}
            {value && (
                <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-opacity-10 hover:bg-gray-500 rounded-full p-1"
                    onClick={handleClear}
                    title="Clear search"
                    style={{color: theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}}
                >
                    <i className="ri-close-line"></i>
                </button>
            )}
        </div>
    );
};

export default SearchBar;
