'use client';

// Success Class - Prejoin Card Component
// Role selection, name input, language dropdown, device selectors

import { useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '@/config/placeholders';
import type { UserRole } from '@/state/session.store';

interface Device {
  deviceId: string;
  label: string;
}

interface PrejoinCardProps {
  onJoin: (data: {
    role: UserRole;
    name: string;
    language: string;
    micId: string | null;
    camId: string | null;
  }) => void;
}

export function PrejoinCard({ onJoin }: PrejoinCardProps) {
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [micId, setMicId] = useState<string | null>(null);
  const [camId, setCamId] = useState<string | null>(null);
  const [mics, setMics] = useState<Device[]>([]);
  const [cams, setCams] = useState<Device[]>([]);
  const [showDevices, setShowDevices] = useState(false);

  // Enumerate devices only after user gesture
  const enumerateDevices = async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({ deviceId: d.deviceId, label: d.label || 'Microphone' }));
      
      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d) => ({ deviceId: d.deviceId, label: d.label || 'Camera' }));
      
      setMics(audioInputs);
      setCams(videoInputs);
      
      if (audioInputs.length > 0 && !micId) {
        setMicId(audioInputs[0].deviceId);
      }
      if (videoInputs.length > 0 && !camId) {
        setCamId(videoInputs[0].deviceId);
      }
      
      setShowDevices(true);
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  };

  const handleJoin = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    
    onJoin({
      role,
      name: name.trim(),
      language,
      micId,
      camId,
    });
  };

  return (
    <div className="sc-prejoin-card">
      <h1 className="sc-prejoin-title">Join Success Class</h1>
      
      {/* Role Selection */}
      <div className="sc-field">
        <label className="sc-label">I am joining as</label>
        <div className="sc-role-toggle">
          <button
            className={`sc-role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
          >
            👨‍🏫 Teacher
          </button>
          <button
            className={`sc-role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            👨‍🎓 Student
          </button>
        </div>
      </div>
      
      {/* Name Input */}
      <div className="sc-field">
        <label className="sc-label" htmlFor="name">Your Name</label>
        <input
          id="name"
          type="text"
          className="sc-input"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      {/* Language Selection */}
      <div className="sc-field">
        <label className="sc-label" htmlFor="language">Translate to</label>
        <select
          id="language"
          className="sc-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Device Selection - Only shown after user gesture */}
      {!showDevices ? (
        <button
          className="sc-btn-secondary"
          onClick={enumerateDevices}
        >
          🎤 Configure Devices
        </button>
      ) : (
        <>
          <div className="sc-field">
            <label className="sc-label" htmlFor="mic">Microphone</label>
            <select
              id="mic"
              className="sc-select"
              value={micId || ''}
              onChange={(e) => setMicId(e.target.value)}
            >
              {mics.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="sc-field">
            <label className="sc-label" htmlFor="cam">Camera</label>
            <select
              id="cam"
              className="sc-select"
              value={camId || ''}
              onChange={(e) => setCamId(e.target.value)}
            >
              {cams.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      
      {/* Join Button */}
      <button
        className="sc-btn-primary sc-join-btn"
        onClick={handleJoin}
      >
        Join Classroom
      </button>
      
      {role === 'student' && (
        <p className="sc-hint">
          💡 Students are muted by default. Raise your hand to request speaking permission.
        </p>
      )}
    </div>
  );
}
