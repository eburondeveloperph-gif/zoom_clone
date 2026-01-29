'use client';

// Success Class - Teacher Stage Component
// Fixed 16:9 video container for teacher only
// Minimal overlay with LIVE indicator and mic status

import { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Radio } from 'lucide-react';

interface TeacherStageProps {
  videoStream?: MediaStream | null;
  isLive?: boolean;
  isMuted?: boolean;
  teacherName?: string;
  onHeightChange?: (height: number) => void;
}

export function TeacherStage({
  videoStream,
  isLive = false,
  isMuted = false,
  teacherName = 'Teacher',
  onHeightChange,
}: TeacherStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasVideo, setHasVideo] = useState(false);

  // Attach video stream
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      setHasVideo(true);
    } else {
      setHasVideo(false);
    }
  }, [videoStream]);

  // Report height for bottom sheet positioning
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        onHeightChange?.(containerRef.current.getBoundingClientRect().bottom);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [onHeightChange]);

  return (
    <div className="sc-teacher-stage" ref={containerRef}>
      <div className="sc-video-container">
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="sc-teacher-video"
          />
        ) : (
          <div className="sc-video-placeholder">
            <div className="sc-avatar-large">
              👨‍🏫
            </div>
            <span className="sc-teacher-name">{teacherName}</span>
          </div>
        )}
        
        {/* Overlay controls */}
        <div className="sc-video-overlay">
          {/* LIVE indicator */}
          {isLive && (
            <div className="sc-live-badge">
              <Radio size={12} className="sc-live-icon" />
              <span>LIVE</span>
            </div>
          )}
          
          {/* Mic status */}
          <div className={`sc-mic-status ${isMuted ? 'muted' : ''}`}>
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </div>
        </div>
      </div>
    </div>
  );
}
