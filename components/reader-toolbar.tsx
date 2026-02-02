'use client';

import { memo } from 'react';
import { List, Settings, X, Search, Bookmark, BarChart3, Layout, Columns, ScrollText, Maximize2, Minimize2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

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
  viewMode: 'single' | 'double' | 'continuous';
  onViewModeChange: (mode: 'single' | 'double' | 'continuous') => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
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
  viewMode,
  onViewModeChange,
  isFullscreen,
  onToggleFullscreen,
}: ReaderToolbarProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-500 ${isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
    >
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={onOpenChapters}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Open chapters"
            >
              <List className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-sm font-serif text-foreground truncate max-w-[100px] sm:max-w-[200px]">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={onOpenSearch}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Search in book"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                  aria-label="View options"
                >
                  {viewMode === 'continuous' && <ScrollText className="w-5 h-5 text-foreground" />}
                  {viewMode === 'single' && <Layout className="w-5 h-5 text-foreground" />}
                  {viewMode === 'double' && <Columns className="w-5 h-5 text-foreground" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>View Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewModeChange('continuous')}>
                  <ScrollText className="w-4 h-4 mr-2" />
                  <span>Continuous</span>
                  {viewMode === 'continuous' && <span className="ml-auto text-xs opacity-50">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewModeChange('single')}>
                  <Layout className="w-4 h-4 mr-2" />
                  <span>Single Page</span>
                  {viewMode === 'single' && <span className="ml-auto text-xs opacity-50">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewModeChange('double')}>
                  <Columns className="w-4 h-4 mr-2" />
                  <span>Double Page</span>
                  {viewMode === 'double' && <span className="ml-auto text-xs opacity-50">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              className="p-2 rounded-full hover:bg-secondary transition-colors hidden sm:block"
              aria-label="Reading statistics"
            >
              <BarChart3 className="w-5 h-5 text-foreground" />
            </button>
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-foreground" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-foreground" />
                )}
              </button>
            )}
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
              className="p-2 rounded-full hover:bg-secondary transition-colors ml-0.5 sm:ml-1"
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
