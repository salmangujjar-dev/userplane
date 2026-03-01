'use client';

import { createContext, useCallback, useContext, useRef } from 'react';

import type { Player } from '@/components/player/types';

interface RecordingPlayerContextValue {
  seekTo: (seconds: number) => void;
  registerPlayer: (player: Player | null) => void;
}

const RecordingPlayerContext = createContext<RecordingPlayerContextValue | null>(null);

export function useRecordingPlayerSeek() {
  return useContext(RecordingPlayerContext);
}

export function RecordingPlayerProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<Player | null>(null);

  const registerPlayer = useCallback((player: Player | null) => {
    playerRef.current = player;
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(seconds);
    }
  }, []);

  return (
    <RecordingPlayerContext.Provider value={{ seekTo, registerPlayer }}>
      {children}
    </RecordingPlayerContext.Provider>
  );
}
