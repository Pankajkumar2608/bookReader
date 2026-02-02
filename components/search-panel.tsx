'use client';

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { SearchResult } from '@/lib/reader-types';

interface SearchPanelProps {
  pdfDoc: PDFDocumentProxy | null;
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (pageNumber: number) => void;
  currentPage: number;
}

export const SearchPanel = memo(function SearchPanel({
  pdfDoc,
  isVisible,
  onClose,
  onNavigate,
  currentPage,
}: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Focus input when panel opens
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!pdfDoc || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    const queryLower = searchQuery.toLowerCase();

    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (abortControllerRef.current.signal.aborted) break;

        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        for (const item of textContent.items) {
          if ('str' in item) {
            pageText += item.str + ' ';
          }
        }

        let matchIndex = 0;
        let startIndex = 0;
        const pageTextLower = pageText.toLowerCase();

        while ((startIndex = pageTextLower.indexOf(queryLower, startIndex)) !== -1) {
          // Extract context around the match
          const contextStart = Math.max(0, startIndex - 40);
          const contextEnd = Math.min(pageText.length, startIndex + queryLower.length + 40);
          let context = pageText.slice(contextStart, contextEnd).trim();
          
          if (contextStart > 0) context = '...' + context;
          if (contextEnd < pageText.length) context = context + '...';

          searchResults.push({
            pageNumber: i,
            text: context,
            matchIndex: matchIndex++,
          });

          startIndex += queryLower.length;
        }
      }

      setResults(searchResults);
      setCurrentResultIndex(0);

      // Navigate to first result
      if (searchResults.length > 0) {
        onNavigate(searchResults[0].pageNumber);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Search error:', error);
      }
    } finally {
      setIsSearching(false);
    }
  }, [pdfDoc, onNavigate]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, performSearch]);

  // Navigate to result
  const goToResult = useCallback((index: number) => {
    if (results[index]) {
      setCurrentResultIndex(index);
      onNavigate(results[index].pageNumber);
    }
  }, [results, onNavigate]);

  const goToPrevResult = useCallback(() => {
    const newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : results.length - 1;
    goToResult(newIndex);
  }, [currentResultIndex, results.length, goToResult]);

  const goToNextResult = useCallback(() => {
    const newIndex = currentResultIndex < results.length - 1 ? currentResultIndex + 1 : 0;
    goToResult(newIndex);
  }, [currentResultIndex, results.length, goToResult]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isVisible) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        goToNextResult();
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        goToPrevResult();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose, goToNextResult, goToPrevResult]);

  // Highlight the matching text in result
  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <mark key={i} className="bg-highlight text-foreground px-0.5 rounded">{part}</mark>
        : part
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in document..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-serif"
          />
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : query && (
            <span className="text-sm text-muted-foreground">
              {results.length > 0 
                ? `${currentResultIndex + 1} of ${results.length}`
                : 'No results'}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Results navigation */}
        {results.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/50">
            <span className="text-xs text-muted-foreground">
              Press Enter to navigate, Shift+Enter for previous
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPrevResult}
                className="p-1 rounded hover:bg-secondary transition-colors"
                aria-label="Previous result"
              >
                <ChevronUp className="w-4 h-4 text-foreground" />
              </button>
              <button
                type="button"
                onClick={goToNextResult}
                className="p-1 rounded hover:bg-secondary transition-colors"
                aria-label="Next result"
              >
                <ChevronDown className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Results list */}
        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={`${result.pageNumber}-${result.matchIndex}`}
                type="button"
                onClick={() => goToResult(index)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors ${
                  index === currentResultIndex ? 'bg-secondary' : ''
                }`}
              >
                <span className="text-xs text-primary font-medium">
                  Page {result.pageNumber}
                </span>
                <p className="text-sm text-foreground mt-1 line-clamp-2">
                  {highlightMatch(result.text, query)}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {query && !isSearching && results.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No results found for &quot;{query}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
});
