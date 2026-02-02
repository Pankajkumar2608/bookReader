'use client';

import { memo } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
    isVisible: boolean;
    onClose: () => void;
}

const shortcuts = [
    {
        category: 'Navigation', items: [
            { keys: ['←', '↑', 'PageUp'], action: 'Previous page' },
            { keys: ['→', '↓', 'PageDown', 'Space'], action: 'Next page' },
            { keys: ['Home'], action: 'First page' },
            { keys: ['End'], action: 'Last page' },
        ]
    },
    {
        category: 'View', items: [
            { keys: ['F'], action: 'Toggle fullscreen' },
            { keys: ['1'], action: 'Single page view' },
            { keys: ['2'], action: 'Double page view' },
            { keys: ['3'], action: 'Continuous scroll' },
        ]
    },
    {
        category: 'Panels', items: [
            { keys: ['S'], action: 'Open settings' },
            { keys: ['C'], action: 'Open chapters' },
            { keys: ['B'], action: 'Open bookmarks' },
            { keys: ['Ctrl/⌘', '+', 'F'], action: 'Search' },
        ]
    },
    {
        category: 'Zoom', items: [
            { keys: ['Ctrl/⌘', '+', '+'], action: 'Zoom in' },
            { keys: ['Ctrl/⌘', '+', '-'], action: 'Zoom out' },
            { keys: ['Ctrl/⌘', '+', '0'], action: 'Reset zoom' },
        ]
    },
    {
        category: 'General', items: [
            { keys: ['Esc'], action: 'Close panel / Exit reader' },
        ]
    },
];

export const KeyboardShortcuts = memo(function KeyboardShortcuts({
    isVisible,
    onClose,
}: KeyboardShortcutsProps) {
    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Keyboard className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-secondary transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
                    {shortcuts.map(({ category, items }) => (
                        <div key={category}>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
                            <div className="space-y-1">
                                {items.map(({ keys, action }) => (
                                    <div key={action} className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-foreground">{action}</span>
                                        <div className="flex items-center gap-1">
                                            {keys.map((key, idx) => (
                                                <kbd
                                                    key={idx}
                                                    className="px-2 py-1 text-xs font-mono bg-secondary rounded border border-border text-muted-foreground"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-border bg-secondary/30">
                    <p className="text-xs text-muted-foreground text-center">
                        Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-secondary rounded border border-border">?</kbd> to toggle this help
                    </p>
                </div>
            </div>
        </>
    );
});
