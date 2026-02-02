'use client';

import { useState, useCallback, useEffect } from 'react';
import type { BookState, Bookmark, Highlight, ReaderSettings, ReadingStats } from '@/lib/reader-types';
import { DEFAULT_SETTINGS, DEFAULT_STATS } from '@/lib/reader-types';

const STORAGE_KEY = 'codex-book-state';

function getStorageKey(bookId: string) {
  return `${STORAGE_KEY}-${bookId}`;
}

export function useBookState(bookId: string | null) {
  const [state, setState] = useState<BookState>({
    currentPage: 1,
    totalPages: 0,
    highlights: [],
    bookmarks: [],
    settings: DEFAULT_SETTINGS,
    lastRead: Date.now(),
    stats: DEFAULT_STATS,
  });

  // Load state from localStorage
  useEffect(() => {
    if (!bookId) return;
    
    try {
      const stored = localStorage.getItem(getStorageKey(bookId));
      if (stored) {
        const parsed = JSON.parse(stored) as BookState;
        setState(prev => ({
          ...prev,
          ...parsed,
          // Ensure all new fields have defaults
          bookmarks: parsed.bookmarks || [],
          stats: parsed.stats || DEFAULT_STATS,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          lastRead: Date.now(),
        }));
      }
    } catch (e) {
      console.error('Failed to load book state:', e);
    }
  }, [bookId]);

  // Save state to localStorage (debounced)
  useEffect(() => {
    if (!bookId || state.totalPages === 0) return;
    
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(getStorageKey(bookId), JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save book state:', e);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [bookId, state]);

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages || page)),
      lastRead: Date.now(),
    }));
  }, []);

  const setTotalPages = useCallback((total: number) => {
    setState(prev => ({ ...prev, totalPages: total }));
  }, []);

  const updateSettings = useCallback((updates: Partial<ReaderSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  // Highlight functions
  const addHighlight = useCallback((highlight: Omit<Highlight, 'id' | 'createdAt'>) => {
    const newHighlight: Highlight = {
      ...highlight,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      highlights: [...prev.highlights, newHighlight],
    }));
    return newHighlight;
  }, []);

  const removeHighlight = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h.id !== id),
    }));
  }, []);

  const updateHighlightNote = useCallback((id: string, note: string) => {
    setState(prev => ({
      ...prev,
      highlights: prev.highlights.map(h =>
        h.id === id ? { ...h, note } : h
      ),
    }));
  }, []);

  // Bookmark functions
  const addBookmark = useCallback((title: string, pageNumber: number) => {
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      title,
      pageNumber,
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      bookmarks: [...prev.bookmarks, newBookmark],
    }));
    return newBookmark;
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.filter(b => b.id !== id),
    }));
  }, []);

  // Stats functions
  const updateStats = useCallback((stats: ReadingStats) => {
    setState(prev => ({
      ...prev,
      stats,
    }));
  }, []);

  return {
    ...state,
    setCurrentPage,
    setTotalPages,
    updateSettings,
    addHighlight,
    removeHighlight,
    updateHighlightNote,
    addBookmark,
    removeBookmark,
    updateStats,
  };
}
