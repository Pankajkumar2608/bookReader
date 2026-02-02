'use client';

import { memo } from 'react';
import { Highlighter, Trash2 } from 'lucide-react';
import { HIGHLIGHT_COLORS } from '@/lib/reader-types';

interface HighlightTooltipProps {
  position: { x: number; y: number };
  onHighlight: (color: 'yellow' | 'green' | 'blue' | 'pink') => void;
  onClose: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

export const HighlightTooltip = memo(function HighlightTooltip({
  position,
  onHighlight,
  onClose,
  showDelete,
  onDelete,
}: HighlightTooltipProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-card border border-border rounded-xl shadow-lg p-2 flex items-center gap-1"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -100%) translateY(-8px)',
        }}
      >
        <Highlighter className="w-4 h-4 text-muted-foreground mr-1" />
        
        {(Object.keys(HIGHLIGHT_COLORS) as Array<keyof typeof HIGHLIGHT_COLORS>).map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onHighlight(color)}
            className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground/20 transition-colors"
            style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }}
            aria-label={`Highlight ${color}`}
          />
        ))}

        {showDelete && onDelete && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded-full hover:bg-destructive/10 transition-colors"
              aria-label="Remove highlight"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </>
        )}

        {/* Arrow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid var(--border)',
          }}
        />
      </div>
    </>
  );
});
