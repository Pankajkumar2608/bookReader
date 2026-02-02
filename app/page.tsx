'use client';

import React from "react"

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LibraryView } from '@/components/library-view';
import { UploadScreen } from '@/components/upload-screen';
import { useLibrary } from '@/hooks/use-library';
import type { BookMeta } from '@/lib/reader-types';

// Dynamic import for PDFReader to reduce initial bundle size
const PDFReader = dynamic(
  () => import('@/components/pdf-reader').then(mod => ({ default: mod.PDFReader })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">Loading reader...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function Home() {
  const { books, isLoading, addBook, updateBook, removeBook, getBookData } = useLibrary();
  const [activeBook, setActiveBook] = useState<BookMeta | null>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [activeFileData, setActiveFileData] = useState<ArrayBuffer | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle selecting a book from library
  const handleSelectBook = useCallback(async (book: BookMeta) => {
    // Try to load from stored data first
    const data = await getBookData(book.id);
    if (data) {
      setActiveFileData(data);
      setActiveFile(null);
    }
    setActiveBook(book);
    updateBook(book.id, { lastReadAt: Date.now() });
  }, [getBookData, updateBook]);

  // Handle new file upload
  const handleFileSelect = useCallback(async (file: File) => {
    const book = await addBook(file);
    setActiveFile(file);
    setActiveFileData(null);
    setActiveBook(book);
    setShowUpload(false);
  }, [addBook]);

  // Handle closing the reader
  const handleClose = useCallback(() => {
    setActiveBook(null);
    setActiveFile(null);
    setActiveFileData(null);
  }, []);

  // Keep refs to avoid stale closures in callbacks
  const activeBookRef = useRef(activeBook);
  const updateBookRef = useRef(updateBook);
  
  useEffect(() => {
    activeBookRef.current = activeBook;
  }, [activeBook]);
  
  useEffect(() => {
    updateBookRef.current = updateBook;
  }, [updateBook]);

  // Handle meta updates from reader - use refs to avoid dependency loops
  const handleUpdateMeta = useCallback((meta: { totalPages: number; currentPage: number; coverUrl?: string }) => {
    const book = activeBookRef.current;
    if (book) {
      updateBookRef.current(book.id, {
        totalPages: meta.totalPages,
        currentPage: meta.currentPage,
        ...(meta.coverUrl && { coverUrl: meta.coverUrl }),
      });
    }
  }, []);

  // Handle opening upload dialog
  const handleOpenUpload = useCallback(() => {
    if (books.length === 0) {
      setShowUpload(true);
    } else {
      fileInputRef.current?.click();
    }
  }, [books.length]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleFileSelect(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">Loading library...</p>
        </div>
      </div>
    );
  }

  // If a book is active, show the reader
  if (activeBook && (activeFile || activeFileData)) {
    return (
      <PDFReader
        file={activeFile || undefined}
        fileData={activeFileData || undefined}
        bookId={activeBook.id}
        bookTitle={activeBook.title}
        onClose={handleClose}
        onUpdateMeta={handleUpdateMeta}
      />
    );
  }

  // If no books in library or showing upload, show upload screen
  if (books.length === 0 || showUpload) {
    return (
      <UploadScreen 
        onFileSelect={handleFileSelect} 
      />
    );
  }

  // Show library view
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="sr-only"
      />
      <LibraryView
        books={books}
        onSelectBook={handleSelectBook}
        onUploadNew={handleOpenUpload}
        onDeleteBook={removeBook}
      />
    </>
  );
}
