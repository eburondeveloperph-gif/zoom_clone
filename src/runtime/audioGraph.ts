// Success Class - Audio Graph
// Single AudioContext with separate buses for mic input (STT) and TTS output
// Implements ducking to lower teacher video audio when TTS plays

export interface AudioGraphConfig {
  onAudioLevel?: (level: number) => void;
  onError?: (error: Error) => void;
}

class AudioGraph {
  private audioContext: AudioContext | null = null;
  private config: AudioGraphConfig;
  
  // Buses
  private micInBus: GainNode | null = null;
  private ttsOutBus: GainNode | null = null;
  private masterBus: GainNode | null = null;
  
  // Sources
  private micSource: MediaStreamAudioSourceNode | null = null;
  private ttsSource: AudioBufferSourceNode | null = null;
  
  // Analyzer for levels
  private micAnalyzer: AnalyserNode | null = null;
  
  // Ducking state
  private isDucking = false;
  private duckingGain = 0.3; // Lower to 30% when ducking
  
  // TTS queue for serialized playback
  private ttsQueue: ArrayBuffer[] = [];
  private isPlayingTTS = false;

  constructor(config: AudioGraphConfig = {}) {
    this.config = config;
  }

  async init(): Promise<void> {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      
      // Create buses
      this.micInBus = this.audioContext.createGain();
      this.ttsOutBus = this.audioContext.createGain();
      this.masterBus = this.audioContext.createGain();
      
      // Mic analyzer
      this.micAnalyzer = this.audioContext.createAnalyser();
      this.micAnalyzer.fftSize = 256;
      
      // Routing:
      // micInBus -> micAnalyzer (NOT to destination - STT only)
      // ttsOutBus -> masterBus -> destination
      this.micInBus.connect(this.micAnalyzer);
      this.ttsOutBus.connect(this.masterBus);
      this.masterBus.connect(this.audioContext.destination);
      
    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }

  // Connect microphone stream for STT (no playback)
  async connectMicrophone(stream: MediaStream): Promise<MediaStream> {
    if (!this.audioContext || !this.micInBus) {
      throw new Error('AudioGraph not initialized');
    }
    
    this.micSource = this.audioContext.createMediaStreamSource(stream);
    this.micSource.connect(this.micInBus);
    
    // Start level monitoring
    this.startLevelMonitoring();
    
    return stream;
  }

  private startLevelMonitoring(): void {
    if (!this.micAnalyzer) return;
    
    const dataArray = new Uint8Array(this.micAnalyzer.frequencyBinCount);
    
    const checkLevel = () => {
      if (!this.micAnalyzer) return;
      
      this.micAnalyzer.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalized = average / 255;
      
      this.config.onAudioLevel?.(normalized);
      
      if (this.audioContext?.state === 'running') {
        requestAnimationFrame(checkLevel);
      }
    };
    
    checkLevel();
  }

  // Enqueue TTS audio for serialized playback
  enqueueTTS(audioBuffer: ArrayBuffer): void {
    this.ttsQueue.push(audioBuffer);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isPlayingTTS || this.ttsQueue.length === 0) return;
    
    this.isPlayingTTS = true;
    const audioData = this.ttsQueue.shift()!;
    
    try {
      await this.playTTSBuffer(audioData);
    } catch (error) {
      this.config.onError?.(error as Error);
    }
    
    this.isPlayingTTS = false;
    this.processQueue();
  }

  private async playTTSBuffer(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext || !this.ttsOutBus) return;
    
    return new Promise(async (resolve, reject) => {
      try {
        // Decode audio data
        const audioBuffer = await this.audioContext!.decodeAudioData(audioData.slice(0));
        
        // Create source
        const source = this.audioContext!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.ttsOutBus!);
        
        // Apply ducking
        this.applyDucking(true);
        
        source.onended = () => {
          this.applyDucking(false);
          resolve();
        };
        
        source.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Duck master volume when TTS is playing
  private applyDucking(duck: boolean): void {
    if (!this.masterBus) return;
    
    const targetGain = duck ? this.duckingGain : 1.0;
    const now = this.audioContext?.currentTime || 0;
    
    this.masterBus.gain.setTargetAtTime(targetGain, now, 0.1);
    this.isDucking = duck;
  }

  // Get PCM data from mic for STT
  getMicProcessor(callback: (pcm16: Int16Array) => void): ScriptProcessorNode | null {
    if (!this.audioContext || !this.micInBus) return null;
    
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = this.floatTo16BitPCM(inputData);
      callback(pcm16);
    };
    
    this.micInBus.connect(processor);
    processor.connect(this.audioContext.destination); // Required but won't output audio
    
    return processor;
  }

  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  // Disconnect microphone
  disconnectMicrophone(): void {
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
  }

  // Clear TTS queue
  clearTTSQueue(): void {
    this.ttsQueue = [];
  }

  // Resume audio context (needed after user gesture)
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Dispose all resources
  dispose(): void {
    this.clearTTSQueue();
    this.disconnectMicrophone();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.micInBus = null;
    this.ttsOutBus = null;
    this.masterBus = null;
    this.micAnalyzer = null;
  }

  get context(): AudioContext | null {
    return this.audioContext;
  }
}

// Singleton instance
let audioGraphInstance: AudioGraph | null = null;

export function getAudioGraph(config?: AudioGraphConfig): AudioGraph {
  if (!audioGraphInstance) {
    audioGraphInstance = new AudioGraph(config);
  }
  return audioGraphInstance;
}

export function disposeAudioGraph(): void {
  if (audioGraphInstance) {
    audioGraphInstance.dispose();
    audioGraphInstance = null;
  }
}
