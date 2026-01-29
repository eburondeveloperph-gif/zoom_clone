import CallList from '@/components/CallList';
import React from 'react';

const Recording = () => {
  return (
    <section className="flex size-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-orbit-muted">
          Recordings
        </p>
        <h1 className="text-2xl font-semibold text-orbit-text">Meeting recordings</h1>
      </div>
      <CallList type="recording" />
    </section>
  );
};

export default Recording;
