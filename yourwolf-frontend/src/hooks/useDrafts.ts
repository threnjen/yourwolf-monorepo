import {useState, useEffect, useCallback} from 'react';
import {RoleDraft} from '../types/role';

const STORAGE_KEY = 'yourwolf_drafts';

export function useDrafts() {
  const [drafts, setDrafts] = useState<RoleDraft[]>([]);

  // Load from localStorage on mount only
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setDrafts(parsed);
        }
      }
    } catch {
      // Corrupted data — fall back to empty array
    }
  }, []);

  // Sync to localStorage whenever drafts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // Quota exceeded or storage unavailable — silently ignore
    }
  }, [drafts]);

  const saveDraft = useCallback((draft: RoleDraft) => {
    setDrafts((prev) => {
      const index = prev.findIndex((d) => d.id === draft.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = draft;
        return updated;
      }
      return [...prev, draft];
    });
  }, []);

  const deleteDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const getDraft = useCallback(
    (id: string): RoleDraft | null => {
      return drafts.find((d) => d.id === id) ?? null;
    },
    [drafts],
  );

  const clearAllDrafts = useCallback(() => {
    setDrafts([]);
  }, []);

  return {drafts, saveDraft, deleteDraft, getDraft, clearAllDrafts};
}
