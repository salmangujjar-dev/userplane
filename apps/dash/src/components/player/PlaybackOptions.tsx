'use client';

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { MoreVertical, Download, Share2 } from 'lucide-react';
import type { Player } from './types';
import { QualitySelector } from './QualitySelector';
import { SpeedSelector } from './SpeedSelector';
import { VolumeControl } from './VolumeControl';

interface PlaybackOptionsProps {
  player: Player | null;
}

export function PlaybackOptions({ player }: PlaybackOptionsProps) {
  const [hasQualities, setHasQualities] = useState<boolean>(false);

  useEffect(() => {
    if (!player) return;

    const checkQualities = () => {
      const qualityLevels = player.qualityLevels?.();
      setHasQualities(!!qualityLevels && qualityLevels.length > 0);
    };

    player.on('loadedqualitydata', checkQualities);
    setTimeout(checkQualities, 500);

    return () => {
      player.off('loadedqualitydata', checkQualities);
    };
  }, [player]);

  const handleDownload = () => {
    if (!player) return;
    const src = player.currentSrc();
    if (src) {
      const link = document.createElement('a');
      link.href = src;
      link.download = 'video.mp4';
      link.click();
    }
  };

  const handleShare = async () => {
    if (!player) return;
    const src = player.currentSrc();
    if (src) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Share Video',
            url: window.location.href,
          });
        } catch {
          // Silently handle share cancellation or errors
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    }
  };

  if (!player || !hasQualities) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm p-2.5 text-foreground hover:bg-background/90 transition-colors border border-border/50 shadow-sm"
          aria-label="Player settings"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] rounded-xl p-1">
        <QualitySelector player={player} />
        <SpeedSelector player={player} />
        <VolumeControl player={player} />

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleDownload} className="rounded-lg cursor-pointer">
          <Download className="h-4 w-4 mr-2" />
          <span>Download video</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShare} className="rounded-lg cursor-pointer">
          <Share2 className="h-4 w-4 mr-2" />
          <span>Share video</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
