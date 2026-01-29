import CallList from '@/components/CallList';
import React from 'react';

const Previous = () => {
  return (
    <section className="flex size-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-orbit-muted">
          History
        </p>
        <h1 className="text-2xl font-semibold text-orbit-text">Previous meetings</h1>
      </div>
      <CallList type="ended" />
    </section>
  );
};

export default Previous;
