// src/components/Properties/PropertiesPanel.tsx
import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import { Document } from '../../types/document';

interface PropertiesPanelProps {
  document: Document | null;
  onUpdateTitle: (title: string) => void;
}

const PropertiesPanel: React.FC<IDockviewPanelProps<PropertiesPanelProps>> = (props) => {
  const { params } = props;
  const { document, onUpdateTitle } = params;

  if (!document) {
    return <div className="properties-container empty">No document selected</div>;
  }

  return (
    <div className="properties-container">
      <div className="property-group">
        <label>Title</label>
        <input
          type="text"
          value={document.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="property-input"
        />
      </div>
      <div className="property-group">
        <label>Type</label>
        <div className="property-value">{document.type}</div>
      </div>
      <div className="property-group">
        <label>Created</label>
        <div className="property-value">{document.createdAt.toLocaleString()}</div>
      </div>
      <div className="property-group">
        <label>Modified</label>
        <div className="property-value">{document.updatedAt.toLocaleString()}</div>
      </div>
    </div>
  );
};

export default PropertiesPanel;