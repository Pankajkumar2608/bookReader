'use client';

import { memo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  isVisible: boolean;
}

export const ZoomControls = memo(function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  isVisible,
}: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full shadow-lg px-2 py-1 flex items-center gap-1 z-30 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        className="p-2 rounded-full hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="Zoom out"
      >
        <ZoomOut className="w-4 h-4 text-foreground" />
      </button>

      <button
        type="button"
        onClick={onReset}
        className="px-3 py-1 text-sm font-medium text-foreground hover:bg-secondary rounded-full transition-colors min-w-[60px]"
        aria-label="Reset zoom"
      >
        {zoomPercent}%
      </button>

      <button
        type="button"
        onClick={onZoomIn}
        disabled={zoom >= 3}
        className="p-2 rounded-full hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        aria-label="Zoom in"
      >
        <ZoomIn className="w-4 h-4 text-foreground" />
      </button>

      {zoom !== 1 && (
        <button
          type="button"
          onClick={onReset}
          className="p-2 rounded-full hover:bg-secondary transition-colors ml-1 border-l border-border"
          aria-label="Reset to fit"
        >
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
});
