// Orbit AI Secces Class - Text-to-Speech Service
export interface TTSConfig {
  voiceId?: string;
  language?: string;
  speed?: number;
  onAudioReady?: (audioUrl: string) => void;
  onError?: (error: Error) => void;
}

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  preview?: string;
}

// Orbit AI Secces Class voices
export const ORBIT_AI_VOICES: VoiceOption[] = [
  { id: 'a0e99841-438c-4a64-b679-ae501e7d6091', name: 'Barbershop Man', language: 'en', gender: 'male' },
  { id: '156fb8d2-335b-4950-9cb3-a2d33659b2e9', name: 'Confident British Man', language: 'en', gender: 'male' },
  { id: 'e3827ec5-697a-4b7c-9c48-1f6c1f2a3c35', name: 'Friendly Sidekick', language: 'en', gender: 'male' },
  { id: '71a7ad14-091c-4e8e-a314-022ece01c121', name: 'British Lady', language: 'en', gender: 'female' },
  { id: '5345cf08-6f37-424d-a5d9-8ae1f1f8d9e1', name: 'California Girl', language: 'en', gender: 'female' },
  { id: 'a167e0f3-df7e-4d52-a9c3-f949145f52bd', name: 'Sportsman', language: 'en', gender: 'male' },
  { id: '2b568345-1d48-4047-b25f-7baccf842eb0', name: 'French Woman', language: 'fr', gender: 'female' },
  { id: '3b554273-4299-48b9-9aaf-eefd438e3941', name: 'German Man', language: 'de', gender: 'male' },
  { id: '15a9cd88-84b0-4a8b-95f2-5d583b54c72e', name: 'Spanish Woman', language: 'es', gender: 'female' },
  { id: 'f9836c6e-a0bd-460e-9d3c-f7299fa60f94', name: 'Japanese Woman', language: 'ja', gender: 'female' },
  { id: '2ee87190-8f84-4925-97da-e52547f9462c', name: 'Korean Man', language: 'ko', gender: 'male' },
  { id: 'c2ac25f9-ecc4-4f56-9095-651354df60c0', name: 'Chinese Woman', language: 'zh', gender: 'female' },
  { id: 'ed81fd13-2016-4a49-8fe3-c0d2761695fc', name: 'Indian Man', language: 'hi', gender: 'male' },
  { id: 'c45bc5ec-dc68-4feb-8829-6e6b2748095d', name: 'Arabic Man', language: 'ar', gender: 'male' },
  { id: '79a125e8-cd45-4c13-8a67-188112f4dd22', name: 'Portuguese Woman', language: 'pt', gender: 'female' },
  { id: 'a3520a8f-226a-428d-9f78-adacd2c13b96', name: 'Italian Man', language: 'it', gender: 'male' },
  { id: 'b7d50908-b17c-442d-ad8d-b70f07d5b0b4', name: 'Russian Woman', language: 'ru', gender: 'female' },
  { id: 'ee7ea9f8-c0c1-498c-9279-764d6b56d189', name: 'Dutch Man', language: 'nl', gender: 'male' },
  { id: 'f146dcec-e481-45be-8ad2-96e1e40e7f32', name: 'Swedish Woman', language: 'sv', gender: 'female' },
  { id: '4f8651b0-bbbd-46ac-8b37-5168c5923303', name: 'Polish Man', language: 'pl', gender: 'male' },
];

export async function synthesizeSpeech(
  text: string,
  voiceId: string,
  options: { speed?: number } = {}
): Promise<string> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId,
      speed: options.speed || 1.0,
    }),
  });

  if (!response.ok) {
    throw new Error('Text-to-speech synthesis failed');
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

export class OrbitAITTS {
  private config: TTSConfig;
  private audioElement: HTMLAudioElement | null = null;
  private audioQueue: string[] = [];
  private isPlaying = false;

  constructor(config: TTSConfig = {}) {
    this.config = {
      voiceId: ORBIT_AI_VOICES[0].id,
      language: 'en',
      speed: 1.0,
      ...config,
    };
  }

  async speak(text: string): Promise<void> {
    try {
      const audioUrl = await synthesizeSpeech(
        text,
        this.config.voiceId!,
        { speed: this.config.speed }
      );
      
      this.config.onAudioReady?.(audioUrl);
      this.audioQueue.push(audioUrl);
      
      if (!this.isPlaying) {
        this.playNext();
      }
    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }

  private playNext(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioUrl = this.audioQueue.shift()!;
    
    if (!this.audioElement) {
      this.audioElement = new Audio();
    }

    this.audioElement.src = audioUrl;
    this.audioElement.onended = () => {
      URL.revokeObjectURL(audioUrl);
      this.playNext();
    };
    this.audioElement.onerror = () => {
      this.config.onError?.(new Error('Audio playback failed'));
      this.playNext();
    };
    
    this.audioElement.play().catch((error) => {
      this.config.onError?.(error);
      this.playNext();
    });
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.audioQueue.forEach((url) => URL.revokeObjectURL(url));
    this.audioQueue = [];
    this.isPlaying = false;
  }

  setVoice(voiceId: string): void {
    this.config.voiceId = voiceId;
  }

  setSpeed(speed: number): void {
    this.config.speed = Math.max(0.5, Math.min(2.0, speed));
  }

  get playing(): boolean {
    return this.isPlaying;
  }
}

export function getVoicesForLanguage(language: string): VoiceOption[] {
  return ORBIT_AI_VOICES.filter((v) => v.language === language);
}

export function createTTSService(config: TTSConfig): OrbitAITTS {
  return new OrbitAITTS(config);
}
