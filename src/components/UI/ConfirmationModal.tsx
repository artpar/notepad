// src/components/UI/ConfirmationModal.tsx
import React, {useEffect, useRef} from 'react';
import {useSettings} from '../../contexts/SettingsContext';
import {createPortal} from 'react-dom';
import 'remixicon/fonts/remixicon.css';

interface ConfirmationModalProps {
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    icon?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isOpen: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
                                                                 title,
                                                                 message,
                                                                 confirmLabel = 'Confirm',
                                                                 cancelLabel = 'Cancel',
                                                                 isDestructive = false,
                                                                 icon,
                                                                 onConfirm,
                                                                 onCancel,
                                                                 isOpen
                                                             }) => {
    const {currentTheme} = useSettings();
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    // Focus the appropriate button when the modal opens
    useEffect(() => {
        if (isOpen && confirmButtonRef.current) {
            setTimeout(() => {
                confirmButtonRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    // Portal the modal to the body to avoid z-index issues
    return createPortal(<div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onCancel}
        />

        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
            <div
                className="relative rounded-lg shadow-xl max-w-md w-full p-6 overflow-hidden"
                style={{
                    backgroundColor: currentTheme.colors.background,
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.foreground
                }}
            >
                <div className="flex items-start mb-4">
                    {icon && (<div
                        className="flex-shrink-0 mr-4"
                        style={{
                            color: isDestructive ? '#e74c3c' : currentTheme.colors.accent
                        }}
                    >
                        <i className={`${icon} text-2xl`}></i>
                    </div>)}

                    <div className="flex-1">
                        <h3
                            className="text-lg font-medium mb-2"
                            style={{color: currentTheme.colors.foreground}}
                        >
                            {title}
                        </h3>
                        <p
                            className="text-sm"
                            style={{
                                color: currentTheme.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
                            }}
                        >
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium rounded-md"
                        style={{
                            backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            color: currentTheme.colors.foreground
                        }}
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>

                    <button
                        ref={confirmButtonRef}
                        type="button"
                        className="px-4 py-2 text-sm font-medium rounded-md"
                        style={{
                            backgroundColor: isDestructive ? '#e74c3c' : currentTheme.colors.accent, color: '#ffffff'
                        }}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    </div>, document.body);
};

export default ConfirmationModal;
