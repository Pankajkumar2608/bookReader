'use client';

import React from "react"

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';
import { PDFPage } from './pdf-page';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { BookProgress } from './book-progress';
import { SettingsPanel } from './settings-panel';
import { ChapterNav } from './chapter-nav';
import { ReaderToolbar } from './reader-toolbar';
import { BookmarksPanel } from './bookmarks-panel';
import { SearchPanel } from './search-panel';
import { StatsPanel } from './stats-panel';
import { ZoomControls } from './zoom-controls';
import { HighlightTooltip } from './highlight-tooltip';
import { useBookState } from '@/hooks/use-book-state';
import { useImmersiveUI } from '@/hooks/use-immersive-ui';
import { useReadingStats } from '@/hooks/use-reading-stats';
import { useZoomPan } from '@/hooks/use-zoom-pan';
import type { Chapter } from '@/lib/reader-types';
import { MARGIN_VALUES } from '@/lib/reader-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
}

interface PDFReaderProps {
  file?: File;
  fileData?: ArrayBuffer;
  bookId: string;
  bookTitle: string;
  onClose: () => void;
  onUpdateMeta?: (meta: { totalPages: number; currentPage: number; coverUrl?: string }) => void;
}

// Helper component for Lazy Loading Pages in Double View
const LazyPDFPage = ({ pdfDoc, pageNumber, scale, ...props }: any) => {
  const [page, setPage] = useState<PDFPageProxy | null>(null);

  useEffect(() => {
    let cancelled = false;
    pdfDoc.getPage(pageNumber).then((p: PDFPageProxy) => {
      if (!cancelled) setPage(p);
    });
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber]);

  if (!page) return <div className="aspect-[1/1.4] bg-muted animate-pulse rounded-sm" style={{ width: props.containerWidth }} />;

  return <PDFPage page={page} scale={scale} {...props} />;
};

// Helper component for Continuous View - with debounced visibility updates
const PDFPageWrapper = ({ pdfDoc, pageNumber, onVisible, ...props }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(ref, { threshold: 0.5 });
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const isVisible = !!entry?.isIntersecting;
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasReportedRef = useRef(false);

  // Debounced visibility callback to prevent rapid page changes
  useEffect(() => {
    if (isVisible && !hasReportedRef.current) {
      // Only report after being visible for 100ms to avoid flicker
      visibilityTimeoutRef.current = setTimeout(() => {
        hasReportedRef.current = true;
        onVisible();
      }, 100);
    } else if (!isVisible) {
      // Reset on becoming invisible
      hasReportedRef.current = false;
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
    }

    return () => {
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [isVisible, onVisible]);

  useEffect(() => {
    let cancelled = false;
    pdfDoc.getPage(pageNumber).then((p: PDFPageProxy) => {
      if (!cancelled) setPage(p);
    });
    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber]);

  return (
    <div ref={ref} className="min-h-[400px] flex justify-center">
      {page ? (
        <PDFPage page={page} {...props} />
      ) : (
        <div className="w-full h-[600px] flex items-center justify-center bg-card rounded-lg">
          <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export function PDFReader({
  file,
  fileData,
  bookId,
  bookTitle,
  onClose,
  onUpdateMeta
}: PDFReaderProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPageObj, setCurrentPageObj] = useState<PDFPageProxy | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'double' | 'continuous'>('continuous'); // Default to continuous
  const [textSelection, setTextSelection] = useState<{
    text: string;
    rects: { x: number; y: number; width: number; height: number }[];
    position: { x: number; y: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    currentPage,
    totalPages,
    settings,
    highlights,
    bookmarks,
    stats,
    setCurrentPage,
    setTotalPages,
    updateSettings,
    addHighlight,
    removeHighlight,
    updateHighlightNote,
    addBookmark,
    removeBookmark,
    updateStats,
  } = useBookState(bookId);

  const { isUIVisible } = useImmersiveUI();

  useReadingStats({
    bookId,
    currentPage,
    stats,
    onUpdateStats: updateStats,
  });

  const {
    zoom,
    pan,
    isPanning,
    zoomIn,
    zoomOut,
    resetZoom,
    handlers,
  } = useZoomPan({ initialZoom: settings.zoom });

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    async function loadPDF() {
      setIsLoading(true);
      try {
        let data: ArrayBuffer;
        if (fileData) {
          // Copy the ArrayBuffer to prevent "detached" errors when PDF.js transfers it to web worker
          data = fileData.slice(0);
        } else if (file) {
          data = await file.arrayBuffer();
        } else {
          throw new Error('No file data provided');
        }

        const pdf = await getDocument({ data }).promise;

        if (cancelled) {
          pdf.destroy();
          return;
        }

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);

        // Generate cover from first page
        try {
          const firstPage = await pdf.getPage(1);
          const viewport = firstPage.getViewport({ scale: 0.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await firstPage.render({
              canvasContext: context,
              viewport,
            }).promise;

            const coverUrl = canvas.toDataURL('image/jpeg', 0.7);
            onUpdateMeta?.({
              totalPages: pdf.numPages,
              currentPage,
              coverUrl
            });
          }
        } catch (e) {
          console.error('Failed to generate cover:', e);
          onUpdateMeta?.({ totalPages: pdf.numPages, currentPage });
        }

        // Extract outline/chapters
        try {
          const outline = await pdf.getOutline();
          if (outline && outline.length > 0) {
            const extractedChapters: Chapter[] = [];

            async function processOutlineItem(
              item: { title: string; dest: string | unknown[] | null; items?: unknown[] },
              level: number
            ) {
              if (item.dest) {
                let pageNumber = 1;
                if (typeof item.dest === 'string') {
                  const dest = await pdf.getDestination(item.dest);
                  if (dest) {
                    const ref = dest[0];
                    pageNumber = await pdf.getPageIndex(ref) + 1;
                  }
                } else if (Array.isArray(item.dest)) {
                  const ref = item.dest[0];
                  if (ref && typeof ref === 'object' && 'num' in ref) {
                    pageNumber = await pdf.getPageIndex(ref as { num: number; gen: number }) + 1;
                  }
                }
                extractedChapters.push({
                  title: item.title,
                  pageNumber,
                  level,
                });
              }
              if (item.items) {
                for (const child of item.items as { title: string; dest: string | unknown[] | null; items?: unknown[] }[]) {
                  await processOutlineItem(child, level + 1);
                }
              }
            }

            for (const item of outline) {
              await processOutlineItem(item, 0);
            }
            setChapters(extractedChapters);
          }
        } catch (e) {
          console.error('Failed to extract outline:', e);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setIsLoading(false);
      }
    }

    loadPDF();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, fileData, setTotalPages]);

  // Keep a ref for onUpdateMeta to avoid dependency issues
  const onUpdateMetaRef = useRef(onUpdateMeta);
  onUpdateMetaRef.current = onUpdateMeta;

  // Load current page (for single/double mode) or relevant pages (continuous)
  useEffect(() => {
    if (!pdfDoc) return;

    // In continuous mode, we might want to pre-load pages, but for now let's just let them render naturally
    // or implement virtualization later.

    // For single/double mode, we explicitly fetch the current page object
    if (viewMode === 'single' || viewMode === 'double') {
      let cancelled = false;
      pdfDoc.getPage(currentPage).then((page) => {
        if (!cancelled) {
          setCurrentPageObj(page);
        }
      });
      return () => { cancelled = true; };
    }
  }, [pdfDoc, currentPage, totalPages, viewMode]);

  // Update library meta separately to avoid loops
  useEffect(() => {
    if (totalPages > 0) {
      onUpdateMetaRef.current?.({ totalPages, currentPage });
    }
  }, [currentPage, totalPages]);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Attach zoom/pan event listeners
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handlers.handleWheel, { passive: false });
    container.addEventListener('touchstart', handlers.handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handlers.handleTouchMove, { passive: false });
    container.addEventListener('touchend', handlers.handleTouchEnd);
    container.addEventListener('mousedown', handlers.handleMouseDown);
    window.addEventListener('mousemove', handlers.handleMouseMove);
    window.addEventListener('mouseup', handlers.handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handlers.handleWheel);
      container.removeEventListener('touchstart', handlers.handleTouchStart);
      container.removeEventListener('touchmove', handlers.handleTouchMove);
      container.removeEventListener('touchend', handlers.handleTouchEnd);
      container.removeEventListener('mousedown', handlers.handleMouseDown);
      window.removeEventListener('mousemove', handlers.handleMouseMove);
      window.removeEventListener('mouseup', handlers.handleMouseUp);
    };
  }, [handlers]);

  const scale = useMemo(() => {
    // Base scale calculation
    // We need a dummy viewport if we don't have a page object yet
    const margin = MARGIN_VALUES[settings.margins];
    const availableWidth = containerWidth - margin * 2;

    // Approximate a standard page width if we don't have one loaded yet (e.g. 600px)
    const baseWidth = currentPageObj?.getViewport({ scale: 1 }).width || 600;

    let calculatedScale = Math.min(availableWidth / baseWidth, 1.5);

    if (viewMode === 'double') {
      calculatedScale = Math.min((availableWidth / 2) / baseWidth, 1.5);
    }

    return calculatedScale * zoom;
  }, [currentPageObj, containerWidth, settings.margins, zoom, viewMode]);

  // Navigation handlers
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const increment = viewMode === 'double' ? 2 : 1;
      setCurrentPage(Math.min(currentPage + increment, totalPages));
    }
  }, [currentPage, totalPages, setCurrentPage, viewMode]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      const decrement = viewMode === 'double' ? 2 : 1;
      setCurrentPage(Math.max(currentPage - decrement, 1));
    }
  }, [currentPage, setCurrentPage, viewMode]);

  // Check if there's a bookmark on current page
  const hasBookmarkOnPage = useMemo(() => {
    return bookmarks.some(b => b.pageNumber === currentPage);
  }, [bookmarks, currentPage]);

  // Bookmark handler
  const handleAddBookmark = useCallback((title: string) => {
    addBookmark(title, currentPage);
  }, [addBookmark, currentPage]);

  // Text selection handlers
  const handleTextSelect = useCallback((selection: {
    text: string;
    rects: DOMRect[];
    position: { x: number; y: number }
  }) => {
    setTextSelection({
      text: selection.text,
      rects: selection.rects as unknown as { x: number; y: number; width: number; height: number }[],
      position: selection.position,
    });
  }, []);

  const handleSelectionClear = useCallback(() => {
    setTextSelection(null);
  }, []);

  const handleHighlight = useCallback((color: 'yellow' | 'green' | 'blue' | 'pink') => {
    if (!textSelection) return;

    addHighlight({
      pageNumber: currentPage,
      text: textSelection.text,
      rects: textSelection.rects,
      color,
    });

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setTextSelection(null);
  }, [textSelection, currentPage, addHighlight]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't navigate if a panel is open or search is focused
      if (showSettings || showChapters || showBookmarks || showStats) return;

      // Cmd/Ctrl + F for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
        return;
      }

      if (showSearch) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          goToNextPage();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goToPrevPage();
          break;
        case 'Home':
          e.preventDefault();
          setCurrentPage(1);
          break;
        case 'End':
          e.preventDefault();
          setCurrentPage(totalPages);
          break;
        case '+':
        case '=':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            resetZoom();
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    goToNextPage,
    goToPrevPage,
    setCurrentPage,
    totalPages,
    showSettings,
    showChapters,
    showBookmarks,
    showStats,
    showSearch,
    zoomIn,
    zoomOut,
    resetZoom,
  ]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');

    if (settings.theme === 'dark') {
      root.classList.add('dark');
    }
  }, [settings.theme]);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      readerRef.current?.requestFullscreen?.().catch(() => {
        // Fallback: just track the state even if API fails
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => { });
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes (e.g., user pressing Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">Opening your book...</p>
        </div>
      </div>
    );
  }


  return (
    <div
      ref={readerRef}
      className={`min-h-screen h-screen overflow-y-auto transition-colors duration-500 ${settings.theme === 'sepia' ? 'bg-[#F5ECD7]' : 'bg-background'
        }`}
    >
      <ReaderToolbar
        title={bookTitle}
        isVisible={isUIVisible}
        onOpenChapters={() => setShowChapters(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSearch={() => setShowSearch(true)}
        onOpenBookmarks={() => setShowBookmarks(true)}
        onOpenStats={() => setShowStats(true)}
        onClose={onClose}
        hasBookmarkOnPage={hasBookmarkOnPage}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      <ChapterNav
        chapters={chapters}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isVisible={showChapters}
        onClose={() => setShowChapters(false)}
      />

      <SettingsPanel
        settings={settings}
        onUpdate={updateSettings}
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <BookmarksPanel
        bookmarks={bookmarks}
        highlights={highlights}
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setShowBookmarks(false);
        }}
        onAddBookmark={handleAddBookmark}
        onRemoveBookmark={removeBookmark}
        onRemoveHighlight={removeHighlight}
        onUpdateHighlightNote={updateHighlightNote}
        isVisible={showBookmarks}
        onClose={() => setShowBookmarks(false)}
      />

      <SearchPanel
        pdfDoc={pdfDoc}
        isVisible={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={(page) => {
          setCurrentPage(page);
        }}
        currentPage={currentPage}
      />

      <StatsPanel
        stats={stats}
        currentPage={currentPage}
        totalPages={totalPages}
        isVisible={showStats}
        onClose={() => setShowStats(false)}
      />

      <BookProgress
        currentPage={currentPage}
        totalPages={totalPages}
        isVisible={isUIVisible}
      />

      <ZoomControls
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
        isVisible={isUIVisible && zoom !== 1}
      />

      {/* Main reading area */}
      <main
        ref={containerRef}
        className="min-h-screen flex items-center justify-center py-12 sm:py-16 px-2 sm:px-4 relative"
        style={{ paddingLeft: Math.max(8, MARGIN_VALUES[settings.margins] / 2), paddingRight: Math.max(8, MARGIN_VALUES[settings.margins] / 2) }}
      >
        {/* Click zones for navigation - only when not zoomed */}
        {zoom === 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-w-resize opacity-0 hover:opacity-100 transition-opacity disabled:cursor-default"
              aria-label="Previous page"
            >
              <div className={`h-full flex items-center justify-start pl-4 ${isUIVisible ? 'opacity-30' : 'opacity-0'}`}>
                <ChevronLeft className="w-8 h-8 text-muted-foreground" />
              </div>
            </button>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-e-resize opacity-0 hover:opacity-100 transition-opacity disabled:cursor-default"
              aria-label="Next page"
            >
              <div className={`h-full flex items-center justify-end pr-16 ${isUIVisible ? 'opacity-30' : 'opacity-0'}`}>
                <ChevronRight className="w-8 h-8 text-muted-foreground" />
              </div>
            </button>
          </>
        )}

        {/* Page content */}
        <div
          ref={pageContainerRef}
          className={`relative w-full flex flex-col items-center gap-8 ${isPanning ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : ''}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
          onDoubleClick={handlers.handleDoubleClick as unknown as React.MouseEventHandler}
        >
          {viewMode === 'continuous' ? (
            // Continuous Scroll Mode - render pages around current view
            Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(pageNum => Math.abs(pageNum - currentPage) < 8) // Smaller window for better perf
              .map(pageNum => (
                <div key={pageNum} className="relative" id={`page-${pageNum}`}>
                  <PDFPageWrapper
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    scale={scale}
                    containerWidth={containerWidth}
                    highlights={highlights}
                    onTextSelect={handleTextSelect}
                    onSelectionClear={handleSelectionClear}
                    onVisible={() => setCurrentPage(pageNum)}
                  />
                  <div className="text-center text-xs text-muted-foreground/50 py-2">
                    {pageNum} / {totalPages}
                  </div>
                </div>
              ))
          ) : (
            // Single or Double Page Mode
            <div className={`flex ${viewMode === 'double' ? 'flex-row gap-4' : 'flex-col'}`}>
              {currentPageObj && (
                <PDFPage
                  page={currentPageObj}
                  scale={scale}
                  containerWidth={containerWidth}
                  highlights={highlights}
                  onTextSelect={handleTextSelect}
                  onSelectionClear={handleSelectionClear}
                />
              )}
              {viewMode === 'double' && currentPage < totalPages && pdfDoc && (
                <LazyPDFPage
                  pdfDoc={pdfDoc}
                  pageNumber={currentPage + 1}
                  scale={scale}
                  containerWidth={containerWidth}
                  highlights={highlights}
                  onTextSelect={handleTextSelect}
                  onSelectionClear={handleSelectionClear}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Highlight tooltip */}
      {textSelection && (
        <HighlightTooltip
          position={textSelection.position}
          onHighlight={handleHighlight}
          onClose={handleSelectionClear}
        />
      )}
    </div>
  );
}
