'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Languages,
  Volume2,
  VolumeX,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  translatedText?: string;
  timestamp: Date;
  isFinal: boolean;
}

interface TranscriptionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participantName?: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ru', name: 'Russian' },
];

const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  isOpen,
  onClose,
  participantName = 'You',
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts come in
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const toggleTranscription = useCallback(() => {
    if (isTranscribing) {
      setIsTranscribing(false);
      // Stop transcription service
    } else {
      setIsTranscribing(true);
      // Start transcription service - demo mode with simulated transcripts
      const demoTexts = [
        "Welcome everyone to today's meeting.",
        "Let's start with a quick update on the project status.",
        "The development team has made great progress this week.",
        "We're on track to meet our deadline.",
        "Any questions so far?",
      ];
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < demoTexts.length) {
          const newTranscript: TranscriptLine = {
            id: `transcript-${Date.now()}-${index}`,
            speaker: participantName,
            text: demoTexts[index],
            timestamp: new Date(),
            isFinal: true,
          };
          setTranscripts((prev) => [...prev, newTranscript]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isTranscribing, participantName]);

  const translateTranscript = async (transcript: TranscriptLine) => {
    if (targetLanguage === 'en' || transcript.translatedText) return;

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcript.text,
          targetLanguage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTranscripts((prev) =>
          prev.map((t) =>
            t.id === transcript.id
              ? { ...t, translatedText: data.translatedText }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Auto-translate when language changes
  useEffect(() => {
    if (targetLanguage !== 'en') {
      transcripts.forEach((t) => {
        if (!t.translatedText) {
          translateTranscript(t);
        }
      });
    }
  }, [targetLanguage, transcripts]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex h-[500px] w-[400px] flex-col rounded-2xl border border-white/10 bg-orbit-dark/95 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orbit-brand">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              AI Transcription
            </h3>
            <p className="text-xs text-white/60">
              {isTranscribing ? 'Listening...' : 'Ready'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
        <Button
          onClick={toggleTranscription}
          size="sm"
          className={cn(
            'h-8 gap-1.5 rounded-full text-xs',
            isTranscribing
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-orbit-brand hover:bg-orbit-brand/90'
          )}
        >
          {isTranscribing ? (
            <>
              <MicOff className="h-3.5 w-3.5" />
              Stop
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" />
              Start
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-full border-white/20 bg-white/5 text-xs text-white hover:bg-white/10"
            >
              <Languages className="h-3.5 w-3.5" />
              {LANGUAGES.find((l) => l.code === targetLanguage)?.name}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-60 overflow-y-auto bg-orbit-dark text-white">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setTargetLanguage(lang.code)}
                className={cn(
                  'cursor-pointer',
                  targetLanguage === lang.code && 'bg-orbit-brand/20'
                )}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={() => setIsTTSEnabled(!isTTSEnabled)}
          size="sm"
          variant="outline"
          className={cn(
            'h-8 gap-1.5 rounded-full border-white/20 text-xs',
            isTTSEnabled
              ? 'bg-orange-500/20 text-orange-400'
              : 'bg-white/5 text-white hover:bg-white/10'
          )}
        >
          {isTTSEnabled ? (
            <Volume2 className="h-3.5 w-3.5" />
          ) : (
            <VolumeX className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Transcripts */}
      <div className="flex-1 overflow-y-auto p-4">
        {transcripts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Mic className="mb-3 h-12 w-12 text-white/20" />
            <p className="text-sm font-medium text-white/60">
              No transcripts yet
            </p>
            <p className="mt-1 text-xs text-white/40">
              Click Start to begin transcribing
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {transcripts.map((transcript) => (
              <div key={transcript.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-orbit-brand">
                    {transcript.speaker}
                  </span>
                  <span className="text-xs text-white/40">
                    {transcript.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p
                  className={cn(
                    'text-sm',
                    transcript.isFinal ? 'text-white' : 'text-white/60 italic'
                  )}
                >
                  {transcript.text}
                </p>
                {transcript.translatedText && targetLanguage !== 'en' && (
                  <p className="mt-1 text-sm text-purple-400">
                    ↳ {transcript.translatedText}
                  </p>
                )}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>
            {isTranslating && (
              <span className="text-purple-400">Translating...</span>
            )}
          </span>
          <span>{transcripts.length} messages</span>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPanel;
