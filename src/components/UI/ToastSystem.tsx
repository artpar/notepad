// src/components/UI/ToastSystem.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import 'remixicon/fonts/remixicon.css';

// Toast types and interfaces
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// Toast context
interface ToastContextType {
    showToast: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Generate a unique ID for each toast
    const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Show a toast
    const showToast = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => {
        const id = generateId();
        const newToast: Toast = {
            id,
            message,
            type: options?.type || 'info',
            duration: options?.duration || 3000,
            action: options?.action
        };

        setToasts(prev => [...prev, newToast]);

        // Auto-hide toast after duration unless it has an action
        if (!options?.action && newToast.duration !== 0) {
            setTimeout(() => {
                hideToast(id);
            }, newToast.duration);
        }

        return id;
    }, []);

    // Hide a toast
    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Provide the context
    const contextValue: ToastContextType = {
        showToast,
        hideToast
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer toasts={toasts} hideToast={hideToast} />
        </ToastContext.Provider>
    );
};

// Hook to use the toast context
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast container component
interface ToastContainerProps {
    toasts: Toast[];
    hideToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, hideToast }) => {
    const { currentTheme } = useSettings();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 max-w-sm">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => hideToast(toast.id)}
                        theme={currentTheme}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

// Individual toast item
interface ToastItemProps {
    toast: Toast;
    onClose: () => void;
    theme: any;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose, theme }) => {
    // Get icon based on toast type
    const getToastIcon = (type: ToastType): string => {
        switch (type) {
            case 'success':
                return 'ri-check-line';
            case 'error':
                return 'ri-error-warning-line';
            case 'warning':
                return 'ri-alert-line';
            case 'info':
            default:
                return 'ri-information-line';
        }
    };

    // Get color based on toast type
    const getToastColor = (type: ToastType): string => {
        switch (type) {
            case 'success':
                return '#10b981'; // Green
            case 'error':
                return '#ef4444'; // Red
            case 'warning':
                return '#f59e0b'; // Yellow
            case 'info':
            default:
                return theme.colors.accent;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="rounded-lg shadow-lg overflow-hidden"
            style={{
                backgroundColor: theme.isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: theme.colors.border,
                borderWidth: '1px',
                backdropFilter: 'blur(8px)'
            }}
        >
            <div className="flex p-4 min-w-[300px]">
                <div className="mr-3 text-xl" style={{ color: getToastColor(toast.type) }}>
                    <i className={getToastIcon(toast.type)}></i>
                </div>
                <div className="flex-1" style={{ color: theme.colors.foreground }}>
                    <p>{toast.message}</p>
                    {toast.action && (
                        <button
                            className="mt-2 px-3 py-1 text-sm font-medium rounded"
                            style={{
                                backgroundColor: getToastColor(toast.type) + '20',
                                color: getToastColor(toast.type)
                            }}
                            onClick={() => {
                                toast.action?.onClick();
                                onClose();
                            }}
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
                <button
                    className="ml-2 text-sm opacity-50 hover:opacity-100"
                    onClick={onClose}
                    style={{ color: theme.colors.foreground }}
                >
                    <i className="ri-close-line"></i>
                </button>
            </div>
        </motion.div>
    );
};

export default ToastProvider;
