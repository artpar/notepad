import React, { useState, useEffect } from 'react';

interface SimpleSaveStatusIndicatorProps {
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  saveDelay: number;
  lastModified?: Date | null;
}

const SimpleSaveStatusIndicator: React.FC<SimpleSaveStatusIndicatorProps> = ({
  isSaving,
  isDirty,
  lastSaved,
  saveDelay,
  lastModified,
}) => {
  const [progress, setProgress] = useState(0);
  
  // Track save progress
  useEffect(() => {
    if (isDirty && !isSaving && lastModified) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - lastModified.getTime();
        const newProgress = Math.min((elapsed / saveDelay) * 100, 100);
        setProgress(newProgress);
        
        if (newProgress >= 100) {
          clearInterval(interval);
        }
      }, 50);
      
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isDirty, isSaving, lastModified, saveDelay]);
  
  if (isSaving) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-32 h-2 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse" />
        </div>
        <span className="text-blue-500 text-sm flex items-center">
          <i className="ri-loader-4-line animate-spin mr-1"></i>
          Saving...
        </span>
      </div>
    );
  }
  
  if (isDirty && !isSaving) {
    const remaining = Math.ceil(((100 - progress) / 100) * saveDelay / 1000);
    
    return (
      <div className="flex items-center space-x-2">
        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-orange-500 text-sm">
          Saving in {remaining}s
        </span>
      </div>
    );
  }
  
  if (!isDirty && lastSaved) {
    return (
      <span className="text-green-500 text-sm flex items-center">
        <i className="ri-check-line mr-1"></i>
        Saved {lastSaved.toLocaleTimeString()}
      </span>
    );
  }
  
  return (
    <span className="text-gray-500 text-sm">
      No changes
    </span>
  );
};

export default SimpleSaveStatusIndicator;