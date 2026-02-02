'use client';

import { memo, useState, useCallback } from 'react';
import { Bookmark, Highlighter, X, Trash2, Edit3, Check, MessageSquare } from 'lucide-react';
import type { Bookmark as BookmarkType, Highlight } from '@/lib/reader-types';
import { HIGHLIGHT_COLORS } from '@/lib/reader-types';

interface BookmarksPanelProps {
  bookmarks: BookmarkType[];
  highlights: Highlight[];
  currentPage: number;
  onNavigate: (page: number) => void;
  onAddBookmark: (title: string) => void;
  onRemoveBookmark: (id: string) => void;
  onRemoveHighlight: (id: string) => void;
  onUpdateHighlightNote: (id: string, note: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const BookmarksPanel = memo(function BookmarksPanel({
  bookmarks,
  highlights,
  currentPage,
  onNavigate,
  onAddBookmark,
  onRemoveBookmark,
  onRemoveHighlight,
  onUpdateHighlightNote,
  isVisible,
  onClose,
}: BookmarksPanelProps) {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'highlights'>('bookmarks');
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const handleAddBookmark = useCallback(() => {
    const title = newBookmarkTitle.trim() || `Page ${currentPage}`;
    onAddBookmark(title);
    setNewBookmarkTitle('');
  }, [newBookmarkTitle, currentPage, onAddBookmark]);

  const handleStartEditNote = useCallback((highlight: Highlight) => {
    setEditingNoteId(highlight.id);
    setEditingNoteText(highlight.note || '');
  }, []);

  const handleSaveNote = useCallback(() => {
    if (editingNoteId) {
      onUpdateHighlightNote(editingNoteId, editingNoteText);
      setEditingNoteId(null);
      setEditingNoteText('');
    }
  }, [editingNoteId, editingNoteText, onUpdateHighlightNote]);

  const sortedBookmarks = [...bookmarks].sort((a, b) => a.pageNumber - b.pageNumber);
  const sortedHighlights = [...highlights].sort((a, b) => a.pageNumber - b.pageNumber);

  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 transition-transform duration-300 flex flex-col ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-serif text-lg text-foreground">Notes & Bookmarks</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'bookmarks'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Bookmarks ({bookmarks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'highlights'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Highlighter className="w-4 h-4" />
            Highlights ({highlights.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'bookmarks' ? (
            <div className="p-4 space-y-3">
              {/* Add bookmark form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBookmarkTitle}
                  onChange={(e) => setNewBookmarkTitle(e.target.value)}
                  placeholder={`Bookmark page ${currentPage}...`}
                  className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()}
                />
                <button
                  type="button"
                  onClick={handleAddBookmark}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              {/* Bookmarks list */}
              {sortedBookmarks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No bookmarks yet. Add one above!
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="group flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                      onClick={() => onNavigate(bookmark.pageNumber)}
                    >
                      <Bookmark className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{bookmark.title}</p>
                        <p className="text-xs text-muted-foreground">Page {bookmark.pageNumber}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBookmark(bookmark.id);
                        }}
                        className="p-1 rounded-full hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove bookmark"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {sortedHighlights.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No highlights yet. Select text while reading to highlight it.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedHighlights.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="group p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                      onClick={() => onNavigate(highlight.pageNumber)}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: HIGHLIGHT_COLORS[highlight.color].bg }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-3">{highlight.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">Page {highlight.pageNumber}</p>
                        </div>
                      </div>

                      {/* Note */}
                      {editingNoteId === highlight.id ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            placeholder="Add a note..."
                            className="flex-1 px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveNote();
                            }}
                            className="p-1 rounded bg-primary text-primary-foreground"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : highlight.note ? (
                        <p className="mt-2 text-xs text-muted-foreground italic pl-5">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {highlight.note}
                        </p>
                      ) : null}

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditNote(highlight);
                          }}
                          className="p-1 rounded hover:bg-background/50"
                          aria-label="Edit note"
                        >
                          <Edit3 className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveHighlight(highlight.id);
                          }}
                          className="p-1 rounded hover:bg-destructive/10"
                          aria-label="Remove highlight"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
});
