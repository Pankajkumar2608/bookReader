'use client';

import { useState, useCallback, useEffect } from 'react';
import type { BookMeta } from '@/lib/reader-types';
import { get, set, del } from 'idb-keyval';

const LIBRARY_KEY = 'codex-library';
const BOOK_DATA_PREFIX = 'codex-book-data-';

export function useLibrary() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load library from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LIBRARY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BookMeta[];
        // Sort by last read, most recent first
        parsed.sort((a, b) => b.lastReadAt - a.lastReadAt);
        setBooks(parsed);
      }
    } catch (e) {
      console.error('Failed to load library:', e);
    }
    setIsLoading(false);
  }, []);

  // Save library to localStorage
  const saveLibrary = useCallback((newBooks: BookMeta[]) => {
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(newBooks));
    } catch (e) {
      console.error('Failed to save library:', e);
    }
  }, []);

  const addBook = useCallback(async (file: File): Promise<BookMeta> => {
    const id = `${file.name}-${file.size}`;
    
    // Check if book already exists
    const existingIndex = books.findIndex(b => b.id === id);
    if (existingIndex !== -1) {
      // Update last read time
      const updatedBooks = [...books];
      updatedBooks[existingIndex] = {
        ...updatedBooks[existingIndex],
        lastReadAt: Date.now(),
      };
      updatedBooks.sort((a, b) => b.lastReadAt - a.lastReadAt);
      setBooks(updatedBooks);
      saveLibrary(updatedBooks);
      return updatedBooks[existingIndex];
    }

    // Store the file data in IndexedDB for persistence
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Store the ArrayBuffer directly, it is much more efficient and supported by IndexedDB
      await set(`${BOOK_DATA_PREFIX}${id}`, arrayBuffer);
    } catch (e) {
      console.error('Failed to store book data:', e);
    }

    const newBook: BookMeta = {
      id,
      title: file.name.replace('.pdf', ''),
      fileName: file.name,
      fileSize: file.size,
      totalPages: 0, // Will be updated when opened
      addedAt: Date.now(),
      lastReadAt: Date.now(),
      currentPage: 1,
    };

    const newBooks = [newBook, ...books];
    setBooks(newBooks);
    saveLibrary(newBooks);
    return newBook;
  }, [books, saveLibrary]);

  const updateBook = useCallback((id: string, updates: Partial<BookMeta>) => {
    setBooks(prev => {
      const updated = prev.map(book =>
        book.id === id ? { ...book, ...updates } : book
      );
      updated.sort((a, b) => b.lastReadAt - a.lastReadAt);
      saveLibrary(updated);
      return updated;
    });
  }, [saveLibrary]);

  const removeBook = useCallback((id: string) => {
    // Remove book data
    // We clean up both IDB and localStorage (in case it was migrated or old data)
    del(`${BOOK_DATA_PREFIX}${id}`).catch(e => console.error('Failed to remove from IDB:', e));
    
    try {
      localStorage.removeItem(`${BOOK_DATA_PREFIX}${id}`);
      localStorage.removeItem(`codex-book-state-${id}`);
    } catch (e) {
      console.error('Failed to remove book data:', e);
    }

    setBooks(prev => {
      const filtered = prev.filter(book => book.id !== id);
      saveLibrary(filtered);
      return filtered;
    });
  }, [saveLibrary]);

  const getBookData = useCallback(async (id: string): Promise<ArrayBuffer | null> => {
    try {
      // Try IDB first
      let data = await get<ArrayBuffer>(`${BOOK_DATA_PREFIX}${id}`);
      
      // Fallback to localStorage for migration/backward compatibility
      if (!data) {
        const base64 = localStorage.getItem(`${BOOK_DATA_PREFIX}${id}`);
        if (base64) {
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          data = bytes.buffer;
        }
      }
      return data || null;
    } catch (e) {
      console.error('Failed to get book data:', e);
      return null;
    }
  }, []);

  const setCoverUrl = useCallback((id: string, coverUrl: string) => {
    updateBook(id, { coverUrl });
  }, [updateBook]);

  return {
    books,
    isLoading,
    addBook,
    updateBook,
    removeBook,
    getBookData,
    setCoverUrl,
  };
}
