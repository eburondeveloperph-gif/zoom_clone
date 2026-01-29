// Orbit AI Secces Class - Real-time Pipeline
// STT → Translation → TTS with ultra-low latency streaming

export interface PipelineConfig {
  sourceLanguage?: string;
  targetLanguage?: string;
  voiceId?: string;
  enableTTS?: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onTranslation?: (original: string, translated: string) => void;
  onAudioChunk?: (chunk: ArrayBuffer) => void;
  onError?: (error: Error) => void;
}

export class RealtimeAIPipeline {
  private config: PipelineConfig;
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private isRunning = false;
  private pendingTranslations: Map<string, AbortController> = new Map();

  constructor(config: PipelineConfig) {
    this.config = {
      sourceLanguage: 'en',
      targetLanguage: 'en',
      enableTTS: false,
      ...config,
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      
      // Connect to our backend WebSocket for processing
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/realtime`;
      
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        // Send configuration
        this.websocket?.send(JSON.stringify({
          type: 'config',
          sourceLanguage: this.config.sourceLanguage,
          targetLanguage: this.config.targetLanguage,
          voiceId: this.config.voiceId,
          enableTTS: this.config.enableTTS,
        }));
        
        this.startAudioCapture();
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.websocket.onerror = () => {
        this.config.onError?.(new Error('WebSocket connection failed'));
      };

      this.websocket.onclose = () => {
        this.stop();
      };

      this.isRunning = true;
    } catch (error) {
      this.config.onError?.(error as Error);
      this.stop();
    }
  }

  private startAudioCapture(): void {
    if (!this.audioContext || !this.mediaStream) return;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.floatTo16BitPCM(inputData);
        
        // Send audio as binary
        this.websocket.send(pcm16.buffer);
      }
    };

    source.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
  }

  private async handleMessage(data: string | ArrayBuffer): Promise<void> {
    if (data instanceof ArrayBuffer) {
      // Audio chunk from TTS
      this.config.onAudioChunk?.(data);
      return;
    }

    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'transcript':
          this.config.onTranscript?.(message.text, message.isFinal);
          
          // If final and translation needed, trigger translation
          if (message.isFinal && this.config.targetLanguage !== this.config.sourceLanguage) {
            this.translateText(message.text, message.id);
          }
          break;

        case 'translation':
          this.config.onTranslation?.(message.original, message.translated);
          break;

        case 'error':
          this.config.onError?.(new Error(message.message));
          break;
      }
    } catch (error) {
      // Not JSON, might be a text message
    }
  }

  private async translateText(text: string, id: string): Promise<void> {
    // Cancel any pending translation with same ID
    this.pendingTranslations.get(id)?.abort();
    
    const controller = new AbortController();
    this.pendingTranslations.set(id, controller);

    try {
      const response = await fetch('/api/translate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: this.config.targetLanguage,
          sourceLanguage: this.config.sourceLanguage,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('Translation failed');

      const reader = response.body?.getReader();
      if (!reader) return;

      let translatedText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        translatedText += decoder.decode(value, { stream: true });
        this.config.onTranslation?.(text, translatedText);
      }

      // Trigger TTS if enabled
      if (this.config.enableTTS && translatedText) {
        this.triggerTTS(translatedText);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.config.onError?.(error as Error);
      }
    } finally {
      this.pendingTranslations.delete(id);
    }
  }

  private async triggerTTS(text: string): Promise<void> {
    try {
      const response = await fetch('/api/tts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: this.config.voiceId,
        }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const reader = response.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        this.config.onAudioChunk?.(value.buffer);
      }
    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }

  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  stop(): void {
    this.isRunning = false;

    // Cancel all pending translations
    this.pendingTranslations.forEach((controller) => controller.abort());
    this.pendingTranslations.clear();

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  setTargetLanguage(language: string): void {
    this.config.targetLanguage = language;
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'config',
        targetLanguage: language,
      }));
    }
  }

  setTTSEnabled(enabled: boolean): void {
    this.config.enableTTS = enabled;
  }

  get running(): boolean {
    return this.isRunning;
  }
}

export function createAIPipeline(config: PipelineConfig): RealtimeAIPipeline {
  return new RealtimeAIPipeline(config);
}
