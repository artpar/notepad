// src/hooks/useDocumentActions.ts
import { useCallback } from 'react';

export const useDocumentActions = () => {
  const getDocumentIcon = useCallback((type: string, language?: string): string => {
    if (type === 'text') return 'ri-file-text-line';
    if (type === 'markdown') return 'ri-markdown-line';
    
    // Code icons
    if (type === 'javascript' || language === 'javascript') return 'ri-javascript-line';
    if (type === 'typescript' || language === 'typescript') return 'ri-code-s-slash-line';
    if (type === 'python' || language === 'python') return 'ri-code-line';
    if (type === 'html' || language === 'html') return 'ri-html5-line';
    if (type === 'css' || language === 'css') return 'ri-css3-line';
    if (type === 'java' || language === 'java') return 'ri-code-box-line';
    
    return 'ri-file-code-line';
  }, []);
  
  return {
    getDocumentIcon
  };
};

export default useDocumentActions;