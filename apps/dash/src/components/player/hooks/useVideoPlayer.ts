'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Player } from '../types';

export interface QualityLevel {
  height: number;
  enabled: boolean;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  qualities: QualityLevel[];
  currentQuality: string;
}

export interface VideoPlayerActions {
  togglePlay: () => void;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
  handleSpeedSelect: (speed: number) => void;
  handleQualitySelect: (height: number | 'auto') => void;
  seek: (time: number) => void;
}

interface UseVideoPlayerOptions {
  videoDuration?: number;
}

/**
 * Hook to manage video player state and event listeners
 * Consolidates all player event management into a single hook
 */
export function useVideoPlayer(
  player: Player | null,
  options: UseVideoPlayerOptions = {}
): [VideoPlayerState, VideoPlayerActions] {
  const { videoDuration = 0 } = options;

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Audio state
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Speed state
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Quality state
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('Auto');

  // Subscribe to player events
  useEffect(() => {
    if (!player) return;

    const updateTime = () => {
      setCurrentTime(player.currentTime() || 0);
      setDuration(player.duration() || 0);
    };

    const updatePlayState = () => {
      setIsPlaying(!player.paused());
    };

    const updateSpeed = () => {
      setPlaybackSpeed(player.playbackRate() || 1);
    };

    const updateQualities = () => {
      const qualityLevels = player.qualityLevels?.();
      if (!qualityLevels) return;

      const levels: QualityLevel[] = [];
      for (let i = 0; i < qualityLevels.length; i++) {
        const level = qualityLevels[i];
        if (level && level.height) {
          levels.push({
            height: level.height,
            enabled: level.enabled,
          });
        }
      }

      levels.sort((a, b) => b.height - a.height);
      setQualities(levels);

      const enabledLevels = levels.filter((l) => l.enabled);
      if (enabledLevels.length === levels.length) {
        setCurrentQuality('Auto');
      } else if (enabledLevels.length === 1 && enabledLevels[0]) {
        setCurrentQuality(`${enabledLevels[0].height}p`);
      }
    };

    // Set initial values
    setDuration(player.duration() || 0);
    setCurrentTime(player.currentTime() || 0);
    setIsPlaying(!player.paused());
    setVolume(player.volume() || 1);
    setIsMuted(player.muted() || false);
    setPlaybackSpeed(player.playbackRate() || 1);

    // Subscribe to events
    player.on('timeupdate', updateTime);
    player.on('play', updatePlayState);
    player.on('pause', updatePlayState);
    player.on('loadedmetadata', updateTime);
    player.on('ratechange', updateSpeed);
    player.on('loadedqualitydata', updateQualities);
    player.on('qualitychange', updateQualities);

    // Delayed quality update for initial load
    setTimeout(updateQualities, 500);

    return () => {
      player.off('timeupdate', updateTime);
      player.off('play', updatePlayState);
      player.off('pause', updatePlayState);
      player.off('loadedmetadata', updateTime);
      player.off('ratechange', updateSpeed);
      player.off('loadedqualitydata', updateQualities);
      player.off('qualitychange', updateQualities);
    };
  }, [player]);

  // Actions
  const togglePlay = useCallback(() => {
    if (!player) return;
    if (player.paused()) {
      player.play();
    } else {
      player.pause();
    }
  }, [player]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      if (!player) return;
      setVolume(newVolume);
      player.volume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        player.muted(false);
      }
    },
    [player, isMuted]
  );

  const toggleMute = useCallback(() => {
    if (!player) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    player.muted(newMuted);
  }, [player, isMuted]);

  const handleSpeedSelect = useCallback(
    (speed: number) => {
      if (!player) return;
      player.playbackRate(speed);
      setPlaybackSpeed(speed);
    },
    [player]
  );

  const handleQualitySelect = useCallback(
    (height: number | 'auto') => {
      if (!player) return;
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
            level.enabled = level.height === height;
          }
        }
        setCurrentQuality(`${height}p`);
      }
    },
    [player]
  );

  const seek = useCallback(
    (time: number) => {
      if (!player) return;
      player.currentTime(time);
    },
    [player]
  );

  // Use prop-provided duration if available; fall back to player's reported duration
  const effectiveDuration = videoDuration > 0 ? videoDuration : duration;

  const state: VideoPlayerState = {
    isPlaying,
    currentTime,
    duration: effectiveDuration,
    volume,
    isMuted,
    playbackSpeed,
    qualities,
    currentQuality,
  };

  const actions: VideoPlayerActions = {
    togglePlay,
    handleVolumeChange,
    toggleMute,
    handleSpeedSelect,
    handleQualitySelect,
    seek,
  };

  return [state, actions];
}
