// src/components/UI/Welcome.tsx
import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import 'remixicon/fonts/remixicon.css';
import {DocumentType} from "../../types/DocumentType.tsx";

interface WelcomeProps {
    onCreateDocument: (type: DocumentType, language?: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

const Welcome: React.FC<WelcomeProps> = ({ onCreateDocument, onClose, isOpen }) => {
    const { currentTheme } = useSettings();
    const [step, setStep] = useState(0);

    if (!isOpen) return null;

    // Welcome content steps
    const steps = [
        {
            title: "Welcome to Engineer's Notepad",
            description: "A powerful tool for engineers, developers, and technical writers to organize and edit code, documentation, and notes.",
            icon: "ri-quill-pen-line",
            action: () => setStep(1),
            buttonText: "Next"
        },
        {
            title: "Create Your First Document",
            description: "Get started by creating a new document. Choose from various document types including plain text, markdown, and various programming languages.",
            icon: "ri-file-add-line",
            action: () => setStep(2),
            buttonText: "Next"
        },
        {
            title: "Organize Your Workspace",
            description: "Arrange your workspace with a flexible panel system. Drag and drop panels to customize your layout.",
            icon: "ri-layout-grid-line",
            action: () => setStep(3),
            buttonText: "Next"
        },
        {
            title: "Ready to Go!",
            description: "You're all set to start using Engineer's Notepad. Create your first document or explore the features.",
            icon: "ri-rocket-line",
            action: () => onClose(),
            buttonText: "Get Started"
        }
    ];

    const documentTypes = [
        { type: 'markdown', label: 'Markdown', icon: 'ri-markdown-line', description: 'For documentation with rich formatting' },
        { type: 'text', label: 'Plain Text', icon: 'ri-file-text-line', description: 'Simple text notes and documents' },
        { type: 'javascript', label: 'JavaScript', icon: 'ri-javascript-line', description: 'For JavaScript code snippets' },
        { type: 'python', label: 'Python', icon: 'ri-code-line', description: 'For Python code and scripts' },
        { type: 'html', label: 'HTML', icon: 'ri-html5-line', description: 'For HTML documents and templates' }
    ];

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-75 bg-black">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-2xl w-full rounded-lg shadow-2xl overflow-hidden"
                    style={{
                        backgroundColor: currentTheme.colors.background,
                        color: currentTheme.colors.foreground,
                        borderColor: currentTheme.colors.border,
                        borderWidth: '1px'
                    }}
                >
                    {/* Header */}
                    <div
                        className="p-6 relative"
                        style={{
                            backgroundImage: `linear-gradient(to right, ${currentTheme.colors.accent}20, ${currentTheme.colors.accent}10)`,
                            borderBottom: `1px solid ${currentTheme.colors.border}`
                        }}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500"
                            onClick={onClose}
                            style={{ color: currentTheme.colors.foreground }}
                        >
                            <i className="ri-close-line text-xl"></i>
                        </button>

                        <div className="flex items-center space-x-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                                style={{
                                    backgroundColor: `${currentTheme.colors.accent}30`,
                                    color: currentTheme.colors.accent
                                }}
                            >
                                <i className={currentStep.icon}></i>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-1">{currentStep.title}</h2>
                                <p className="opacity-70">{currentStep.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content based on step */}
                    <div className="p-6">
                        {step === 1 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Choose a document type to get started:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {documentTypes.map(docType => (
                                        <button
                                            key={docType.type}
                                            className="flex items-start p-4 rounded border transition-colors text-left"
                                            style={{
                                                borderColor: currentTheme.colors.border,
                                                backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                            }}
                                            onClick={() => {
                                                onCreateDocument(docType.type);
                                                onClose();
                                            }}
                                        >
                                            <i
                                                className={`${docType.icon} text-2xl mr-3 mt-1`}
                                                style={{ color: currentTheme.colors.accent }}
                                            ></i>
                                            <div>
                                                <div className="font-medium">{docType.label}</div>
                                                <div className="text-xs opacity-70 mt-1">{docType.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <div className="rounded border p-4 mb-4" style={{ borderColor: currentTheme.colors.border }}>
                                    <h3 className="text-lg font-semibold mb-2">Workspace Features:</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-center">
                                            <i className="ri-drag-move-2-line text-xl mr-2" style={{ color: currentTheme.colors.accent }}></i>
                                            <span>Drag and drop panels to rearrange your workspace</span>
                                        </li>
                                        <li className="flex items-center">
                                            <i className="ri-split-cells-horizontal text-xl mr-2" style={{ color: currentTheme.colors.accent }}></i>
                                            <span>Split panels horizontally or vertically</span>
                                        </li>
                                        <li className="flex items-center">
                                            <i className="ri-layout-masonry-line text-xl mr-2" style={{ color: currentTheme.colors.accent }}></i>
                                            <span>Save your favorite layouts for different tasks</span>
                                        </li>
                                        <li className="flex items-center">
                                            <i className="ri-eye-line text-xl mr-2" style={{ color: currentTheme.colors.accent }}></i>
                                            <span>Preview documents side-by-side with the editor</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex justify-center">
                                    <img
                                        src="/src/assets/workspace-illustration.svg"
                                        alt="Workspace Illustration"
                                        className="max-h-48 opacity-80"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts:</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Documents</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex justify-between">
                                                <span>New Document</span>
                                                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>Ctrl+N</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Search Documents</span>
                                                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>Ctrl+F</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Toggle Preview</span>
                                                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>Ctrl+P</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Workspace</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex justify-between">
                                                <span>Toggle Sidebar</span>
                                                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>Ctrl+B</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Save Layout</span>
                                                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>Ctrl+S</span>
                                            </li>
                                            <li className="flex justify-between">
                                                <span>Export Document</span>
                                                <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>Ctrl+E</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <div className="rounded-lg p-4 bg-opacity-10 flex items-center space-x-3" style={{ backgroundColor: currentTheme.colors.accent }}>
                                        <i className="ri-lightbulb-line text-xl" style={{ color: currentTheme.colors.accent }}></i>
                                        <p className="text-sm">Tip: Use <span className="font-medium">Alt+Space</span> for quick access to document search anytime!</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer with progress indicators and next button */}
                    <div
                        className="p-4 flex justify-between items-center"
                        style={{ borderTop: `1px solid ${currentTheme.colors.border}` }}
                    >
                        <div className="flex space-x-2">
                            {steps.map((_, index) => (
                                <button
                                    key={index}
                                    className="w-2.5 h-2.5 rounded-full transition-colors"
                                    style={{
                                        backgroundColor: index === step
                                            ? currentTheme.colors.accent
                                            : (currentTheme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
                                    }}
                                    onClick={() => setStep(index)}
                                />
                            ))}
                        </div>

                        <div className="flex space-x-3">
                            {step > 0 && (
                                <button
                                    className="px-4 py-2 rounded text-sm font-medium"
                                    style={{
                                        backgroundColor: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                        color: currentTheme.colors.foreground
                                    }}
                                    onClick={() => setStep(step - 1)}
                                >
                                    Back
                                </button>
                            )}

                            <button
                                className="px-4 py-2 rounded text-sm font-medium text-white"
                                style={{ backgroundColor: currentTheme.colors.accent }}
                                onClick={currentStep.action}
                            >
                                {currentStep.buttonText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Welcome;
