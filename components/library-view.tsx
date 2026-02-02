'use client';

import { memo, useCallback, useState } from 'react';
import { BookOpen, Upload, Clock, FileText, MoreVertical, Trash2, Grid, List } from 'lucide-react';
import type { BookMeta } from '@/lib/reader-types';

interface LibraryViewProps {
  books: BookMeta[];
  onSelectBook: (book: BookMeta) => void;
  onUploadNew: () => void;
  onDeleteBook: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLastRead(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getProgress(book: BookMeta): number {
  if (!book.totalPages) return 0;
  return Math.round((book.currentPage / book.totalPages) * 100);
}

const BookCard = memo(function BookCard({
  book,
  onSelect,
  onDelete,
  viewMode,
}: {
  book: BookMeta;
  onSelect: () => void;
  onDelete: () => void;
  viewMode: 'grid' | 'list';
}) {
  const [showMenu, setShowMenu] = useState(false);
  const progress = getProgress(book);

  if (viewMode === 'list') {
    return (
      <div
        className="group flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
        onClick={onSelect}
      >
        {/* Cover thumbnail */}
        <div className="w-12 h-16 bg-secondary rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
          {book.coverUrl ? (
            <img src={book.coverUrl || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
          ) : (
            <FileText className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-foreground truncate">{book.title}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatLastRead(book.lastReadAt)}
            </span>
            {book.totalPages > 0 && (
              <span>{book.currentPage} of {book.totalPages} pages</span>
            )}
          </div>
        </div>

        {/* Progress */}
        {book.totalPages > 0 && (
          <div className="w-20 shrink-0">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground mt-1 block text-right">{progress}%</span>
          </div>
        )}

        {/* Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-full hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-secondary flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative cursor-pointer"
      onClick={onSelect}
    >
      {/* Book cover */}
      <div className="aspect-2/3 bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
        {book.coverUrl ? (
          <img src={book.coverUrl || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-linear-to-br from-secondary to-muted">
            <FileText className="w-12 h-12 text-muted-foreground mb-3" />
            <span className="text-xs text-muted-foreground text-center line-clamp-3 font-serif">
              {book.title}
            </span>
          </div>
        )}

        {/* Progress bar */}
        {book.totalPages > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mt-2 px-1">
        <h3 className="font-serif text-sm text-foreground truncate">{book.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{formatLastRead(book.lastReadAt)}</p>
      </div>

      {/* Menu button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreVertical className="w-4 h-4 text-foreground" />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
          <div className="absolute right-2 top-10 bg-card border border-border rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-secondary flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export const LibraryView = memo(function LibraryView({
  books,
  onSelectBook,
  onUploadNew,
  onDeleteBook,
}: LibraryViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSelect = useCallback((book: BookMeta) => {
    onSelectBook(book);
  }, [onSelectBook]);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-serif text-foreground">Codex</h1>
              <p className="text-xs text-muted-foreground">{books.length} {books.length === 1 ? 'book' : 'books'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                  }`}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4 text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                  }`}
                aria-label="List view"
              >
                <List className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Upload button */}
            <button
              type="button"
              onClick={onUploadNew}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Add Book</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {books.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif text-foreground mb-2">Your library is empty</h2>
            <p className="text-muted-foreground mb-6">Add your first book to start reading</p>
            <button
              type="button"
              onClick={onUploadNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload PDF</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={() => handleSelect(book)}
                onDelete={() => onDeleteBook(book.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={() => handleSelect(book)}
                onDelete={() => onDeleteBook(book.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
});
