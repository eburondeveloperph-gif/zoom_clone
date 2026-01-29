// Orbit AI Secces Class - Speech-to-Text Service
export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  timestamp: number;
  isFinal: boolean;
}

export interface TranscriptionConfig {
  language?: string;
  enableInterimResults?: boolean;
  onTranscript?: (result: TranscriptionResult) => void;
  onError?: (error: Error) => void;
}

export class RealtimeTranscription {
  private websocket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording = false;
  private config: TranscriptionConfig;

  constructor(config: TranscriptionConfig = {}) {
    this.config = {
      language: 'en',
      enableInterimResults: true,
      ...config,
    };
  }

  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      
      // Connect to Orbit AI Secces Class Realtime API
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('Orbit AI API key not configured');
      }

      this.websocket = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        ['realtime', `openai-insecure-api-key.${apiKey}`, 'openai-beta.realtime-v1']
      );

      this.websocket.onopen = () => {
        // Configure session for transcription
        this.websocket?.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a transcription assistant. Transcribe all audio accurately.',
            input_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        }));
      };

      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'conversation.item.input_audio_transcription.completed') {
          this.config.onTranscript?.({
            text: data.transcript,
            language: this.config.language || 'en',
            confidence: 0.95,
            timestamp: Date.now(),
            isFinal: true,
          });
        }
        
        if (data.type === 'input_audio_buffer.speech_started') {
          // Interim result - speech detected
          this.config.onTranscript?.({
            text: '...',
            language: this.config.language || 'en',
            confidence: 0.5,
            timestamp: Date.now(),
            isFinal: false,
          });
        }
      };

      this.websocket.onerror = (error) => {
        this.config.onError?.(new Error('WebSocket error'));
      };

      // Process audio stream
      const source = this.audioContext.createMediaStreamSource(stream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (this.websocket?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = this.floatTo16BitPCM(inputData);
          const base64Audio = this.arrayBufferToBase64(new Uint8Array(pcm16.buffer).buffer as ArrayBuffer);
          
          this.websocket.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio,
          }));
        }
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);
      
      this.isRecording = true;
    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }

  stop(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isRecording = false;
  }

  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  get recording(): boolean {
    return this.isRecording;
  }
}

export function createTranscriptionService(config: TranscriptionConfig): RealtimeTranscription {
  return new RealtimeTranscription(config);
}
