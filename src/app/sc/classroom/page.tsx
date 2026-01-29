'use client';

// Success Class - Classroom Page
// Main classroom UI with teacher video, thread panel, members, bottom nav

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// State
import { loadSession, getSessionState, raiseHand, toggleMute } from '@/state/session.store';
import { initUIState, getUIState, setActivePanel, closeBottomSheet, showToast, subscribeUI } from '@/state/ui.store';

// Runtime
import { initStreamRuntime, disposeStreamRuntime, getStreamRuntime, ThreadMessage } from '@/runtime/streamRuntime';

// UI Components
import { Topbar } from '@/ui/Topbar';
import { TeacherStage } from '@/ui/TeacherStage';
import { ThreadPanel } from '@/ui/ThreadPanel';
import { MembersPanel, Member } from '@/ui/MembersPanel';
import { BottomNav3Tier, NavItem } from '@/ui/BottomNav3Tier';
import { BottomSheet } from '@/ui/BottomSheet';
import { Toast } from '@/ui/Toast';
import { SUPPORTED_LANGUAGES } from '@/config/placeholders';

export default function ClassroomPage() {
  const router = useRouter();
  const initRef = useRef(false);
  
  // Session state
  const [session, setSession] = useState(getSessionState());
  
  // UI state
  const [ui, setUI] = useState(getUIState());
  const [activeNav, setActiveNav] = useState<NavItem>('transcript');
  
  // Runtime state
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // Media
  const [teacherVideoStream, setTeacherVideoStream] = useState<MediaStream | null>(null);
  
  // Settings
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [teacherVideoHeight, setTeacherVideoHeight] = useState(0);
  
  // Mock members (would come from signaling in real app)
  const [members, setMembers] = useState<Member[]>([]);

  // Initialize
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    // Load session
    const loadedSession = loadSession();
    if (!loadedSession.isAuthenticated || !loadedSession.role) {
      router.replace('/');
      return;
    }
    setSession(loadedSession);
    
    // Initialize UI state
    initUIState();
    
    // Add self as member
    setMembers([{
      id: 'self',
      name: loadedSession.name || (loadedSession.role === 'teacher' ? 'Teacher' : 'Student'),
      role: loadedSession.role,
      isMuted: loadedSession.isMuted,
      handRaised: loadedSession.handRaised,
      canSpeak: loadedSession.canSpeak,
      isOnline: true,
    }]);
    
    // Initialize stream runtime
    const runtime = initStreamRuntime({
      sourceLanguage: 'en', // Teacher's language
      targetLanguage: loadedSession.language,
      enableTTS: true,
      onThread: (msgs) => setMessages(msgs),
      onAudioLevel: (level) => setAudioLevel(level),
      onSpeaking: (speaking) => setIsSpeaking(speaking),
      onError: (error) => showToast(error.message, 'error'),
    });
    
    // Start runtime
    runtime.init().then(() => {
      runtime.start().then(() => {
        setIsLive(true);
      });
    });
    
    // Get teacher video (if teacher)
    if (loadedSession.role === 'teacher') {
      navigator.mediaDevices.getUserMedia({
        video: { deviceId: loadedSession.preferredCamId || undefined },
        audio: false, // Audio handled separately
      }).then(stream => {
        setTeacherVideoStream(stream);
      }).catch(err => {
        console.error('Failed to get camera:', err);
      });
    }
    
    // Subscribe to UI changes
    const unsubUI = subscribeUI(() => setUI(getUIState()));
    
    return () => {
      unsubUI();
      disposeStreamRuntime();
      if (teacherVideoStream) {
        teacherVideoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [router]);

  // Handle nav changes
  const handleNavChange = useCallback((nav: NavItem) => {
    setActiveNav(nav);
    
    switch (nav) {
      case 'members':
        setActivePanel('members');
        break;
      case 'transcript':
        setActivePanel('transcript');
        break;
      case 'settings':
        setActivePanel('settings');
        break;
      default:
        setActivePanel(null);
    }
  }, []);

  // Handle mic toggle
  const handleMicToggle = useCallback(() => {
    const success = toggleMute();
    if (!success) {
      showToast('Raise your hand to request speaking permission', 'info');
    } else {
      setSession(getSessionState());
    }
  }, []);

  // Handle raise hand
  const handleRaiseHand = useCallback(() => {
    const newState = !session.handRaised;
    raiseHand(newState);
    setSession(getSessionState());
    
    // Update members list
    setMembers(prev => prev.map(m => 
      m.id === 'self' ? { ...m, handRaised: newState } : m
    ));
    
    showToast(newState ? 'Hand raised' : 'Hand lowered', 'info');
  }, [session.handRaised]);

  // Handle language click
  const handleLanguageClick = useCallback(() => {
    if (ui.isTablet) {
      setActivePanel('language');
    } else {
      setActivePanel('language');
    }
  }, [ui.isTablet]);

  // Handle grant speak
  const handleGrantSpeak = useCallback((memberId: string) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, canSpeak: true, handRaised: false } : m
    ));
    showToast('Speaking permission granted', 'success');
  }, []);

  // Handle revoke speak
  const handleRevokeSpeak = useCallback((memberId: string) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, canSpeak: false } : m
    ));
    showToast('Speaking permission revoked', 'info');
  }, []);

  // Render bottom sheet content
  const renderBottomSheetContent = () => {
    switch (ui.bottomSheetContent) {
      case 'members':
        return (
          <MembersPanel
            members={members}
            currentUserId="self"
            isTeacher={session.role === 'teacher'}
            onGrantSpeak={handleGrantSpeak}
            onRevokeSpeak={handleRevokeSpeak}
          />
        );
      case 'language':
        return (
          <div className="sc-language-picker">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`sc-lang-option ${session.language === lang.code ? 'active' : ''}`}
                onClick={() => {
                  getStreamRuntime()?.setTargetLanguage(lang.code);
                  closeBottomSheet();
                }}
              >
                <span className="sc-lang-flag">{lang.flag}</span>
                <span className="sc-lang-name">{lang.name}</span>
              </button>
            ))}
          </div>
        );
      case 'settings':
        return (
          <div className="sc-settings-panel">
            <div className="sc-setting-item">
              <span>Enable TTS Playback</span>
              <input
                type="checkbox"
                checked={isSpeakerOn}
                onChange={(e) => {
                  setIsSpeakerOn(e.target.checked);
                  getStreamRuntime()?.setTTSEnabled(e.target.checked);
                }}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sc-classroom">
      {/* Sticky Topbar */}
      <Topbar
        roomName="Success Class"
        onKeyClick={() => router.push('/auth')}
        onSettingsClick={() => handleNavChange('settings')}
      />
      
      {/* Main Content Area */}
      <div className="sc-main-content">
        {/* Left/Center: Teacher Stage + Thread */}
        <div className="sc-main-panel">
          {/* Teacher Video */}
          <TeacherStage
            videoStream={teacherVideoStream}
            isLive={isLive}
            isMuted={session.role === 'teacher' ? session.isMuted : false}
            teacherName={session.role === 'teacher' ? session.name : 'Teacher'}
            onHeightChange={setTeacherVideoHeight}
          />
          
          {/* Thread Panel (Messenger-style transcript) */}
          {(activeNav === 'transcript' || activeNav === 'translate' || activeNav === 'home') && (
            <ThreadPanel
              messages={messages}
              currentUserId="self"
            />
          )}
        </div>
        
        {/* Right: Members Panel (tablet only) */}
        {ui.isTablet && ui.activePanel === 'members' && (
          <aside className="sc-side-panel">
            <MembersPanel
              members={members}
              currentUserId="self"
              isTeacher={session.role === 'teacher'}
              onGrantSpeak={handleGrantSpeak}
              onRevokeSpeak={handleRevokeSpeak}
            />
          </aside>
        )}
      </div>
      
      {/* Bottom Navigation (3-tier) */}
      <BottomNav3Tier
        activeNav={activeNav}
        isMicOn={!session.isMuted}
        isSpeakerOn={isSpeakerOn}
        isHandRaised={session.handRaised}
        canSpeak={session.canSpeak}
        isStudent={session.role === 'student'}
        currentLanguage={session.language}
        onNavChange={handleNavChange}
        onMicToggle={handleMicToggle}
        onSpeakerToggle={() => setIsSpeakerOn(!isSpeakerOn)}
        onRaiseHand={handleRaiseHand}
        onLanguageClick={handleLanguageClick}
        onKeyClick={() => router.push('/auth')}
      />
      
      {/* Bottom Sheet (mobile) */}
      <BottomSheet
        isOpen={ui.bottomSheetOpen}
        onClose={closeBottomSheet}
        title={
          ui.bottomSheetContent === 'members' ? 'Members' :
          ui.bottomSheetContent === 'language' ? 'Select Language' :
          ui.bottomSheetContent === 'settings' ? 'Settings' : ''
        }
        minTop={teacherVideoHeight || 200}
      >
        {renderBottomSheetContent()}
      </BottomSheet>
      
      {/* Toast Notifications */}
      <Toast
        message={ui.toastMessage}
        type={ui.toastType}
        onClose={() => {}}
      />
    </div>
  );
}
