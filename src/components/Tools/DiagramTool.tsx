// src/components/Tools/DiagramTool.tsx
import React, { useState, useEffect } from 'react';
import { IDockviewPanelProps } from 'dockview';
import { useSettings } from '../../contexts/SettingsContext';
import { Document } from '../../types/document';
import 'remixicon/fonts/remixicon.css';

interface DiagramToolPanelProps {
  document?: Document;
  onInsert?: (content: string) => void;
}

interface DiagramTemplate {
  id: string;
  name: string;
  icon: string;
  template: string;
}

const DiagramTool: React.FC<IDockviewPanelProps<DiagramToolPanelProps>> = (props) => {
  const { params } = props;
  const { document, onInsert } = params;
  const { currentTheme } = useSettings();
  const [activeTab, setActiveTab] = useState<'flowchart' | 'sequence' | 'class' | 'state'>('flowchart');
  const [diagramCode, setDiagramCode] = useState<string>('');
  const [diagramPreview, setDiagramPreview] = useState<string>('');
  const [templates, setTemplates] = useState<DiagramTemplate[]>([]);

  // Initialize with default templates based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'flowchart':
        setTemplates([
          {
            id: 'simple-flow',
            name: 'Simple Flowchart',
            icon: 'ri-flow-chart',
            template: `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`
          },
          {
            id: 'decision-tree',
            name: 'Decision Tree',
            icon: 'ri-git-branch-line',
            template: `graph TD
    A[Problem] --> B{Can it be fixed?}
    B -->|Yes| C[Fix it]
    B -->|No| D[Replace it]
    C --> E[Test]
    D --> E`
          },
          {
            id: 'subgraph',
            name: 'Subgraph Example',
            icon: 'ri-layout-grid-line',
            template: `graph TD
    subgraph Main Process
    A[Start] --> B[Process 1]
    B --> C[Process 2]
    end
    
    subgraph Error Handling
    C --> D{Error?}
    D -->|Yes| E[Handle Error]
    D -->|No| F[Continue]
    end
    
    F --> G[End]`
          }
        ]);
        break;

      case 'sequence':
        setTemplates([
          {
            id: 'basic-sequence',
            name: 'Basic Sequence',
            icon: 'ri-arrow-down-line',
            template: `sequenceDiagram
    participant User
    participant System
    participant Database
    
    User->>System: Request Data
    System->>Database: Query
    Database-->>System: Return Results
    System-->>User: Display Results`
          },
          {
            id: 'alt-sequence',
            name: 'With Alternatives',
            icon: 'ri-git-commit-line',
            template: `sequenceDiagram
    participant User
    participant System
    
    User->>System: Login Request
    alt Valid Credentials
        System-->>User: Login Success
    else Invalid Credentials
        System-->>User: Login Failed
    end`
          }
        ]);
        break;

      case 'class':
        setTemplates([
          {
            id: 'basic-class',
            name: 'Basic Class Diagram',
            icon: 'ri-layout-3-line',
            template: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    
    class Dog {
        +String breed
        +bark()
    }
    
    class Cat {
        +String color
        +meow()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`
          }
        ]);
        break;

      case 'state':
        setTemplates([
          {
            id: 'simple-state',
            name: 'Simple State Diagram',
            icon: 'ri-bubble-chart-line',
            template: `stateDiagram-v2
    [*] --> Idle
    
    Idle --> Processing: Start
    Processing --> Complete: Success
    Processing --> Error: Fail
    Complete --> [*]
    Error --> Idle: Retry`
          }
        ]);
        break;
    }

    // Set default diagram code
    if (templates.length > 0) {
      setDiagramCode(templates[0].template);
    }
  }, [activeTab]);

  // Generate preview
  useEffect(() => {
    // In a real implementation, this would render the Mermaid diagram
    // For now, we'll just set the code as the preview
    setDiagramPreview(diagramCode);
  }, [diagramCode]);

  // Insert diagram into document
  const handleInsertDiagram = () => {
    if (onInsert && diagramCode.trim()) {
      // For markdown documents, wrap in mermaid code block
      const insertContent = `\`\`\`mermaid\n${diagramCode}\n\`\`\``;
      onInsert(insertContent);
    }
  };

  // Apply template
  const handleApplyTemplate = (template: string) => {
    setDiagramCode(template);
  };

  return (
      <div
          className="diagram-tool-panel h-full flex flex-col"
          style={{
            backgroundColor: currentTheme.colors.background,
            color: currentTheme.colors.foreground
          }}
      >
        {/* Header */}
        <div
            className="p-3 border-b flex justify-between items-center"
            style={{ borderColor: currentTheme.colors.border }}
        >
          <h2 className="text-lg font-medium">Diagram Tool</h2>

          <button
              className="px-3 py-1 rounded text-white text-sm"
              style={{ backgroundColor: currentTheme.colors.accent }}
              onClick={handleInsertDiagram}
              disabled={!onInsert}
          >
            Insert into Document
          </button>
        </div>

        {/* Diagram Type Tabs */}
        <div
            className="flex border-b"
            style={{ borderColor: currentTheme.colors.border }}
        >
          <button
              className={`flex-1 p-2 text-center transition-colors ${activeTab === 'flowchart' ? 'border-b-2' : ''}`}
              style={{
                borderColor: activeTab === 'flowchart' ? currentTheme.colors.accent : 'transparent',
                backgroundColor: activeTab === 'flowchart' ? `${currentTheme.colors.accent}20` : 'transparent'
              }}
              onClick={() => setActiveTab('flowchart')}
          >
            <i className="ri-flow-chart mr-1"></i>Flowchart
          </button>

          <button
              className={`flex-1 p-2 text-center transition-colors ${activeTab === 'sequence' ? 'border-b-2' : ''}`}
              style={{
                borderColor: activeTab === 'sequence' ? currentTheme.colors.accent : 'transparent',
                backgroundColor: activeTab === 'sequence' ? `${currentTheme.colors.accent}20` : 'transparent'
              }}
              onClick={() => setActiveTab('sequence')}
          >
            <i className="ri-arrow-left-right-line mr-1"></i>Sequence
          </button>

          <button
              className={`flex-1 p-2 text-center transition-colors ${activeTab === 'class' ? 'border-b-2' : ''}`}
              style={{
                borderColor: activeTab === 'class' ? currentTheme.colors.accent : 'transparent',
                backgroundColor: activeTab === 'class' ? `${currentTheme.colors.accent}20` : 'transparent'
              }}
              onClick={() => setActiveTab('class')}
          >
            <i className="ri-layout-3-line mr-1"></i>Class
          </button>

          <button
              className={`flex-1 p-2 text-center transition-colors ${activeTab === 'state' ? 'border-b-2' : ''}`}
              style={{
                borderColor: activeTab === 'state' ? currentTheme.colors.accent : 'transparent',
                backgroundColor: activeTab === 'state' ? `${currentTheme.colors.accent}20` : 'transparent'
              }}
              onClick={() => setActiveTab('state')}
          >
            <i className="ri-bubble-chart-line mr-1"></i>State
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Templates */}
          <div
              className="w-64 border-r overflow-y-auto"
              style={{ borderColor: currentTheme.colors.border }}
          >
            <div className="p-3 border-b" style={{ borderColor: currentTheme.colors.border }}>
              <h3 className="font-medium">Templates</h3>
            </div>

            <div className="p-2">
              {templates.map(template => (
                  <div
                      key={template.id}
                      className="p-2 rounded cursor-pointer hover:bg-opacity-10 hover:bg-gray-500 mb-2"
                      onClick={() => handleApplyTemplate(template.template)}
                  >
                    <div className="flex items-center mb-1">
                      <i
                          className={`${template.icon} mr-2`}
                          style={{ color: currentTheme.colors.accent }}
                      ></i>
                      <span className="font-medium">{template.name}</span>
                    </div>
                    <div
                        className="text-xs truncate"
                        style={{ color: currentTheme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                    >
                      {template.template.split('\n')[0]}...
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* Right Content - Editor and Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
            <textarea
                value={diagramCode}
                onChange={(e) => setDiagramCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm resize-none"
                style={{
                  backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#f5f5f5',
                  color: currentTheme.isDark ? '#d4d4d4' : '#333333',
                  borderColor: currentTheme.colors.border,
                  outline: 'none'
                }}
                placeholder="Enter Mermaid diagram code here..."
            />
            </div>

            {/* Preview */}
            <div
                className="h-1/2 border-t p-4 overflow-auto"
                style={{
                  borderColor: currentTheme.colors.border,
                  backgroundColor: currentTheme.isDark ? '#252526' : '#ffffff'
                }}
            >
              <div className="p-2 border-b mb-2" style={{ borderColor: currentTheme.colors.border }}>
                <h3 className="font-medium">Preview</h3>
              </div>

              <div className="diagram-preview">
                {/* In a real implementation, this would render the Mermaid diagram */}
                <pre className="p-3 text-sm rounded" style={{
                  backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#f5f5f5',
                  color: currentTheme.isDark ? '#d4d4d4' : '#333333',
                }}>
                {diagramPreview}
              </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default DiagramTool;
