"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type AudioState = {
  currentId: string | null;
  play: (id: string, url: string) => void;
  stop: () => void;
};

const AudioContext = createContext<AudioState>({
  currentId: null,
  play: () => {},
  stop: () => {},
});

/**
 * Single-player audio pattern. One shared <audio> element is reused; tapping
 * play on any card stops whatever was previously playing. This matches how
 * podcast and music apps feel on mobile.
 */
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Lazy-create a single <audio> element on first use.
  const getEl = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = "none";
      el.addEventListener("ended", () => setCurrentId(null));
      audioRef.current = el;
    }
    return audioRef.current;
  }, []);

  const play = useCallback(
    (id: string, url: string) => {
      const el = getEl();
      if (currentId === id) {
        el.pause();
        setCurrentId(null);
        return;
      }
      el.pause();
      el.src = url;
      el.currentTime = 0;
      void el.play().then(
        () => setCurrentId(id),
        () => setCurrentId(null)
      );
    },
    [currentId, getEl]
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setCurrentId(null);
  }, []);

  // Stop audio on unmount (e.g. navigating between pages).
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <AudioContext.Provider value={{ currentId, play, stop }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioPlayer() {
  return useContext(AudioContext);
}
