// src/components/UI/ContextMenu.tsx
import React, { useEffect, useRef } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { AnimatePresence, motion } from 'framer-motion';
import 'remixicon/fonts/remixicon.css';

export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    action: () => void;
    isDestructive?: boolean;
    divider?: boolean;
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    position: { x: number; y: number } | null;
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, position, onClose }) => {
    const { currentTheme } = useSettings();
    const menuRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (position) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [position, onClose]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (position) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [position, onClose]);

    if (!position) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: 1000,
                    backgroundColor: currentTheme.colors.background,
                    borderColor: currentTheme.colors.border,
                    borderWidth: '1px',
                    borderRadius: '0.375rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    minWidth: '200px',
                    maxWidth: '280px'
                }}
            >
                <div className="py-1">
                    {items.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <button
                                className="w-full text-left px-4 py-2 text-sm flex justify-between items-center hover:bg-opacity-10 hover:bg-gray-500"
                                style={{
                                    color: item.isDestructive
                                        ? '#ef4444' // Red for destructive actions
                                        : currentTheme.colors.foreground
                                }}
                                onClick={() => {
                                    item.action();
                                    onClose();
                                }}
                            >
                                <div className="flex items-center">
                                    {item.icon && (
                                        <i className={`${item.icon} mr-3`} style={{
                                            color: item.isDestructive
                                                ? '#ef4444'
                                                : currentTheme.colors.accent
                                        }}></i>
                                    )}
                                    {item.label}
                                </div>
                                {item.shortcut && (
                                    <span className="text-xs opacity-60 ml-4">{item.shortcut}</span>
                                )}
                            </button>
                            {item.divider && index < items.length - 1 && (
                                <div
                                    className="my-1 mx-3"
                                    style={{
                                        borderTop: `1px solid ${currentTheme.colors.border}`,
                                        opacity: 0.5
                                    }}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ContextMenu;
