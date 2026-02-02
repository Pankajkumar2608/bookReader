'use client';

import { memo } from 'react';

interface BookProgressProps {
  currentPage: number;
  totalPages: number;
  isVisible: boolean;
}

export const BookProgress = memo(function BookProgress({
  currentPage,
  totalPages,
  isVisible,
}: BookProgressProps) {
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <div
      className={`fixed right-6 top-1/2 -translate-y-1/2 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Book spine visual */}
      <div className="relative w-3 h-48 bg-secondary rounded-full overflow-hidden shadow-inner">
        {/* Read portion (from top) */}
        <div
          className="absolute top-0 left-0 w-full bg-primary/60 rounded-full transition-all duration-300 ease-out"
          style={{ height: `${progress}%` }}
        />
        
        {/* Current position marker */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-5 h-1 bg-primary rounded-full shadow-sm transition-all duration-300 ease-out"
          style={{ top: `calc(${progress}% - 2px)` }}
        />
      </div>
      
      {/* Page indicator */}
      <div className="mt-3 text-center">
        <span className="text-xs font-serif text-muted-foreground">
          {currentPage}
        </span>
        <span className="text-xs text-muted-foreground/50 mx-1">/</span>
        <span className="text-xs text-muted-foreground/50">
          {totalPages}
        </span>
      </div>
    </div>
  );
});
