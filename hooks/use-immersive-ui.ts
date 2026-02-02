'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const HIDE_DELAY = 3000;

export function useImmersiveUI() {
  const [isUIVisible, setIsUIVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const showUI = useCallback(() => {
    setIsUIVisible(true);
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsUIVisible(false);
    }, HIDE_DELAY);
  }, []);

  const hideUI = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsUIVisible(false);
  }, []);

  const toggleUI = useCallback(() => {
    if (isUIVisible) {
      hideUI();
    } else {
      showUI();
    }
  }, [isUIVisible, hideUI, showUI]);

  useEffect(() => {
    const handleMouseMove = () => {
      showUI();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't show UI for page navigation keys
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
        showUI();
      }
    };

    const handleTouchStart = () => {
      showUI();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);

    // Initial hide after delay
    timeoutRef.current = setTimeout(() => {
      setIsUIVisible(false);
    }, HIDE_DELAY);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showUI]);

  return { isUIVisible, showUI, hideUI, toggleUI };
}
