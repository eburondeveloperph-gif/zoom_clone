// Success Class - TTS Client
// Primary: Cartesia, Fallback: Deepgram
// Supports streaming audio for low latency playback

import { getApiKey } from '@/config/placeholders';

export interface TTSConfig {
  voiceId?: string;
  speed?: number;
  onAudioChunk?: (chunk: ArrayBuffer) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class TTSClient {
  private config: TTSConfig;
  private pendingRequests: Map<string, AbortController> = new Map();

  constructor(config: TTSConfig = {}) {
    this.config = {
      voiceId: 'alloy',
      speed: 1.0,
      ...config,
    };
  }

  // Synthesize speech with streaming
  async synthesize(text: string, requestId: string): Promise<ArrayBuffer | null> {
    // Cancel any pending request with same ID
    this.pendingRequests.get(requestId)?.abort();
    
    const controller = new AbortController();
    this.pendingRequests.set(requestId, controller);
    
    try {
      // Try Cartesia first
      return await this.synthesizeStream(text, controller.signal);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw error;
      }
      
      // Fallback to Deepgram
      try {
        return await this.synthesizeFallback(text, controller.signal);
      } catch (fallbackError) {
        this.config.onError?.(fallbackError as Error);
        throw fallbackError;
      }
    } finally {
      this.pendingRequests.delete(requestId);
    }
  }

  // Primary: Streaming TTS via Cartesia
  private async synthesizeStream(text: string, signal: AbortSignal): Promise<ArrayBuffer> {
    const response = await fetch('/api/tts/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceId: this.config.voiceId,
        speed: this.config.speed,
        apiKey: getApiKey('CARTESIA_API_KEY'),
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      
      // Stream chunks for low-latency playback
      this.config.onAudioChunk?.(value.buffer);
    }

    // Combine all chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    this.config.onComplete?.();
    return combined.buffer;
  }

  // Fallback: Deepgram TTS
  private async synthesizeFallback(text: string, signal: AbortSignal): Promise<ArrayBuffer> {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceId: this.config.voiceId,
        apiKey: getApiKey('DEEPGRAM_API_KEY'),
        provider: 'deepgram',
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Fallback TTS failed: ${response.status}`);
    }

    const audioData = await response.arrayBuffer();
    this.config.onAudioChunk?.(audioData);
    this.config.onComplete?.();
    
    return audioData;
  }

  // Cancel all pending requests
  cancelAll(): void {
    this.pendingRequests.forEach((controller) => controller.abort());
    this.pendingRequests.clear();
  }

  // Update voice
  setVoice(voiceId: string): void {
    this.config.voiceId = voiceId;
  }

  setSpeed(speed: number): void {
    this.config.speed = Math.max(0.5, Math.min(2.0, speed));
  }
}

// Factory function
export function createTTSClient(config?: TTSConfig): TTSClient {
  return new TTSClient(config);
}
