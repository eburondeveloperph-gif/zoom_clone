import CallList from '@/components/CallList';
import React from 'react';

const Upcoming = () => {
  return (
    <section className="flex size-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-orbit-muted">
          Scheduled
        </p>
        <h1 className="text-2xl font-semibold text-orbit-text">Upcoming meetings</h1>
      </div>
      <CallList type="upcoming" />
    </section>
  );
};

export default Upcoming;
