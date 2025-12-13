'use client';

import React, { useState, useEffect } from 'react';
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
} from '@workspace/ui/components/dropdown-menu';
import type { Player } from './types';
import { CheckIcon, ZapIcon } from './icons';

interface SpeedSelectorProps {
  player: Player;
}

const SPEED_OPTIONS = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: 'Normal' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.75, label: '1.75x' },
  { value: 2, label: '2x' },
];

export function SpeedSelector({ player }: SpeedSelectorProps) {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  useEffect(() => {
    setPlaybackSpeed(player.playbackRate() || 1);

    const handleRateChange = () => {
      setPlaybackSpeed(player.playbackRate() || 1);
    };

    player.on('ratechange', handleRateChange);

    return () => {
      player.off('ratechange', handleRateChange);
    };
  }, [player]);

  const handleSpeedChange = (speed: number) => {
    player.playbackRate(speed);
    setPlaybackSpeed(speed);
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="rounded-lg">
        <ZapIcon />
        <span className="flex-1">Speed</span>
        <span className="text-xs text-muted-foreground">
          {playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="rounded-xl">
        {SPEED_OPTIONS.map((speed) => (
          <DropdownMenuItem
            key={speed.value}
            onClick={() => handleSpeedChange(speed.value)}
            className={`rounded-lg cursor-pointer ${
              playbackSpeed === speed.value ? 'bg-accent font-semibold' : ''
            }`}
          >
            <span className="flex-1">{speed.label}</span>
            {playbackSpeed === speed.value && <CheckIcon />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
