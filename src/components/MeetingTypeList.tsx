'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MeetingModel from './MeetingModel';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useToast } from './ui/use-toast';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { Input } from './ui/input';
import { Button } from './ui/button';

const MeetingTypeList = () => {
  const { toast } = useToast();

  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined
  >();
  const [values, setValues] = useState({
    dateTime: new Date(),
    description: '',
    link: '',
  });

  const [callDetails, setCallDetails] = useState<Call>();
  const { user } = useUser();
  const client = useStreamVideoClient();

  const createMeeting = async () => {
    if (!client || !user) return;

    try {
      if (!values.dateTime) {
        toast({
          title: 'Please select a date and time',
        });
        return;
      }
      const id = crypto.randomUUID();
      const call = client.call('default', id);
      if (!call) throw new Error('failed to create call');

      const startsAt =
        values.dateTime.toISOString() || new Date(Date.now()).toISOString();

      const description = values.description || 'Instant Meeting';

      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description,
          },
        },
      });

      setCallDetails(call);
      if (!values.description) {
        router.push(`/meeting/${call.id}`);
      }
      toast({
        title: 'Meeting Created',
      });
    } catch (error) {
      console.log(error);
      toast({
        title: 'Failed to creating meeting',
      });
    }
  };

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`;
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex h-full flex-col justify-between rounded-2xl border border-orbit-border bg-orbit-panel p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-orbit-muted">
            Start
          </p>
          <h2 className="text-xl font-semibold text-orbit-text">
            Start a new meeting
          </h2>
          <p className="text-sm text-orbit-muted">
            Launch a meeting instantly or schedule one for later.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => setMeetingState('isInstantMeeting')}
            className="bg-orbit-brand text-white hover:bg-orbit-brand/90"
          >
            New meeting
          </Button>
          <Button
            onClick={() => setMeetingState('isScheduleMeeting')}
            variant="outline"
            className="border-orbit-border text-orbit-text hover:bg-orbit-surface"
          >
            Schedule
          </Button>
        </div>
      </div>
      <div className="flex h-full flex-col justify-between rounded-2xl border border-orbit-border bg-orbit-panel p-6 shadow-sm lg:col-span-2">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-orbit-muted">
            Join
          </p>
          <h2 className="text-xl font-semibold text-orbit-text">
            Join a meeting
          </h2>
          <p className="text-sm text-orbit-muted">
            Enter a meeting link or room name to jump in.
          </p>
        </div>
        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Enter meeting link or room"
            className="h-11 border-orbit-border bg-orbit-panel text-orbit-text focus-visible:ring-0 focus-visible:ring-offset-0"
            onChange={(e) => setValues({ ...values, link: e.target.value })}
          />
          <Button
            onClick={() => router.push(`/meeting/${values.link}`)}
            className="h-11 bg-orbit-brand text-white hover:bg-orbit-brand/90"
          >
            Join
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-orbit-muted">
          <button
            className="flex items-center gap-2 font-medium text-orbit-text hover:text-orbit-brand"
            onClick={() => router.push('/recordings')}
          >
            View recordings
          </button>
          <button
            className="flex items-center gap-2 font-medium text-orbit-text hover:text-orbit-brand"
            onClick={() => setMeetingState('isJoiningMeeting')}
          >
            Join with invite link
          </button>
        </div>
      </div>

      {!callDetails ? (
        <MeetingModel
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Schedule a meeting"
          className="text-left"
          handleClick={createMeeting}
          buttonText="Schedule"
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-medium text-orbit-text">
              Meeting title
            </label>
            <Textarea
              className="border border-orbit-border bg-orbit-panel text-orbit-text focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) =>
                setValues((value) => ({
                  ...value,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-sm font-medium text-orbit-text">
              Select date and time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) =>
                setValues((value) => ({ ...value, dateTime: date! }))
              }
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat={'MMMM d, yyyy h:mm aa'}
              className="w-full rounded border border-orbit-border bg-orbit-panel p-2 text-orbit-text focus:outline-none"
            />
          </div>
        </MeetingModel>
      ) : (
        <MeetingModel
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Meeting scheduled"
          className="text-left"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Link Copied' });
          }}
          image="/icons/checked.svg"
          buttonIcon="/icons/copy.svg"
          buttonText="Copy meeting link"
        />
      )}
      {/* Model for instant meeting */}
      <MeetingModel
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Start an instant meeting"
        handleClick={createMeeting}
        buttonText="Start now"
      />
      <MeetingModel
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Join with invite link"
        handleClick={() => router.push(`/meeting/${values.link}`)}
        buttonText="Join"
      >
        <Input
          placeholder="Meeting link"
          className="border border-orbit-border bg-orbit-panel text-orbit-text focus-visible:ring-0 focus-visible:ring-offset-0"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
        />
      </MeetingModel>
    </section>
  );
};

export default MeetingTypeList;
