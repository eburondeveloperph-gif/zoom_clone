'use client';

// Success Class - Topbar Component
// Sticky header with brand, room name, and action icons

import { Key, Settings, HelpCircle } from 'lucide-react';

interface TopbarProps {
  roomName?: string;
  onKeyClick?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
}

export function Topbar({
  roomName = 'Success Class',
  onKeyClick,
  onSettingsClick,
  onHelpClick,
}: TopbarProps) {
  return (
    <header className="sc-topbar">
      <div className="sc-topbar-left">
        <div className="sc-brand">
          <span className="sc-brand-icon">📚</span>
          <span className="sc-brand-text">Success Class</span>
        </div>
        <span className="sc-room-divider">|</span>
        <span className="sc-room-name">{roomName}</span>
      </div>
      
      <div className="sc-topbar-right">
        <button
          className="sc-icon-btn"
          onClick={onKeyClick}
          aria-label="API Key"
        >
          <Key size={20} />
        </button>
        <button
          className="sc-icon-btn"
          onClick={onSettingsClick}
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
        <button
          className="sc-icon-btn"
          onClick={onHelpClick}
          aria-label="Help"
        >
          <HelpCircle size={20} />
        </button>
      </div>
    </header>
  );
}
