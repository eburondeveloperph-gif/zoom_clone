'use client';

// Success Class - Thread Panel Component
// Messenger-style transcription/translation display
// Supports multiple speakers, auto-scroll, per-sentence TTS

import { useRef, useEffect, useState } from 'react';
import { Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import type { ThreadMessage } from '@/runtime/streamRuntime';

interface ThreadPanelProps {
  messages: ThreadMessage[];
  onPlayTTS?: (messageId: string) => void;
  currentUserId?: string;
}

export function ThreadPanel({
  messages,
  onPlayTTS,
  currentUserId,
}: ThreadPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Auto-scroll to latest message (only if user is near bottom)
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Detect scroll position to enable/disable auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  const toggleExpand = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="sc-thread-panel">
      <div className="sc-thread-header">
        <span>💬 Transcript</span>
        {!autoScroll && (
          <button
            className="sc-scroll-btn"
            onClick={() => {
              setAutoScroll(true);
              containerRef.current?.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth',
              });
            }}
          >
            ↓ New messages
          </button>
        )}
      </div>
      
      <div
        className="sc-thread-messages"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="sc-thread-empty">
            <p>🎙️ Transcription will appear here</p>
            <p className="sc-thread-hint">Start speaking to see real-time transcription and translation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isExpanded = expandedMessages.has(msg.id);
            const hasTranslation = msg.translatedText && msg.translatedText !== msg.srcText;
            
            return (
              <div
                key={msg.id}
                className={`sc-message ${msg.speakerRole === 'teacher' ? 'teacher' : 'student'}`}
              >
                <div className="sc-message-header">
                  <span className="sc-message-speaker">
                    {msg.speakerRole === 'teacher' ? '👨‍🏫' : '👨‍🎓'} {msg.speaker}
                  </span>
                  <span className="sc-message-time">{formatTime(msg.timestamp)}</span>
                </div>
                
                {/* Original transcript */}
                <div className="sc-message-text">
                  {msg.srcText}
                </div>
                
                {/* Translation (collapsible) */}
                {hasTranslation && (
                  <div className="sc-message-translation">
                    <button
                      className="sc-translation-toggle"
                      onClick={() => toggleExpand(msg.id)}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>Translation</span>
                    </button>
                    
                    {isExpanded && (
                      <div className="sc-translation-text">
                        {msg.translatedText}
                      </div>
                    )}
                  </div>
                )}
                
                {/* TTS play button */}
                <div className="sc-message-actions">
                  <button
                    className={`sc-tts-btn ${msg.ttsStatus === 'playing' ? 'playing' : ''}`}
                    onClick={() => onPlayTTS?.(msg.id)}
                    disabled={msg.ttsStatus === 'playing'}
                    aria-label="Play audio"
                  >
                    <Volume2 size={14} />
                    {msg.ttsStatus === 'playing' && <span className="sc-tts-playing">▶</span>}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
