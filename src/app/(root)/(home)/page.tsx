import MeetingTypeList from '@/components/MeetingTypeList';
import UpcomingMeetingCard from '@/components/UpcomingMeetingCard';
import React from 'react';
import { Mic, Languages, Volume2, Sparkles } from 'lucide-react';

const Home = () => {
  const now = new Date();
  const time = now.toLocaleTimeString('en-Us', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const date = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
  }).format(now);

  return (
    <section className="flex size-full flex-col gap-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orbit-brand via-blue-600 to-indigo-700 px-8 py-12 text-white shadow-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-semibold uppercase tracking-wider text-white/80">
                AI-Powered Meetings
              </span>
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Meet anyone,<br />
              <span className="text-yellow-300">anywhere.</span>
            </h1>
            <p className="max-w-xl text-lg text-white/80">
              Start secure video meetings with real-time AI transcription and instant translation in 50+ languages.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 rounded-2xl bg-white/10 px-6 py-5 backdrop-blur-sm">
            <span className="text-sm font-medium uppercase tracking-wide text-white/60">
              Local time
            </span>
            <span className="text-4xl font-bold tabular-nums">
              {time}
            </span>
            <span className="text-sm font-medium text-white/80">
              {date}
            </span>
          </div>
        </div>
      </div>

      {/* AI Features Highlight */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-orbit-brand/20 bg-gradient-to-br from-orbit-brand/5 to-orbit-brand/10 p-6 transition-all hover:border-orbit-brand/40 hover:shadow-lg">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orbit-brand/10 blur-2xl transition-all group-hover:bg-orbit-brand/20" />
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orbit-brand text-white">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-orbit-text">
              Live Transcription
            </h3>
            <p className="text-sm text-orbit-muted">
              Real-time speech-to-text powered by <span className="font-semibold text-orbit-brand">Orbit AI Secces Class</span>. See every word as it&apos;s spoken.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                Live
              </span>
              <span className="text-xs text-orbit-muted">99.5% accuracy</span>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10 p-6 transition-all hover:border-purple-500/40 hover:shadow-lg">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover:bg-purple-500/20" />
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white">
              <Languages className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-orbit-text">
              Instant Translation
            </h3>
            <p className="text-sm text-orbit-muted">
              Break language barriers with <span className="font-semibold text-purple-600">Orbit AI Secces Class</span> translation. 50+ languages supported.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['EN', 'ES', 'FR', 'DE', 'JP', 'KR', '+44'].map((lang) => (
                <span
                  key={lang}
                  className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10 p-6 transition-all hover:border-orange-500/40 hover:shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20" />
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Volume2 className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-orbit-text">
              Natural Voice Output
            </h3>
            <p className="text-sm text-orbit-muted">
              Crystal-clear text-to-speech using <span className="font-semibold text-orange-600">Orbit AI Secces Class</span>. Natural voices in any language.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex -space-x-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-orange-400 to-orange-600"
                  />
                ))}
              </div>
              <span className="text-xs text-orbit-muted">20+ voice styles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Actions */}
      <div className="rounded-2xl border border-orbit-border bg-orbit-panel p-6 shadow-sm">
        <MeetingTypeList />
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-orbit-border bg-orbit-panel p-6 shadow-sm lg:col-span-2">
          <UpcomingMeetingCard />
        </div>
        <div className="rounded-2xl border border-orbit-border bg-orbit-panel p-6 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orbit-muted">
            Security
          </p>
          <h3 className="mb-2 text-lg font-semibold text-orbit-text">
            End-to-end encrypted
          </h3>
          <p className="text-sm text-orbit-muted">
            Your meetings and AI transcriptions are protected with enterprise-grade encryption.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Home;
