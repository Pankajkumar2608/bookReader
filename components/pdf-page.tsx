'use client';

import { useEffect, useRef, memo, useState, useCallback } from 'react';
import type { PDFPageProxy, TextContent } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import type { Highlight } from '@/lib/reader-types';
import { HIGHLIGHT_COLORS } from '@/lib/reader-types';

interface PDFPageProps {
  page: PDFPageProxy;
  scale: number;
  containerWidth: number;
  highlights?: Highlight[];
  onTextSelect?: (selection: { text: string; rects: DOMRect[]; position: { x: number; y: number } }) => void;
  onSelectionClear?: () => void;
}

export const PDFPage = memo(function PDFPage({
  page,
  scale,
  containerWidth,
  highlights = [],
  onTextSelect,
  onSelectionClear,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const renderTaskRef = useRef<ReturnType<typeof page.render> | null>(null);

  // Render canvas and text layer
  useEffect(() => {
    const canvas = canvasRef.current;
    const textLayer = textLayerRef.current;
    if (!canvas || !textLayer || !page) return;

    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas dimensions
    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    // Cancel any existing render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    const renderTask = page.render({
      canvasContext: context,
      viewport,
    });

    renderTaskRef.current = renderTask;

    renderTask.promise
      .then(() => {
        setIsRendered(true);
      })
      .catch((err) => {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      });

    // Render text layer for selection
    page.getTextContent().then((textContent: TextContent) => {
      // Clear existing text layer
      textLayer.innerHTML = '';
      textLayer.style.width = `${Math.floor(viewport.width)}px`;
      textLayer.style.height = `${Math.floor(viewport.height)}px`;

      // Use pdfjs-dist's text layer rendering
      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport,
        textDivs: [],
      });
    });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [page, scale, containerWidth]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !textLayerRef.current || !containerRef.current || !canvasRef.current) {
      onSelectionClear?.();
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      onSelectionClear?.();
      return;
    }

    // Get selection rects relative to the container
    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects());

    if (rects.length === 0) {
      onSelectionClear?.();
      return;
    }

    // Calculate tooltip position (center top of selection)
    const firstRect = rects[0];
    const lastRect = rects[rects.length - 1];
    const containerRect = containerRef.current.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();

    const position = {
      x: (firstRect.left + lastRect.right) / 2,
      y: firstRect.top,
    };

    // Convert rects to be relative to the canvas (not container) for accurate positioning
    const relativeRects = rects.map(rect => ({
      x: rect.left - canvasRect.left,
      y: rect.top - canvasRect.top,
      width: rect.width,
      height: rect.height,
    }));

    onTextSelect?.({
      text: selectedText,
      rects: relativeRects as unknown as DOMRect[],
      position,
    });
  }, [onTextSelect, onSelectionClear]);

  // Get current page highlights
  const pageHighlights = highlights.filter(h => h.pageNumber === page.pageNumber);

  return (
    <div
      ref={containerRef}
      className="relative page-container bg-white dark:bg-neutral-900 rounded-sm shadow-md"
    >
      {/* Canvas wrapper - contains canvas, highlights, and text layer */}
      <div className="relative inline-block">
        {/* Canvas layer */}
        <canvas
          ref={canvasRef}
          className={`block transition-opacity duration-300 ${isRendered ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Highlight overlays - positioned relative to canvas */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {pageHighlights.map((highlight) => (
            <div key={highlight.id}>
              {highlight.rects.map((rect, idx) => (
                <div
                  key={`${highlight.id}-${idx}`}
                  className="absolute rounded-sm"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.width,
                    height: rect.height,
                    backgroundColor: HIGHLIGHT_COLORS[highlight.color].bg,
                    mixBlendMode: 'multiply',
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Text layer for selection - positioned relative to canvas */}
        <div
          ref={textLayerRef}
          className="textLayer"
          onMouseUp={handleMouseUp}
        />
      </div>

      {/* Loading indicator */}
      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});
