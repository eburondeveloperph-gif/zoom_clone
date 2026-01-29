// Success Class - STT Client
// WebSocket connection to OpenAI Realtime API for transcription
// Keeps placeholder keys for reference

import { getApiKey } from '@/config/placeholders';

export interface STTConfig {
  language?: string;
  onTranscript?: (text: string, isFinal: boolean, id: string) => void;
  onError?: (error: Error) => void;
  onVAD?: (isSpeaking: boolean) => void;
}

export class STTClient {
  private websocket: WebSocket | null = null;
  private config: STTConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private segmentId = 0;

  constructor(config: STTConfig = {}) {
    this.config = {
      language: 'en',
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    const apiKey = getApiKey('OPENAI_API_KEY');
    
    // Use local API route as proxy (keeps key server-side)
    // Or connect directly if key is available client-side (development)
    const wsUrl = `/api/stt/ws`;
    
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send initial config
          this.websocket?.send(JSON.stringify({
            type: 'config',
            language: this.config.language,
            apiKey: apiKey, // Will be validated server-side
          }));
          
          resolve();
        };
        
        this.websocket.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.websocket.onerror = (error) => {
          this.config.onError?.(new Error('STT WebSocket error'));
          reject(error);
        };
        
        this.websocket.onclose = () => {
          this.isConnected = false;
          this.attemptReconnect();
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'transcript':
          this.config.onTranscript?.(
            message.text,
            message.isFinal,
            message.id || `seg-${this.segmentId++}`
          );
          break;
          
        case 'vad':
          this.config.onVAD?.(message.isSpeaking);
          break;
          
        case 'error':
          this.config.onError?.(new Error(message.message));
          break;
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.config.onError?.(new Error('STT reconnection failed'));
      return;
    }
    
    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect().catch(() => {});
    }, 1000 * this.reconnectAttempts);
  }

  // Send audio data for transcription
  sendAudio(pcm16: Int16Array): void {
    if (!this.isConnected || !this.websocket) return;
    
    // Send as binary
    this.websocket.send(pcm16.buffer);
  }

  // Update language setting
  setLanguage(language: string): void {
    this.config.language = language;
    if (this.isConnected && this.websocket) {
      this.websocket.send(JSON.stringify({
        type: 'config',
        language,
      }));
    }
  }

  disconnect(): void {
    this.isConnected = false;
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let sttClientInstance: STTClient | null = null;

export function getSTTClient(config?: STTConfig): STTClient {
  if (!sttClientInstance) {
    sttClientInstance = new STTClient(config);
  }
  return sttClientInstance;
}

export function disposeSTTClient(): void {
  if (sttClientInstance) {
    sttClientInstance.disconnect();
    sttClientInstance = null;
  }
}
