'use client';
import { useGetCalls } from '@/hooks/useGetCalls';
import React from 'react';

const UpcomingMeetingCard = () => {
  const { upcomingCalls } = useGetCalls();
  let meetingTime: string | undefined;

  if (upcomingCalls.length > 0) {
    const {
      state: { startsAt },
    } = upcomingCalls[0];

    meetingTime = startsAt?.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold uppercase tracking-wide text-orbit-muted">
        Upcoming meeting
      </p>
      <h2 className="text-lg font-semibold text-orbit-text">
        {meetingTime || 'No upcoming meetings scheduled'}
      </h2>
      <p className="text-sm text-orbit-muted">
        Share your invite when you are ready to start.
      </p>
    </div>
  );
};

export default UpcomingMeetingCard;
