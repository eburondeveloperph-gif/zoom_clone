"use client";
import {
  DeviceSettings,
  VideoPreview,
  useCall,
} from "@stream-io/video-react-sdk";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";

const MeetingSetup = ({
  setIsSetupCompleted,
}: {
  setIsSetupCompleted: (params: boolean) => void;
}) => {
  const [isMicCamToggleOn, setisMicCamToggleOn] = useState(false);
  const call = useCall();

  if (!call) throw new Error("useCall must be used within stream call");

  useEffect(() => {
    if (isMicCamToggleOn) {
      call?.camera.disable();
      call?.microphone.disable();
    } else {
      call?.camera.enable();
      call?.microphone.enable();
    }
  }, [isMicCamToggleOn, call?.camera, call?.microphone]);
  return (
    <div className="min-h-screen w-full bg-orbit-darker text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <div className="rounded-2xl bg-orbit-dark p-4 shadow-xl">
            <VideoPreview />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="h-4 w-4 accent-orbit-brand"
                checked={isMicCamToggleOn}
                onChange={(e) => setisMicCamToggleOn(e.target.checked)}
              />
              Join with camera and mic off
            </label>
            <DeviceSettings />
          </div>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-orbit-dark p-6 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Ready to join
          </p>
          <h1 className="text-2xl font-semibold">Orbit meeting</h1>
          <p className="text-sm text-white/70">
            Check your audio and video settings before you join.
          </p>
          <Button
            className="mt-2 h-11 rounded-full bg-orbit-brand px-6 text-white"
            onClick={() => {
              call.join();
              setIsSetupCompleted(true);
            }}
          >
            Join meeting
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MeetingSetup;
