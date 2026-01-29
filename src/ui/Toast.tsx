'use client';

// Success Class - Toast Component
// Simple toast notification for feedback

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'info' | 'success' | 'error';
  onClose?: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    info: <Info size={18} />,
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
  };

  return (
    <div
      className={`sc-toast sc-toast-${type} ${isVisible ? 'visible' : ''}`}
      role="alert"
    >
      <span className="sc-toast-icon">{icons[type]}</span>
      <span className="sc-toast-message">{message}</span>
      <button
        className="sc-toast-close"
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}
