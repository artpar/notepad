// src/components/Tools/DiagramTool.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import CodeEditor from '../Editor/CodeEditor';
import mermaid from 'mermaid';

const DiagramTool: React.FC = () => {
  const { currentTheme } = useSettings();
  const [code, setCode] = useState<string>(
    `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`
  );
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid with theme settings
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: currentTheme.isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: currentTheme.colors.accent,
        primaryTextColor: currentTheme.colors.foreground,
        primaryBorderColor: currentTheme.colors.border,
        lineColor: currentTheme.colors.foreground,
        secondaryColor: currentTheme.colors.sidebar,
        tertiaryColor: currentTheme.colors.background
      }
    });
    
    renderDiagram();
  }, [currentTheme]);

  // Render the diagram whenever code changes
  useEffect(() => {
    renderDiagram();
  }, [code]);

  const renderDiagram = async () => {
    if (!previewRef.current) return;
    
    try {
      // Clear previous content
      previewRef.current.innerHTML = '';
      setError(null);
      
      // Add the mermaid diagram
      const diagramDiv = document.createElement('div');
      diagramDiv.className = 'mermaid';
      diagramDiv.textContent = code;
      previewRef.current.appendChild(diagramDiv);
      
      // Render the diagram
      await mermaid.run();
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error rendering diagram');
    }
  };

  const handleExportSVG = () => {
    const svg = previewRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportPNG = () => {
    const svg = previewRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Create a new image
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        
        // Convert canvas to PNG and download
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'diagram.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
          }
        });
      };
      
      img.src = url;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div 
        className="flex justify-between items-center p-2"
        style={{ 
          backgroundColor: currentTheme.colors.sidebar,
          borderBottom: `1px solid ${currentTheme.colors.border}` 
        }}
      >
        <h2 className="font-semibold">Mermaid Diagram Editor</h2>
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleExportSVG}
          >
            Export SVG
          </button>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={handleExportPNG}
          >
            Export PNG
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 h-full overflow-hidden">
          <CodeEditor 
            content={code} 
            language="markdown"
            onChange={setCode}
          />
        </div>
        
        <div 
          className="w-1/2 h-full overflow-auto p-4"
          style={{
            backgroundColor: currentTheme.isDark ? '#1e1e1e' : '#ffffff',
            color: currentTheme.isDark ? '#d4d4d4' : '#333333',
            borderLeft: `1px solid ${currentTheme.colors.border}`
          }}
        >
          {error && (
            <div className="p-3 mb-4 bg-red-100 text-red-800 rounded border border-red-200">
              <div className="font-bold">Error rendering diagram:</div>
              <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            </div>
          )}
          <div ref={previewRef} className="flex justify-center" />
        </div>
      </div>
    </div>
  );
};

export default DiagramTool;
