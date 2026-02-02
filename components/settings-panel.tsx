'use client';

import { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { ReaderSettings } from '@/lib/reader-types';

interface SettingsPanelProps {
  settings: ReaderSettings;
  onUpdate: (updates: Partial<ReaderSettings>) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const SettingsPanel = memo(function SettingsPanel({
  settings,
  onUpdate,
  isVisible,
  onClose,
}: SettingsPanelProps) {
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
        className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-6 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
      >
        <div className="max-w-md mx-auto space-y-6">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-serif">Text Size</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onUpdate({ fontSize: Math.max(14, settings.fontSize - 2) })}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label="Decrease font size"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>
              <span className="text-sm font-serif w-8 text-center text-foreground">{settings.fontSize}</span>
              <button
                type="button"
                onClick={() => onUpdate({ fontSize: Math.min(28, settings.fontSize + 2) })}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label="Increase font size"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* Line Height */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-serif">Line Spacing</span>
            <div className="flex items-center gap-2">
              {[1.4, 1.6, 1.8, 2.0].map((lh) => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => onUpdate({ lineHeight: lh })}
                  className={`px-3 py-1 text-xs font-serif rounded-full transition-colors ${settings.lineHeight === lh
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                >
                  {lh}
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-serif">Margins</span>
            <div className="flex items-center gap-2">
              {(['narrow', 'normal', 'wide'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onUpdate({ margins: m })}
                  className={`px-3 py-1 text-xs font-serif capitalize rounded-full transition-colors ${settings.margins === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Close handle */}
        <div className="flex justify-center mt-4">
          <div className="w-12 h-1 bg-border rounded-full" />
        </div>
      </div>
    </>
  );
});
