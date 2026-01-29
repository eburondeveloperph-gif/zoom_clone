'use client';
import { cn } from '@/lib/utils';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutList, Users, Mic, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import EndCallButton from './EndCallButton';
import Loader from './Loader';
import TranscriptionPanel from './TranscriptionPanel';

type CallLayoutType = 'grid' | 'list' | 'speaker-left' | 'speaker-right';
const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isPersonalRoom = !!searchParams.get('personal');

  const [layout, setLayout] = useState('speaker-left');
  const [showParticipants, setShowParticipant] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const callingStatus = useCallCallingState();
  const router = useRouter();
  if (callingStatus !== CallingState.JOINED) return <Loader />;

  const meetingUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL
  }${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
        break;

      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
        break;
      case 'speaker-left':
        return <SpeakerLayout participantsBarPosition="right" />;
        break;

      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };
  return (
    <div className="relative h-screen w-full overflow-hidden bg-orbit-darker text-white">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-orbit-dark/90 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Orbit</span>
          <span className="text-xs text-white/60">Meeting room</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowTranscription((prev) => !prev)}
            className={cn(
              'h-9 rounded-full px-4 text-xs font-semibold',
              showTranscription
                ? 'bg-orbit-brand text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
          >
            <Mic className="mr-1.5 h-3.5 w-3.5" />
            AI Transcribe
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(meetingUrl);
            }}
            className="h-9 rounded-full bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/20"
          >
            Copy invite
          </Button>
          <Button
            onClick={() => setShowParticipant((prev) => !prev)}
            className="h-9 rounded-full bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/20"
          >
            {showParticipants ? 'Hide' : 'Show'} participants
          </Button>
        </div>
      </div>
      <div className="relative flex size-full items-center justify-center pt-16">
        <div className="flex size-full max-w-[1100px] items-center pb-12">
          <CallLayout />
        </div>
        <div
          className={cn('h-[calc(100vh-120px)] hidden ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipant(false)} />
        </div>
      </div>

      {/* AI Transcription Panel */}
      <TranscriptionPanel
        isOpen={showTranscription}
        onClose={() => setShowTranscription(false)}
      />

      <div className="fixed bottom-0 left-0 flex w-full items-center justify-center gap-4 flex-wrap pb-6">
        <div className="flex items-center gap-3 rounded-full bg-orbit-dark/90 px-4 py-3 shadow-lg">
          <CallControls onLeave={() => router.push('/')} />
          <DropdownMenu>
            <div className="flex items-center">
              <DropdownMenuTrigger className="cursor-pointer rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">
                <LayoutList size={18} className="text-white" />
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent className="bg-orbit-dark text-white">
              {['Grid', 'Speaker-left', 'Speaker-right']?.map(
                (layout: string) => (
                  <div key={layout}>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        setLayout(layout.toLocaleLowerCase() as CallLayoutType)
                      }
                    >
                      {layout}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="border-white/10" />
                  </div>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <CallStatsButton />
          {!isPersonalRoom && <EndCallButton />}
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
