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
      className={`fixed right-4 top-1/2 -translate-y-1/2 transition-opacity duration-500 hidden lg:block ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      {/* Book spine visual */}
      <div className="relative w-2 h-32 bg-secondary/50 rounded-full overflow-hidden">
        {/* Read portion (from top) */}
        <div
          className="absolute top-0 left-0 w-full bg-primary/40 rounded-full transition-all duration-300 ease-out"
          style={{ height: `${progress}%` }}
        />

        {/* Current position marker */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full shadow-sm transition-all duration-300 ease-out"
          style={{ top: `calc(${Math.min(progress, 98)}% - 2px)` }}
        />
      </div>

      {/* Page indicator */}
      <div className="mt-2 text-center">
        <span className="text-xs font-medium text-muted-foreground">
          {currentPage}/{totalPages}
        </span>
      </div>
    </div>
  );
});
