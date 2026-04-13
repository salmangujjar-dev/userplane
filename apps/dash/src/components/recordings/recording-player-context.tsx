'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import type { Player } from '@/components/player/types';

/**
 * A request to focus (scroll + highlight) a specific log entry in the side panel.
 * The `token` is a monotonic counter so the same entry can be re-focused on repeat
 * marker clicks — effects keyed on `token` will re-run.
 */
export interface FocusEntryRequest {
  kind: 'console' | 'network';
  entryTimestamp: number;
  token: number;
}

interface RecordingPlayerContextValue {
  seekTo: (seconds: number) => void;
  registerPlayer: (player: Player | null) => void;
  focusRequest: FocusEntryRequest | null;
  requestFocus: (req: Omit<FocusEntryRequest, 'token'>) => void;
}

const RecordingPlayerContext = createContext<RecordingPlayerContextValue | null>(null);

export function useRecordingPlayerSeek() {
  return useContext(RecordingPlayerContext);
}

export function RecordingPlayerProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<Player | null>(null);
  const tokenRef = useRef(0);
  const [focusRequest, setFocusRequest] = useState<FocusEntryRequest | null>(null);

  const registerPlayer = useCallback((player: Player | null) => {
    playerRef.current = player;
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(seconds);
    }
  }, []);

  const requestFocus = useCallback((req: Omit<FocusEntryRequest, 'token'>) => {
    tokenRef.current += 1;
    setFocusRequest({ ...req, token: tokenRef.current });
  }, []);

  const value = useMemo(
    () => ({ seekTo, registerPlayer, focusRequest, requestFocus }),
    [seekTo, registerPlayer, focusRequest, requestFocus]
  );

  return (
    <RecordingPlayerContext.Provider value={value}>{children}</RecordingPlayerContext.Provider>
  );
}
