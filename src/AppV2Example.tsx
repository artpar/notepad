/**
 * Example of how to integrate the new clean save architecture
 *
 * This example shows:
 * 1. Using the new DocumentProviderV2 with simplified state management
 * 2. Using the useAutoSave hook in editors
 * 3. Clean separation of concerns
 * 4. No duplicate updates or re-renders
 */

import React from 'react';
import { DocumentProvider } from './contexts/DocumentProviderV2';
import { useDocuments } from './contexts/DocumentProviderV2';
import DocumentEditor from './components/Editor/DocumentEditor.tsx';
import { DocumentType } from './types/DocumentType';

// Example component showing how to use the new architecture
const ExampleEditor: React.FC = () => {
  const {
    activeDocument,
    createDocument,
    openDocument,
    documents,
    documentStates
  } = useDocuments();

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 border-r p-4">
        <h2 className="text-lg font-bold mb-4">Documents</h2>

        {/* Create new document button */}
        <button
          onClick={() => createDocument({ type: 'markdown' } as DocumentType)}
          className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Document
        </button>

        {/* Document list */}
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => openDocument(parseInt(doc.id!))}
              className={`p-2 rounded cursor-pointer ${
                activeDocument?.id === doc.id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{doc.title}</span>
                {doc.id && documentStates[parseInt(doc.id)]?.isDirty && (
                  <span className="text-xs text-orange-500">●</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        {activeDocument ? (
          <DocumentEditor document={activeDocument} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a document or create a new one
          </div>
        )}
      </div>
    </div>
  );
};

// Main app with provider
const AppV2Example: React.FC = () => {
  return (
    <DocumentProvider>
      <ExampleEditor />
    </DocumentProvider>
  );
};

export default AppV2Example;
