// src/components/Panels/CustomPanels.tsx
import React from 'react';
import {DockviewGroupPanel, IGroupPanelBaseProps, IWatermarkPanelProps} from 'dockview';

// Custom Group Panel
export const CustomGroupPanel: React.FC<IGroupPanelBaseProps> = (props) => {
    return <DockviewGroupPanel {...props} />;
};

// Custom Watermark Panel
export const CustomWatermarkPanel: React.FC<IWatermarkPanelProps> = (props) => {
    return (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
            <div className="max-w-3xl mx-auto p-8 text-center">
                <div className="mb-8">
                    <svg className="w-20 h-20 mx-auto mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Welcome to Engineer's Notepad
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Your powerful, flexible workspace for technical documentation
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-blue-500 mb-3">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Create Documents</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Use the Explorer panel or press Ctrl/Cmd+N to create new documents
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-green-500 mb-3">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Multiple Formats</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Markdown, Code, Rich Text, Diagrams, and more
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-purple-500 mb-3">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Flexible Layout</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Drag and drop panels to customize your workspace
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Quick Start Tips</h3>
                    <div className="text-left space-y-2 text-sm text-blue-800 dark:text-blue-300">
                        <div className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Press <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">Ctrl/Cmd + S</kbd> to save your work</span>
                        </div>
                        <div className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Use <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">Ctrl/Cmd + F</kbd> to search within documents</span>
                        </div>
                        <div className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Right-click on documents for more options</span>
                        </div>
                        <div className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Drag tabs to reorder or create split views</span>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Get started by creating your first document from the Explorer panel on the left</p>
                </div>
            </div>
        </div>
    );
};
