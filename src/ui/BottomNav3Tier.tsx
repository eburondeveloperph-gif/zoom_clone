'use client';

// Success Class - 3-Tier Bottom Navigation
// Tier 1 (Nav): Home / Members / Transcript / Translate / Settings
// Tier 2 (Actions): Mic / Speaker / Language / Raise Hand / Key
// Tier 3 (Context): Current tool controls

import { useState } from 'react';
import {
  Home,
  Users,
  MessageSquare,
  Languages,
  Settings,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Hand,
  Key,
} from 'lucide-react';

export type NavItem = 'home' | 'members' | 'transcript' | 'translate' | 'settings';

interface BottomNav3TierProps {
  // State
  activeNav: NavItem;
  isMicOn: boolean;
  isSpeakerOn: boolean;
  isHandRaised: boolean;
  canSpeak: boolean;
  isStudent: boolean;
  currentLanguage: string;
  
  // Callbacks
  onNavChange: (nav: NavItem) => void;
  onMicToggle: () => void;
  onSpeakerToggle: () => void;
  onRaiseHand: () => void;
  onLanguageClick: () => void;
  onKeyClick: () => void;
  
  // Context tier content
  contextContent?: React.ReactNode;
}

export function BottomNav3Tier({
  activeNav,
  isMicOn,
  isSpeakerOn,
  isHandRaised,
  canSpeak,
  isStudent,
  currentLanguage,
  onNavChange,
  onMicToggle,
  onSpeakerToggle,
  onRaiseHand,
  onLanguageClick,
  onKeyClick,
  contextContent,
}: BottomNav3TierProps) {
  const [showContext, setShowContext] = useState(false);

  // Nav items for Tier 1
  const navItems: { id: NavItem; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <Home size={20} />, label: 'Home' },
    { id: 'members', icon: <Users size={20} />, label: 'Members' },
    { id: 'transcript', icon: <MessageSquare size={20} />, label: 'Transcript' },
    { id: 'translate', icon: <Languages size={20} />, label: 'Translate' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <nav className="sc-bottom-nav">
      {/* Tier 3: Context Strip (conditional) */}
      {showContext && contextContent && (
        <div className="sc-nav-tier sc-tier-context">
          {contextContent}
        </div>
      )}
      
      {/* Tier 2: Actions */}
      <div className="sc-nav-tier sc-tier-actions">
        {/* Mic toggle */}
        <button
          className={`sc-action-btn ${isMicOn ? 'active' : ''} ${isStudent && !canSpeak ? 'disabled' : ''}`}
          onClick={onMicToggle}
          disabled={isStudent && !canSpeak}
          aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
          <span className="sc-action-label">Mic</span>
        </button>
        
        {/* Speaker toggle */}
        <button
          className={`sc-action-btn ${isSpeakerOn ? 'active' : ''}`}
          onClick={onSpeakerToggle}
          aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
        >
          {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
          <span className="sc-action-label">Speaker</span>
        </button>
        
        {/* Language selector */}
        <button
          className="sc-action-btn sc-lang-btn"
          onClick={onLanguageClick}
          aria-label="Change language"
        >
          <span className="sc-lang-code">{currentLanguage.toUpperCase()}</span>
          <span className="sc-action-label">Language</span>
        </button>
        
        {/* Raise Hand (students only) */}
        {isStudent && (
          <button
            className={`sc-action-btn ${isHandRaised ? 'active raised' : ''}`}
            onClick={onRaiseHand}
            aria-label={isHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand size={22} className={isHandRaised ? 'sc-hand-raised' : ''} />
            <span className="sc-action-label">{isHandRaised ? 'Lower' : 'Raise'}</span>
          </button>
        )}
        
        {/* API Key */}
        <button
          className="sc-action-btn"
          onClick={onKeyClick}
          aria-label="API Key"
        >
          <Key size={22} />
          <span className="sc-action-label">Key</span>
        </button>
      </div>
      
      {/* Tier 1: Navigation */}
      <div className="sc-nav-tier sc-tier-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sc-nav-btn ${activeNav === item.id ? 'active' : ''}`}
            onClick={() => onNavChange(item.id)}
            aria-label={item.label}
          >
            {item.icon}
            <span className="sc-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
