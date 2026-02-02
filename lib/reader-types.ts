export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  margins: 'narrow' | 'normal' | 'wide';
  theme: 'light' | 'sepia' | 'dark';
  zoom: number;
}

export interface Highlight {
  id: string;
  pageNumber: number;
  text: string;
  rects: { x: number; y: number; width: number; height: number }[];
  color: 'yellow' | 'green' | 'blue' | 'pink';
  note?: string;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  pageNumber: number;
  title: string;
  createdAt: number;
}

export interface ReadingSession {
  date: string; // ISO date string YYYY-MM-DD
  minutesRead: number;
  pagesRead: number;
}

export interface ReadingStats {
  totalMinutesRead: number;
  totalPagesRead: number;
  sessionsCount: number;
  averagePagesPerSession: number;
  currentStreak: number;
  longestStreak: number;
  sessions: ReadingSession[];
}

export interface BookMeta {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  totalPages: number;
  coverUrl?: string;
  addedAt: number;
  lastReadAt: number;
  currentPage: number;
}

export interface BookState {
  currentPage: number;
  totalPages: number;
  highlights: Highlight[];
  bookmarks: Bookmark[];
  settings: ReaderSettings;
  lastRead: number;
  stats: ReadingStats;
}

export interface Chapter {
  title: string;
  pageNumber: number;
  level: number;
}

export interface SearchResult {
  pageNumber: number;
  text: string;
  matchIndex: number;
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.6,
  margins: 'wide',
  theme: 'light',
  zoom: 1,
};

export const DEFAULT_STATS: ReadingStats = {
  totalMinutesRead: 0,
  totalPagesRead: 0,
  sessionsCount: 0,
  averagePagesPerSession: 0,
  currentStreak: 0,
  longestStreak: 0,
  sessions: [],
};

export const MARGIN_VALUES = {
  narrow: 40,
  normal: 80,
  wide: 120,
} as const;

export const HIGHLIGHT_COLORS = {
  yellow: { bg: 'rgba(255, 243, 184, 0.6)', border: '#E8D88C' },
  green: { bg: 'rgba(184, 255, 200, 0.6)', border: '#8CE8A0' },
  blue: { bg: 'rgba(184, 220, 255, 0.6)', border: '#8CB8E8' },
  pink: { bg: 'rgba(255, 184, 220, 0.6)', border: '#E88CB8' },
} as const;
