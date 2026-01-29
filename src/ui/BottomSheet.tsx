'use client';

// Success Class - Bottom Sheet Component
// Mobile: Members, Settings, Language picker open here
// Tablet: Can be used for tool panels

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  // Minimum top position (to not cover teacher video)
  minTop?: number;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  minTop = 200,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="sc-bottom-sheet-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className="sc-bottom-sheet"
        style={{ top: `${minTop}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        {/* Handle bar for drag (visual only for now) */}
        <div className="sc-sheet-handle">
          <div className="sc-handle-bar" />
        </div>
        
        {/* Header */}
        <div className="sc-sheet-header">
          <h2 id="sheet-title" className="sc-sheet-title">{title}</h2>
          <button
            className="sc-sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="sc-sheet-content">
          {children}
        </div>
      </div>
    </div>
  );
}
