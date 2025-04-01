// src/components/Panels/CustomPanels.tsx
import React from 'react';
import { IGroupPanelProps, IWatermarkPanelProps, DockviewGroupPanel } from 'dockview';

// Custom Group Panel
export const CustomGroupPanel: React.FC<IGroupPanelProps> = (props) => {
  return <DockviewGroupPanel {...props} />;
};

// Custom Watermark Panel
export const CustomWatermarkPanel: React.FC<IWatermarkPanelProps> = (props) => {
  return (
    <div className="welcome-screen">
      <h2>Welcome to Engineer's Notepad</h2>
      <p>Select a document from the Explorer or create a new one to get started.</p>
    </div>
  );
};