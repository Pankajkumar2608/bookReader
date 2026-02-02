'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseZoomPanOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

export function useZoomPan({
  initialZoom = 1,
  minZoom = 0.5,
  maxZoom = 3,
  zoomStep = 0.25,
}: UseZoomPanOptions = {}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPinchDistance = useRef<number | null>(null);
  const lastPanPosition = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setZoom(z => Math.min(z + zoomStep, maxZoom));
  }, [zoomStep, maxZoom]);

  const zoomOut = useCallback(() => {
    setZoom(z => Math.max(z - zoomStep, minZoom));
  }, [zoomStep, minZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    setZoom(Math.max(minZoom, Math.min(level, maxZoom)));
  }, [minZoom, maxZoom]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoom(z => Math.max(minZoom, Math.min(z + delta, maxZoom)));
    }
  }, [minZoom, maxZoom]);

  // Handle touch pinch zoom
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1 && zoom > 1) {
      setIsPanning(true);
      lastPanPosition.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  }, [zoom, pan]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = (distance - lastPinchDistance.current) * 0.01;
      
      setZoom(z => Math.max(minZoom, Math.min(z + delta, maxZoom)));
      lastPinchDistance.current = distance;
    } else if (e.touches.length === 1 && isPanning && zoom > 1) {
      e.preventDefault();
      setPan({
        x: e.touches[0].clientX - lastPanPosition.current.x,
        y: e.touches[0].clientY - lastPanPosition.current.y,
      });
    }
  }, [isPanning, zoom, minZoom, maxZoom]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
    setIsPanning(false);
  }, []);

  // Handle mouse pan when zoomed
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (zoom > 1 && e.button === 0) {
      setIsPanning(true);
      lastPanPosition.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      };
    }
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning && zoom > 1) {
      setPan({
        x: e.clientX - lastPanPosition.current.x,
        y: e.clientY - lastPanPosition.current.y,
      });
    }
  }, [isPanning, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Double-click/tap to zoom
  const handleDoubleClick = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (zoom === 1) {
      setZoom(2);
      // Center zoom on click position
      const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPan({
        x: rect.width / 2 - clientX,
        y: rect.height / 2 - clientY,
      });
    } else {
      resetZoom();
    }
  }, [zoom, resetZoom]);

  // Reset pan when zoom returns to 1
  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  return {
    zoom,
    pan,
    isPanning,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
    handlers: {
      handleWheel,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleDoubleClick,
    },
  };
}
