// Success Class - Stream Runtime (Singleton)
// ALL streaming lifecycles live here: init/start/stop/dispose
// Prevents double initialization on React re-renders

import { getAudioGraph, disposeAudioGraph } from './audioGraph';
import { getSTTClient, disposeSTTClient, STTClient } from './sttClient';
import { createTranslateClient, TranslateClient } from './translateClient';
import { createTTSClient, TTSClient } from './ttsClient';
import { getSessionState } from '@/state/session.store';

export interface ThreadMessage {
  id: string;
  speaker: string;
  speakerRole: 'teacher' | 'student';
  srcText: string;
  translatedText: string;
  ttsStatus: 'pending' | 'playing' | 'done' | 'skipped';
  timestamp: number;
}

export interface StreamRuntimeConfig {
  sourceLanguage: string;
  targetLanguage: string;
  enableTTS: boolean;
  voiceId?: string;
  onThread?: (messages: ThreadMessage[]) => void;
  onAudioLevel?: (level: number) => void;
  onSpeaking?: (isSpeaking: boolean) => void;
  onError?: (error: Error) => void;
}

class StreamRuntime {
  private config: StreamRuntimeConfig;
  private isInitialized = false;
  private isRunning = false;
  
  // Clients
  private sttClient: STTClient | null = null;
  private translateClient: TranslateClient | null = null;
  private ttsClient: TTSClient | null = null;
  
  // Media
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  
  // Thread messages
  private messages: ThreadMessage[] = [];
  private pendingSentences: Map<string, ThreadMessage> = new Map();

  constructor(config: StreamRuntimeConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('[StreamRuntime] Already initialized, skipping');
      return;
    }
    
    console.log('[StreamRuntime] Initializing...');
    
    // Initialize audio graph
    const audioGraph = getAudioGraph({
      onAudioLevel: this.config.onAudioLevel,
      onError: this.config.onError,
    });
    await audioGraph.init();
    
    // Initialize STT client
    this.sttClient = getSTTClient({
      language: this.config.sourceLanguage,
      onTranscript: (text, isFinal, id) => this.handleTranscript(text, isFinal, id),
      onVAD: this.config.onSpeaking,
      onError: this.config.onError,
    });
    
    // Initialize translation client
    this.translateClient = createTranslateClient({
      sourceLanguage: this.config.sourceLanguage,
      targetLanguage: this.config.targetLanguage,
      onTranslation: (original, translated, isFinal) => {
        this.handleTranslation(original, translated, isFinal);
      },
      onError: this.config.onError,
    });
    
    // Initialize TTS client
    this.ttsClient = createTTSClient({
      voiceId: this.config.voiceId || 'alloy',
      onAudioChunk: (chunk) => {
        if (this.config.enableTTS) {
          getAudioGraph().enqueueTTS(chunk);
        }
      },
      onError: this.config.onError,
    });
    
    this.isInitialized = true;
    console.log('[StreamRuntime] Initialized successfully');
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
    
    if (this.isRunning) {
      console.log('[StreamRuntime] Already running');
      return;
    }
    
    console.log('[StreamRuntime] Starting capture...');
    
    const session = getSessionState();
    
    // Only capture mic if teacher OR student with permission
    if (session.role === 'teacher' || session.canSpeak) {
      await this.startMicCapture();
    }
    
    this.isRunning = true;
  }

  private async startMicCapture(): Promise<void> {
    const session = getSessionState();
    const audioGraph = getAudioGraph();
    
    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: session.preferredMicId || undefined,
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      
      // Connect to audio graph
      await audioGraph.connectMicrophone(this.mediaStream);
      
      // Connect STT
      await this.sttClient?.connect();
      
      // Get processor for sending audio to STT
      this.processor = audioGraph.getMicProcessor((pcm16) => {
        this.sttClient?.sendAudio(pcm16);
      });
      
      // Resume audio context
      await audioGraph.resume();
      
    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }

  private handleTranscript(text: string, isFinal: boolean, id: string): void {
    const session = getSessionState();
    
    if (isFinal) {
      // Create message
      const message: ThreadMessage = {
        id,
        speaker: session.name || (session.role === 'teacher' ? 'Teacher' : 'Student'),
        speakerRole: session.role || 'student',
        srcText: text,
        translatedText: '',
        ttsStatus: 'pending',
        timestamp: Date.now(),
      };
      
      this.messages.push(message);
      this.pendingSentences.set(id, message);
      this.config.onThread?.([...this.messages]);
      
      // Trigger translation if needed
      if (this.config.targetLanguage !== this.config.sourceLanguage) {
        this.translateClient?.translate(text, id);
      } else {
        // Same language, trigger TTS directly
        message.translatedText = text;
        if (this.config.enableTTS) {
          this.triggerTTS(message);
        }
      }
    }
  }

  private handleTranslation(original: string, translated: string, isFinal: boolean): void {
    // Find the message with this original text
    const message = Array.from(this.pendingSentences.values()).find(
      (m) => m.srcText === original
    );
    
    if (message) {
      message.translatedText = translated;
      this.config.onThread?.([...this.messages]);
      
      // Trigger TTS when translation is final
      if (isFinal && this.config.enableTTS) {
        this.triggerTTS(message);
      }
    }
  }

  private async triggerTTS(message: ThreadMessage): Promise<void> {
    if (!this.ttsClient || message.ttsStatus !== 'pending') return;
    
    message.ttsStatus = 'playing';
    this.config.onThread?.([...this.messages]);
    
    try {
      await this.ttsClient.synthesize(
        message.translatedText || message.srcText,
        message.id
      );
      message.ttsStatus = 'done';
    } catch {
      message.ttsStatus = 'skipped';
    }
    
    this.pendingSentences.delete(message.id);
    this.config.onThread?.([...this.messages]);
  }

  stop(): void {
    console.log('[StreamRuntime] Stopping...');
    this.isRunning = false;
    
    // Stop mic capture
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    
    // Disconnect audio graph mic
    getAudioGraph().disconnectMicrophone();
    
    // Disconnect STT
    this.sttClient?.disconnect();
    
    // Cancel pending translations/TTS
    this.translateClient?.cancelAll();
    this.ttsClient?.cancelAll();
  }

  dispose(): void {
    console.log('[StreamRuntime] Disposing...');
    this.stop();
    
    // Clear messages
    this.messages = [];
    this.pendingSentences.clear();
    
    // Dispose clients
    disposeSTTClient();
    disposeAudioGraph();
    
    this.sttClient = null;
    this.translateClient = null;
    this.ttsClient = null;
    
    this.isInitialized = false;
  }

  // Configuration updates
  setTargetLanguage(language: string): void {
    this.config.targetLanguage = language;
    this.translateClient?.setTargetLanguage(language);
  }

  setSourceLanguage(language: string): void {
    this.config.sourceLanguage = language;
    this.sttClient?.setLanguage(language);
    this.translateClient?.setSourceLanguage(language);
  }

  setTTSEnabled(enabled: boolean): void {
    this.config.enableTTS = enabled;
    if (!enabled) {
      getAudioGraph().clearTTSQueue();
    }
  }

  setVoice(voiceId: string): void {
    this.config.voiceId = voiceId;
    this.ttsClient?.setVoice(voiceId);
  }

  // For students: enable/disable mic based on permission
  async updateMicPermission(canSpeak: boolean): Promise<void> {
    if (canSpeak && !this.mediaStream) {
      await this.startMicCapture();
    } else if (!canSpeak && this.mediaStream) {
      // Stop mic capture
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
      getAudioGraph().disconnectMicrophone();
    }
  }

  get running(): boolean {
    return this.isRunning;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  getMessages(): ThreadMessage[] {
    return [...this.messages];
  }
}

// Singleton instance
let runtimeInstance: StreamRuntime | null = null;
let initRef = false; // Guard against double init in StrictMode

export function getStreamRuntime(config?: StreamRuntimeConfig): StreamRuntime {
  if (!runtimeInstance && config) {
    runtimeInstance = new StreamRuntime(config);
  }
  return runtimeInstance!;
}

export function initStreamRuntime(config: StreamRuntimeConfig): StreamRuntime {
  if (initRef) {
    console.log('[StreamRuntime] Init already called, returning existing instance');
    return runtimeInstance!;
  }
  
  initRef = true;
  
  if (runtimeInstance) {
    runtimeInstance.dispose();
  }
  
  runtimeInstance = new StreamRuntime(config);
  return runtimeInstance;
}

export function disposeStreamRuntime(): void {
  if (runtimeInstance) {
    runtimeInstance.dispose();
    runtimeInstance = null;
  }
  initRef = false;
}
