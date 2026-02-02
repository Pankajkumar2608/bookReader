'use client';

import React from "react"

import { memo, useCallback, useState } from 'react';
import { BookOpen, Upload } from 'lucide-react';

interface UploadScreenProps {
  onFileSelect: (file: File) => void;
}

export const UploadScreen = memo(function UploadScreen({
  onFileSelect,
}: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-serif text-foreground mb-2">Codex</h1>
        <p className="text-muted-foreground font-serif">A calm place to read</p>
      </div>

      <label
        htmlFor="pdf-upload"
        className={`relative flex flex-col items-center justify-center w-full max-w-md aspect-[3/4] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          onChange={handleFileInput}
          className="sr-only"
        />
        
        <Upload className={`w-10 h-10 mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="text-foreground font-serif mb-1">Drop your PDF here</span>
        <span className="text-sm text-muted-foreground">or click to browse</span>
      </label>

      <p className="mt-8 text-xs text-muted-foreground/60 max-w-xs text-center font-serif">
        Your books stay private. Everything is stored locally on your device.
      </p>
    </main>
  );
});
