'use client';

import React, { useState, useEffect } from 'react';
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Slider } from '@workspace/ui/components/slider';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import type { Player } from './types';

interface VolumeControlProps {
  player: Player;
}

export function VolumeControl({ player }: VolumeControlProps) {
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    setVolume(Math.round((player.volume() || 1) * 100));
    setIsMuted(player.muted() ?? false);

    const handleVolumeChange = () => {
      setVolume(Math.round((player.volume() || 0) * 100));
      setIsMuted(player.muted() ?? false);
    };

    player.on('volumechange', handleVolumeChange);

    return () => {
      player.off('volumechange', handleVolumeChange);
    };
  }, [player]);

  const handleVolumeChange = (newVolume: number[]) => {
    if (newVolume[0] === undefined) return;
    const volumeValue = newVolume[0] / 100;
    player.volume(volumeValue);
    setVolume(newVolume[0]);

    if (newVolume[0] === 0) {
      player.muted(true);
      setIsMuted(true);
    } else if (isMuted) {
      player.muted(false);
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    player.muted(newMutedState);
    setIsMuted(newMutedState);
  };

  const VolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-4 w-4 mr-2" />;
    }
    if (volume < 50) {
      return <Volume1 className="h-4 w-4 mr-2" />;
    }
    return <Volume2 className="h-4 w-4 mr-2" />;
  };

  const VolumeIconButton = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-4 w-4" />;
    }
    if (volume < 50) {
      return <Volume1 className="h-4 w-4" />;
    }
    return <Volume2 className="h-4 w-4" />;
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="rounded-lg">
        <VolumeIcon />
        <span className="flex-1">Volume</span>
        <span className="text-xs text-muted-foreground">{isMuted ? 0 : volume}%</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="rounded-xl w-[200px]">
        <div className="px-3 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="shrink-0 p-1 hover:bg-accent rounded-md transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIconButton />
            </button>
            <div className="flex-1">
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
              {isMuted ? 0 : volume}%
            </span>
          </div>
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
