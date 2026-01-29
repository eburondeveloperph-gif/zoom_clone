// Success Class - Translation Client
// Primary: Cerebras, Fallback: Google Translate
// Supports streaming translation for low latency

import { getApiKey } from '@/config/placeholders';

export interface TranslateConfig {
  sourceLanguage?: string;
  targetLanguage: string;
  onTranslation?: (original: string, translated: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

export class TranslateClient {
  private config: TranslateConfig;
  private pendingRequests: Map<string, AbortController> = new Map();

  constructor(config: TranslateConfig) {
    this.config = {
      sourceLanguage: 'auto',
      ...config,
    };
  }

  // Translate text with streaming (Cerebras primary, fallback to Google)
  async translate(text: string, requestId: string): Promise<string> {
    // Cancel any pending request with same ID
    this.pendingRequests.get(requestId)?.abort();
    
    const controller = new AbortController();
    this.pendingRequests.set(requestId, controller);
    
    try {
      // Try streaming translation first (Cerebras)
      const translated = await this.translateStream(text, controller.signal);
      return translated;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw error;
      }
      
      // Fallback to non-streaming (Google)
      try {
        return await this.translateFallback(text, controller.signal);
      } catch (fallbackError) {
        this.config.onError?.(fallbackError as Error);
        throw fallbackError;
      }
    } finally {
      this.pendingRequests.delete(requestId);
    }
  }

  // Primary: Streaming translation via Cerebras
  private async translateStream(text: string, signal: AbortSignal): Promise<string> {
    const response = await fetch('/api/translate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLanguage: this.config.sourceLanguage,
        targetLanguage: this.config.targetLanguage,
        apiKey: getApiKey('CEREBRAS_API_KEY'),
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let translated = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      translated += decoder.decode(value, { stream: true });
      this.config.onTranslation?.(text, translated, false);
    }

    this.config.onTranslation?.(text, translated, true);
    return translated;
  }

  // Fallback: Google Translate API
  private async translateFallback(text: string, signal: AbortSignal): Promise<string> {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLanguage: this.config.sourceLanguage,
        targetLanguage: this.config.targetLanguage,
        apiKey: getApiKey('GOOGLE_TRANSLATE_API_KEY'),
        provider: 'google',
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Fallback translation failed: ${response.status}`);
    }

    const data = await response.json();
    const translated = data.translation || text;
    
    this.config.onTranslation?.(text, translated, true);
    return translated;
  }

  // Cancel all pending translations
  cancelAll(): void {
    this.pendingRequests.forEach((controller) => controller.abort());
    this.pendingRequests.clear();
  }

  // Update target language
  setTargetLanguage(language: string): void {
    this.config.targetLanguage = language;
  }

  setSourceLanguage(language: string): void {
    this.config.sourceLanguage = language;
  }
}

// Factory function
export function createTranslateClient(config: TranslateConfig): TranslateClient {
  return new TranslateClient(config);
}
