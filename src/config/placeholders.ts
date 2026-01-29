// Success Class - Placeholder API Keys
// These are kept for reference and fallback during development
// User can input their own keys via /auth page

export const PLACEHOLDER_KEYS = {
  // OpenAI Realtime API (STT)
  OPENAI_API_KEY: 'sk-placeholder-openai-key-for-realtime-stt',
  
  // Cerebras (Primary Translation)
  CEREBRAS_API_KEY: 'csk-placeholder-cerebras-key-for-translation',
  
  // Google Translate (Fallback Translation)
  GOOGLE_TRANSLATE_API_KEY: 'placeholder-google-translate-api-key',
  
  // Cartesia (Primary TTS)
  CARTESIA_API_KEY: 'placeholder-cartesia-api-key-for-tts',
  
  // Deepgram (Fallback TTS)
  DEEPGRAM_API_KEY: 'placeholder-deepgram-api-key-for-tts',
  
  // Stream.io (Video/Signaling)
  STREAM_API_KEY: 'placeholder-stream-api-key',
  STREAM_SECRET: 'placeholder-stream-secret',
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'SC_AUTH_TOKEN',
  SESSION_ROLE: 'SC_SESSION_ROLE',
  SESSION_NAME: 'SC_SESSION_NAME',
  SESSION_LANGUAGE: 'SC_SESSION_LANGUAGE',
  PREFERRED_MIC: 'SC_PREFERRED_MIC',
  PREFERRED_CAM: 'SC_PREFERRED_CAM',
};

// Language options for translation
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
];

// Voice options for TTS
export const TTS_VOICES = [
  { id: 'alloy', name: 'Alloy (Neutral)' },
  { id: 'echo', name: 'Echo (Male)' },
  { id: 'fable', name: 'Fable (British)' },
  { id: 'onyx', name: 'Onyx (Deep Male)' },
  { id: 'nova', name: 'Nova (Female)' },
  { id: 'shimmer', name: 'Shimmer (Soft Female)' },
];

// Get API key - user input takes precedence over placeholder
export function getApiKey(keyName: keyof typeof PLACEHOLDER_KEYS): string {
  if (typeof window === 'undefined') {
    return PLACEHOLDER_KEYS[keyName];
  }
  
  const userToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (userToken) {
    try {
      const parsed = JSON.parse(userToken);
      if (parsed[keyName]) {
        return parsed[keyName];
      }
    } catch {
      // Single token mode - use as-is for primary service
      if (keyName === 'OPENAI_API_KEY' && userToken.startsWith('sk-')) {
        return userToken;
      }
    }
  }
  
  return PLACEHOLDER_KEYS[keyName];
}
