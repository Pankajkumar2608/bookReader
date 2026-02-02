'use client';

import { memo } from 'react';
import { X } from 'lucide-react';
import type { Chapter } from '@/lib/reader-types';

interface ChapterNavProps {
  chapters: Chapter[];
  currentPage: number;
  onNavigate: (page: number) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const ChapterNav = memo(function ChapterNav({
  chapters,
  currentPage,
  onNavigate,
  isVisible,
  onClose,
}: ChapterNavProps) {
  const currentChapter = chapters.reduce((prev, ch) => {
    if (ch.pageNumber <= currentPage) return ch;
    return prev;
  }, chapters[0]);

  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Side panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-card border-r border-border z-50 transition-transform duration-300 ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-serif text-foreground">Contents</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Close contents"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-65px)] p-4">
          {chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground font-serif italic">
              No chapters found in this document
            </p>
          ) : (
            <ul className="space-y-1">
              {chapters.map((chapter, index) => (
                <li key={`${chapter.title}-${chapter.pageNumber}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(chapter.pageNumber);
                      onClose();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-serif text-sm ${
                      currentChapter?.pageNumber === chapter.pageNumber
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                    style={{ paddingLeft: `${12 + chapter.level * 16}px` }}
                  >
                    <span className="line-clamp-2">{chapter.title}</span>
                    <span className="text-xs text-muted-foreground/60 ml-2">
                      {chapter.pageNumber}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
});
