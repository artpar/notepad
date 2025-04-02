// src/components/UI/SearchBar.tsx
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppTheme } from '../../types/settings';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    theme: AppTheme;
    autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
                                                 value,
                                                 onChange,
                                                 placeholder = 'Search...',
                                                 theme,
                                                 autoFocus = false
                                             }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    return (
        <div className="relative">
            <div
                className="flex items-center rounded-md overflow-hidden transition-all focus-within:ring-2"
                style={{
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: `1px solid ${theme.colors.border}`,
                    ringColor: theme.colors.accent
                }}
            >
                <i className="ri-search-line text-lg mx-2 opacity-60"></i>
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full py-2 px-1 text-sm border-none outline-none bg-transparent"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                <AnimatePresence>
                    {value && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="px-2 opacity-60 hover:opacity-100"
                            onClick={() => onChange('')}
                            title="Clear search"
                        >
                            <i className="ri-close-line"></i>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Optional search shortcuts/tags */}
            <div className="flex mt-2 gap-1 flex-wrap">
                {['markdown', 'code', 'recent'].map(tag => (
                    <button
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full transition-colors"
                        style={{
                            backgroundColor: theme.isDark
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.05)',
                            color: theme.colors.foreground
                        }}
                        onClick={() => onChange(`tag:${tag}`)}
                    >
                        #{tag}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchBar;
