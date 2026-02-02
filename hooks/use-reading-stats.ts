'use client';

import { useEffect, useRef } from 'react';
import type { ReadingStats, ReadingSession } from '@/lib/reader-types';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateStreak(sessions: ReadingSession[]): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const sortedDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = getTodayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
      
      if (diffDays === 1) {
        currentStreak++;
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        break;
      }
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  
  return { current: currentStreak, longest: longestStreak };
}

interface UseReadingStatsProps {
  bookId: string | null;
  currentPage: number;
  stats: ReadingStats;
  onUpdateStats: (stats: ReadingStats) => void;
}

export function useReadingStats({
  bookId,
  currentPage,
  stats,
  onUpdateStats,
}: UseReadingStatsProps) {
  const sessionStartRef = useRef<number>(Date.now());
  const lastPageRef = useRef<number>(currentPage);
  const pagesReadInSessionRef = useRef<Set<number>>(new Set([currentPage]));
  const statsRef = useRef(stats);
  const onUpdateStatsRef = useRef(onUpdateStats);
  const bookIdRef = useRef(bookId);

  // Keep refs in sync without triggering effects
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    onUpdateStatsRef.current = onUpdateStats;
  }, [onUpdateStats]);

  // Track page visits (only track, don't update state)
  useEffect(() => {
    if (currentPage !== lastPageRef.current) {
      pagesReadInSessionRef.current.add(currentPage);
      lastPageRef.current = currentPage;
    }
  }, [currentPage]);

  // Reset session on book change only
  useEffect(() => {
    if (bookId !== bookIdRef.current) {
      sessionStartRef.current = Date.now();
      pagesReadInSessionRef.current = new Set([currentPage]);
      lastPageRef.current = currentPage;
      bookIdRef.current = bookId;
    }
  }, [bookId, currentPage]);

  // Set up periodic updates - this should only run once on mount
  useEffect(() => {
    if (!bookId) return;

    const updateStats = () => {
      const now = Date.now();
      const minutesElapsed = Math.floor((now - sessionStartRef.current) / 60000);
      const pagesRead = pagesReadInSessionRef.current.size;

      if (minutesElapsed === 0 && pagesRead === 0) return;

      const currentStats = statsRef.current;
      const todayKey = getTodayKey();
      const existingSessionIndex = currentStats.sessions.findIndex(s => s.date === todayKey);
      
      let updatedSessions: ReadingSession[];
      
      if (existingSessionIndex !== -1) {
        updatedSessions = [...currentStats.sessions];
        updatedSessions[existingSessionIndex] = {
          ...updatedSessions[existingSessionIndex],
          minutesRead: updatedSessions[existingSessionIndex].minutesRead + minutesElapsed,
          pagesRead: updatedSessions[existingSessionIndex].pagesRead + pagesRead,
        };
      } else {
        updatedSessions = [
          ...currentStats.sessions,
          {
            date: todayKey,
            minutesRead: minutesElapsed,
            pagesRead: pagesRead,
          },
        ];
      }

      // Keep only last 90 days of sessions
      const cutoffDate = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      updatedSessions = updatedSessions.filter(s => s.date >= cutoffDate);

      const totalMinutes = updatedSessions.reduce((sum, s) => sum + s.minutesRead, 0);
      const totalPages = updatedSessions.reduce((sum, s) => sum + s.pagesRead, 0);
      const { current, longest } = calculateStreak(updatedSessions);

      onUpdateStatsRef.current({
        totalMinutesRead: totalMinutes,
        totalPagesRead: totalPages,
        sessionsCount: updatedSessions.length,
        averagePagesPerSession: updatedSessions.length > 0 ? Math.round(totalPages / updatedSessions.length) : 0,
        currentStreak: current,
        longestStreak: longest,
        sessions: updatedSessions,
      });

      // Reset session counters
      sessionStartRef.current = now;
      pagesReadInSessionRef.current = new Set([lastPageRef.current]);
    };

    const intervalId = setInterval(updateStats, 60000); // Every minute
    
    return () => {
      clearInterval(intervalId);
      // Save final stats on unmount
      updateStats();
    };
  }, [bookId]); // Only depend on bookId

  return {
    stats,
  };
}
