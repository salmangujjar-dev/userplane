'use client';

import React, { useState, useEffect } from 'react';
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
} from '@workspace/ui/components/dropdown-menu';
import type { Player } from './types';
import { CheckIcon, MonitorIcon } from './icons';

interface QualityLevel {
  height: number;
  label: string;
  enabled: boolean;
  index: number;
}

interface QualitySelectorProps {
  player: Player;
}

export function QualitySelector({ player }: QualitySelectorProps) {
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('Auto');

  useEffect(() => {
    const updateQualities = () => {
      const qualityLevels = player.qualityLevels?.();
      if (!qualityLevels) return;

      const levels: QualityLevel[] = [];
      for (let i = 0; i < qualityLevels.length; i++) {
        const level = qualityLevels[i];
        if (level && level.height) {
          levels.push({
            height: level.height,
            label: `${level.height}p`,
            enabled: level.enabled,
            index: i,
          });
        }
      }

      levels.sort((a, b) => b.height - a.height);
      setQualities(levels);

      const enabledLevels = levels.filter((l) => l.enabled);
      if (enabledLevels.length === levels.length) {
        setCurrentQuality('Auto');
      } else if (enabledLevels.length === 1 && enabledLevels[0]) {
        setCurrentQuality(enabledLevels[0].label);
      }
    };

    player.on('loadedqualitydata', updateQualities);
    player.on('qualitychange', updateQualities);

    setTimeout(updateQualities, 500);

    return () => {
      player.off('loadedqualitydata', updateQualities);
      player.off('qualitychange', updateQualities);
    };
  }, [player]);

  const handleQualityChange = (height: number | 'auto') => {
    const qualityLevels = player.qualityLevels?.();
    if (!qualityLevels) return;

    if (height === 'auto') {
      for (let i = 0; i < qualityLevels.length; i++) {
        const level = qualityLevels[i];
        if (level) {
          level.enabled = true;
        }
      }
      setCurrentQuality('Auto');
    } else {
      for (let i = 0; i < qualityLevels.length; i++) {
        const level = qualityLevels[i];
        if (level) {
          level.enabled = false;
        }
      }

      for (let i = 0; i < qualityLevels.length; i++) {
        const level = qualityLevels[i];
        if (level && level.height === height) {
          level.enabled = true;
          setCurrentQuality(`${height}p`);
          break;
        }
      }
    }
  };

  if (qualities.length === 0) {
    return null;
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="rounded-lg">
        <MonitorIcon />
        <span className="flex-1">Quality</span>
        <span className="text-xs text-muted-foreground">{currentQuality}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="rounded-xl">
        <DropdownMenuItem
          onClick={() => handleQualityChange('auto')}
          className={`rounded-lg cursor-pointer ${
            currentQuality === 'Auto' ? 'bg-accent font-semibold' : ''
          }`}
        >
          <span className="flex-1">Auto</span>
          {currentQuality === 'Auto' && <CheckIcon />}
        </DropdownMenuItem>
        {qualities.map((quality) => (
          <DropdownMenuItem
            key={quality.height}
            onClick={() => handleQualityChange(quality.height)}
            className={`rounded-lg cursor-pointer ${
              currentQuality === quality.label ? 'bg-accent font-semibold' : ''
            }`}
          >
            <span className="flex-1">{quality.label}</span>
            {currentQuality === quality.label && <CheckIcon />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
