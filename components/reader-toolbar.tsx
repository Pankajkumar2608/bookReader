'use client';

import { memo } from 'react';
import { List, Settings, X, Search, Bookmark, BarChart3 } from 'lucide-react';

interface ReaderToolbarProps {
  title: string;
  isVisible: boolean;
  onOpenChapters: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenBookmarks: () => void;
  onOpenStats: () => void;
  onClose: () => void;
  hasBookmarkOnPage?: boolean;
}

export const ReaderToolbar = memo(function ReaderToolbar({
  title,
  isVisible,
  onOpenChapters,
  onOpenSettings,
  onOpenSearch,
  onOpenBookmarks,
  onOpenStats,
  onClose,
  hasBookmarkOnPage,
}: ReaderToolbarProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-500 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenChapters}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Open chapters"
            >
              <List className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-sm font-serif text-foreground truncate max-w-[140px] sm:max-w-[200px]">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenSearch}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Search in book"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>
            <button
              type="button"
              onClick={onOpenBookmarks}
              className="p-2 rounded-full hover:bg-secondary transition-colors relative"
              aria-label="Open bookmarks and highlights"
            >
              <Bookmark className={`w-5 h-5 ${hasBookmarkOnPage ? 'text-primary fill-primary' : 'text-foreground'}`} />
            </button>
            <button
              type="button"
              onClick={onOpenStats}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Reading statistics"
            >
              <BarChart3 className="w-5 h-5 text-foreground" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors ml-1"
              aria-label="Close book"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});
