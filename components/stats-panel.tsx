'use client';

import { memo, useMemo } from 'react';
import { X, Clock, BookOpen, Flame, TrendingUp, Calendar } from 'lucide-react';
import type { ReadingStats } from '@/lib/reader-types';

interface StatsPanelProps {
  stats: ReadingStats;
  currentPage: number;
  totalPages: number;
  isVisible: boolean;
  onClose: () => void;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export const StatsPanel = memo(function StatsPanel({
  stats,
  currentPage,
  totalPages,
  isVisible,
  onClose,
}: StatsPanelProps) {
  // Calculate activity for last 7 days
  const weekActivity = useMemo(() => {
    const days: { date: string; pages: number; minutes: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const session = stats.sessions.find(s => s.date === dateKey);
      days.push({
        date: dateKey,
        pages: session?.pagesRead || 0,
        minutes: session?.minutesRead || 0,
      });
    }
    
    return days;
  }, [stats.sessions]);

  const maxPages = Math.max(...weekActivity.map(d => d.pages), 1);
  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const pagesRemaining = totalPages - currentPage;

  // Estimate time to finish based on average reading speed
  const avgPagesPerMinute = stats.totalMinutesRead > 0 
    ? stats.totalPagesRead / stats.totalMinutesRead 
    : 0.5; // Default assumption
  const estimatedMinutesToFinish = pagesRemaining > 0 
    ? Math.round(pagesRemaining / avgPagesPerMinute) 
    : 0;

  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-lg text-foreground">Reading Stats</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Book Progress</span>
              <span className="text-sm font-medium text-foreground">{progress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Page {currentPage} of {totalPages}</span>
              {pagesRemaining > 0 && (
                <span>{pagesRemaining} pages left (~{formatTime(estimatedMinutesToFinish)})</span>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Time</span>
              </div>
              <span className="text-xl font-serif text-foreground">
                {formatTime(stats.totalMinutesRead)}
              </span>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Pages Read</span>
              </div>
              <span className="text-xl font-serif text-foreground">
                {stats.totalPagesRead}
              </span>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Current Streak</span>
              </div>
              <span className="text-xl font-serif text-foreground">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Avg/Session</span>
              </div>
              <span className="text-xl font-serif text-foreground">
                {stats.averagePagesPerSession} pages
              </span>
            </div>
          </div>

          {/* Weekly activity */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-20">
              {weekActivity.map((day) => {
                const height = day.pages > 0 ? Math.max((day.pages / maxPages) * 100, 10) : 4;
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                const isToday = day.date === new Date().toISOString().split('T')[0];
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        day.pages > 0 ? 'bg-primary' : 'bg-secondary'
                      } ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
                      style={{ height: `${height}%` }}
                      title={`${day.pages} pages, ${day.minutes}m`}
                    />
                    <span className={`text-xs ${isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Close handle */}
          <div className="flex justify-center mt-4">
            <div className="w-12 h-1 bg-border rounded-full" />
          </div>
        </div>
      </div>
    </>
  );
});
