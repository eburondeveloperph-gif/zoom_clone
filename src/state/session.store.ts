// Success Class - Session Store
// Manages role, name, language, auth token with localStorage persistence

import { STORAGE_KEYS } from '@/config/placeholders';

export type UserRole = 'teacher' | 'student';

export interface SessionState {
  isAuthenticated: boolean;
  authToken: string | null;
  role: UserRole | null;
  name: string;
  language: string;
  preferredMicId: string | null;
  preferredCamId: string | null;
  // Student-specific
  isMuted: boolean;
  handRaised: boolean;
  canSpeak: boolean; // Granted by teacher
}

// Default state
const defaultState: SessionState = {
  isAuthenticated: false,
  authToken: null,
  role: null,
  name: '',
  language: 'en',
  preferredMicId: null,
  preferredCamId: null,
  isMuted: true,
  handRaised: false,
  canSpeak: false,
};

// Singleton store
let state: SessionState = { ...defaultState };
let listeners: Set<() => void> = new Set();

// Notify all listeners
function notify(): void {
  listeners.forEach((listener) => listener());
}

// Load from localStorage
export function loadSession(): SessionState {
  if (typeof window === 'undefined') {
    return state;
  }
  
  const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const role = localStorage.getItem(STORAGE_KEYS.SESSION_ROLE) as UserRole | null;
  const name = localStorage.getItem(STORAGE_KEYS.SESSION_NAME) || '';
  const language = localStorage.getItem(STORAGE_KEYS.SESSION_LANGUAGE) || 'en';
  const preferredMicId = localStorage.getItem(STORAGE_KEYS.PREFERRED_MIC);
  const preferredCamId = localStorage.getItem(STORAGE_KEYS.PREFERRED_CAM);
  
  state = {
    ...state,
    isAuthenticated: !!authToken,
    authToken,
    role,
    name,
    language,
    preferredMicId,
    preferredCamId,
    // Students start muted
    isMuted: role === 'student',
    canSpeak: role === 'teacher',
  };
  
  notify();
  return state;
}

// Save auth token
export function setAuthToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  state.authToken = token;
  state.isAuthenticated = true;
  notify();
}

// Set user role
export function setRole(role: UserRole): void {
  localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
  state.role = role;
  state.isMuted = role === 'student';
  state.canSpeak = role === 'teacher';
  notify();
}

// Set user name
export function setName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.SESSION_NAME, name);
  state.name = name;
  notify();
}

// Set target language
export function setLanguage(language: string): void {
  localStorage.setItem(STORAGE_KEYS.SESSION_LANGUAGE, language);
  state.language = language;
  notify();
}

// Set preferred devices
export function setPreferredMic(deviceId: string): void {
  localStorage.setItem(STORAGE_KEYS.PREFERRED_MIC, deviceId);
  state.preferredMicId = deviceId;
  notify();
}

export function setPreferredCam(deviceId: string): void {
  localStorage.setItem(STORAGE_KEYS.PREFERRED_CAM, deviceId);
  state.preferredCamId = deviceId;
  notify();
}

// Student: Raise hand
export function raiseHand(raised: boolean): void {
  state.handRaised = raised;
  notify();
}

// Teacher: Grant speak permission to student
export function grantSpeak(granted: boolean): void {
  state.canSpeak = granted;
  state.isMuted = !granted;
  notify();
}

// Toggle mute (only if allowed)
export function toggleMute(): boolean {
  if (state.role === 'student' && !state.canSpeak) {
    return false; // Cannot unmute without permission
  }
  state.isMuted = !state.isMuted;
  notify();
  return true;
}

// Clear session (logout/debug)
export function clearSession(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  state = { ...defaultState };
  notify();
}

// Subscribe to state changes
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Get current state
export function getSessionState(): SessionState {
  return { ...state };
}

// React hook helper
export function useSessionState(): SessionState {
  if (typeof window !== 'undefined' && !state.isAuthenticated) {
    loadSession();
  }
  return getSessionState();
}
