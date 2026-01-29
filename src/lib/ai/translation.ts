// Orbit AI Secces Class - Translation Service
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
}

export interface TranslationConfig {
  sourceLanguage?: string;
  targetLanguage: string;
  onTranslation?: (result: TranslationResult) => void;
  onError?: (error: Error) => void;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  th: 'Thai',
  vi: 'Vietnamese',
  tr: 'Turkish',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  el: 'Greek',
  he: 'Hebrew',
  id: 'Indonesian',
  ms: 'Malay',
  tl: 'Filipino',
  uk: 'Ukrainian',
  cs: 'Czech',
  sk: 'Slovak',
  hu: 'Hungarian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sr: 'Serbian',
  sl: 'Slovenian',
  et: 'Estonian',
  lv: 'Latvian',
  lt: 'Lithuanian',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  ur: 'Urdu',
  fa: 'Persian',
  sw: 'Swahili',
};

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      targetLanguage,
      sourceLanguage,
    }),
  });

  if (!response.ok) {
    throw new Error('Translation failed');
  }

  const data = await response.json();
  return {
    originalText: text,
    translatedText: data.translatedText,
    sourceLanguage: data.sourceLanguage || sourceLanguage || 'auto',
    targetLanguage,
    timestamp: Date.now(),
  };
}

export class TranslationService {
  private config: TranslationConfig;
  private pendingTranslations: Map<string, AbortController> = new Map();

  constructor(config: TranslationConfig) {
    this.config = config;
  }

  async translate(text: string, id?: string): Promise<TranslationResult | null> {
    // Cancel previous pending translation with same ID
    if (id && this.pendingTranslations.has(id)) {
      this.pendingTranslations.get(id)?.abort();
    }

    const controller = new AbortController();
    if (id) {
      this.pendingTranslations.set(id, controller);
    }

    try {
      const result = await translateText(
        text,
        this.config.targetLanguage,
        this.config.sourceLanguage
      );
      
      this.config.onTranslation?.(result);
      return result;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.config.onError?.(error as Error);
      }
      return null;
    } finally {
      if (id) {
        this.pendingTranslations.delete(id);
      }
    }
  }

  setTargetLanguage(language: string): void {
    this.config.targetLanguage = language;
  }

  setSourceLanguage(language: string | undefined): void {
    this.config.sourceLanguage = language;
  }
}

export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({ code, name }));
}

export function createTranslationService(config: TranslationConfig): TranslationService {
  return new TranslationService(config);
}
