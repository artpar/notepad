import { useState, useEffect, useRef, useCallback } from 'react';
import * as StorageService from '../services/storage';
import { Document } from '../types/document';

interface UseAutoSaveOptions {
  document: Document | null;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
  debounceMs?: number;
}

interface UseAutoSaveReturn {
  saveDocument: (content: string) => void;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  lastModified: Date | null;
  error: Error | null;
}

export const useAutoSave = ({
  document,
  onSaveStart,
  onSaveComplete,
  onSaveError,
  debounceMs = 1000,
}: UseAutoSaveOptions): UseAutoSaveReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [lastModified, setLastModified] = useState<Date | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentContentRef = useRef<string>(document?.content || '');
  const lastSavedContentRef = useRef<string>(document?.content || '');
  const documentRef = useRef(document);
  
  // Update refs when document changes
  useEffect(() => {
    documentRef.current = document;
    currentContentRef.current = document?.content || '';
    lastSavedContentRef.current = document?.content || '';
    // Reset dirty state when document changes
    setIsDirty(false);
  }, [document]);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Save function that doesn't depend on state
  const performSave = useCallback(async () => {
    const doc = documentRef.current;
    if (!doc || !doc.id) {
      return;
    }
    
    setIsSaving(true);
    onSaveStart?.();
    
    try {
      const docToSave = {
        ...doc,
        content: currentContentRef.current,
        updatedAt: new Date(),
      };
      
      await StorageService.saveDocument(docToSave);
      
      // Update last saved content
      lastSavedContentRef.current = currentContentRef.current;
      
      setIsDirty(false);
      setLastSaved(new Date());
      setError(null);
      onSaveComplete?.();
    } catch (err) {
      const error = err as Error;
      setError(error);
      onSaveError?.(error);
      console.error('[useAutoSave] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSaveStart, onSaveComplete, onSaveError]);
  
  // Debounced save trigger
  const saveDocument = useCallback((content: string) => {
    if (!document || !document.id) {
      return;
    }
    
    // Update current content
    currentContentRef.current = content;
    
    // Mark as dirty if content changed from last saved
    if (content !== lastSavedContentRef.current) {
      setIsDirty(true);
      setLastModified(new Date());
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout
      saveTimeoutRef.current = setTimeout(() => {
        performSave();
      }, debounceMs);
    }
  }, [document?.id, debounceMs, performSave]);
  
  return {
    saveDocument,
    isSaving,
    isDirty,
    lastSaved,
    lastModified,
    error,
  };
};