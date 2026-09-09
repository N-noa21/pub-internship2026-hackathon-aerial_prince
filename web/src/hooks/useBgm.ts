"use client";

import { useEffect, useCallback, useState } from "react";
import { bgm } from "@/lib/bgm";

type Screen = "TITLE" | "WISH" | "AUDIENCE" | "BEHEAD" | "ADOPT" | "RETHINK" | "ENDING";

export function useBgm(screen: Screen) {
  const [muted, setMuted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // Unlock AudioContext on first user gesture
  const handleInteraction = useCallback(() => {
    if (!unlocked) {
      bgm.unlock();
      setUnlocked(true);
    }
  }, [unlocked]);

  useEffect(() => {
    document.addEventListener("click", handleInteraction, { once: false });
    document.addEventListener("keydown", handleInteraction, { once: false });
    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [handleInteraction]);

  // Switch track when screen changes
  useEffect(() => {
    if (unlocked) {
      bgm.play(screen);
    }
  }, [screen, unlocked]);

  const toggleMute = useCallback(() => {
    bgm.unlock();
    const nowMuted = bgm.toggleMute();
    setMuted(nowMuted);
  }, []);

  return { muted, toggleMute };
}
