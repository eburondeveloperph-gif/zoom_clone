"use client";
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const EndCallButton = () => {
  const call = useCall();
  const router = useRouter();
  const { useLocalParticipant } = useCallStateHooks();

  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call?.state.createdBy &&
    localParticipant.userId === call?.state?.createdBy.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    await call.endCall();
    router.push(`/`);
  };

  return (
    <Button
      className="h-9 rounded-full bg-orbit-danger px-4 text-xs font-semibold text-white hover:bg-orbit-danger/90"
      onClick={endCall}
    >
      End for all
    </Button>
  );
};

export default EndCallButton;
