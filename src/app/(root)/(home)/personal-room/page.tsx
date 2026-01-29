'use client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import useGetCallById from '@/hooks/useGetCallById';
import { useUser } from '@clerk/nextjs';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';
import React from 'react';

const Table = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col gap-1 border-b border-orbit-border pb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-orbit-muted">
        {title}
      </p>
      <p className="truncate text-sm font-medium text-orbit-text max-sm:max-w-[320px] lg:text-base">
        {description}
      </p>
    </div>
  );
};

const PersonalRoom = () => {
  const { user } = useUser();
  const meetingId = user?.id;
  const { toast } = useToast();
  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}?personal=true`;
  const client = useStreamVideoClient();
  const { call } = useGetCallById(meetingId!);
  const router = useRouter();

  const startRoom = async () => {
    if (!client || !user) return;
    try {
      if (!call) {
        const newCall = client.call('default', meetingId!);
        await newCall?.getOrCreate({
          data: {
            starts_at: new Date().toISOString(),
          },
        });
      }
      router.push(`/meeting/${meetingId}?personal=true`);
    } catch (error) {
      console.log('Error while start meeting:', error);
      toast({
        title: 'Failed to start meeting',
      });
    }
  };
  return (
    <section className="flex size-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-orbit-muted">
          Your space
        </p>
        <h1 className="text-2xl font-semibold text-orbit-text">
          Personal meeting room
        </h1>
        <p className="text-sm text-orbit-muted">
          Use this permanent link for quick instant meetings.
        </p>
      </div>

      <div className="rounded-2xl border border-orbit-border bg-orbit-panel p-6 shadow-sm">
        <div className="flex w-full flex-col gap-4 xl:max-w-[900px]">
          <Table
            title="Room topic"
            description={`${user?.username || user?.firstName}'s meeting room`}
          />
          <Table title="Meeting ID" description={meetingId!} />
          <Table title="Invite link" description={inviteLink!} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="bg-orbit-brand text-white hover:bg-orbit-brand/90"
            onClick={startRoom}
          >
            Start meeting
          </Button>
          <Button
            variant="outline"
            className="border-orbit-border text-orbit-text hover:bg-orbit-surface"
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              toast({
                title: 'Link Copied',
              });
            }}
          >
            Copy invitation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PersonalRoom;
