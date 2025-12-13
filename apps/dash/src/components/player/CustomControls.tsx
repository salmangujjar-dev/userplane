'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, Volume2Icon, VolumeXIcon, MaximizeIcon } from 'lucide-react';
import type { Player } from './types';
import type { VideoMarker } from './types';
import './CustomControls.css';

interface CustomControlsProps {
  player: Player | null;
  markers?: VideoMarker[];
  onFullscreen?: () => void;
  duration?: number;
  hasStarted?: boolean;
  showControls?: boolean;
}

interface QualityLevel {
  height: number;
  enabled: boolean;
}

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2];

const CustomControls: React.FC<CustomControlsProps> = ({
  player,
  markers = [],
  onFullscreen,
  duration: videoDuration = 0,
  hasStarted = false,
  showControls = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('Auto');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [activeMarker, setActiveMarker] = useState<VideoMarker | null>(null);

  const speedMenuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Format time helper for controls (mm:ss format)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format time for duration display (min s format)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins} min ${secs} s`;
  };

  // Update state from player
  useEffect(() => {
    if (!player) return;

    const updateTime = () => {
      setCurrentTime(player.currentTime() || 0);
      setDuration(player.duration() || 0);
    };

    const updatePlayState = () => {
      setIsPlaying(!player.paused());
    };

    player.on('timeupdate', updateTime);
    player.on('play', updatePlayState);
    player.on('pause', updatePlayState);
    player.on('loadedmetadata', updateTime);

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

    // Initial values
    setDuration(player.duration() || 0);
    setCurrentTime(player.currentTime() || 0);
    setIsPlaying(!player.paused());
    setVolume(player.volume() || 1);
    setIsMuted(player.muted() || false);
    setPlaybackSpeed(player.playbackRate() || 1);

    player.on('ratechange', updateSpeed);
    player.on('loadedqualitydata', updateQualities);
    player.on('qualitychange', updateQualities);

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

  // Play/Pause toggle
  const togglePlay = () => {
    if (!player) return;
    if (player.paused()) {
      player.play();
    } else {
      player.pause();
    }
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return;
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    player.volume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      player.muted(false);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (!player) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    player.muted(newMuted);
  };

  // Playback speed selection
  const handleSpeedSelect = (speed: number) => {
    if (!player) return;
    player.playbackRate(speed);
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const toggleSpeedMenu = () => {
    setShowSpeedMenu((prev) => !prev);
    setShowQualityMenu(false);
  };

  // Quality selection
  const handleQualitySelect = (height: number | 'auto') => {
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
    setShowQualityMenu(false);
  };

  const toggleQualityMenu = () => {
    setShowQualityMenu((prev) => !prev);
    setShowSpeedMenu(false);
  };

  // Progress bar interaction
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!player || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    player.currentTime(newTime);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    setHoverTime(time);
    setHoverPosition(e.clientX - rect.left);

    // Check if hovering over a marker
    const hoveredMarker = markers.find((marker) => {
      const markerPercent = marker.time / duration;
      const markerPosition = markerPercent * rect.width;
      return Math.abs(e.clientX - rect.left - markerPosition) < 8;
    });
    setActiveMarker(hoveredMarker || null);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    handleProgressClick(e);
  };

  const handleProgressMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && progressBarRef.current && player) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newTime = percent * duration;
        player.currentTime(newTime);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setShowQualityMenu(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [player, duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle big play button click
  const handleBigPlayClick = () => {
    if (!player) return;
    player.play();
  };

  return (
    <>
      {/* Custom Big Play Button with Overlay - shown before video starts */}
      {!hasStarted && (
        <>
          {/* Semi-transparent overlay backdrop */}
          <div
            className="custom-video-overlay"
            onClick={handleBigPlayClick}
            aria-label="Play video"
          />

          {/* Play button and duration */}
          <div className="custom-big-play-container">
            <button
              className="custom-big-play-button"
              onClick={handleBigPlayClick}
              aria-label="Play video"
              type="button"
            >
              <svg
                className="custom-big-play-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 5.14v14.72a1 1 0 0 0 1.5.87l11.14-7.36a1 1 0 0 0 0-1.73L9.5 4.27A1 1 0 0 0 8 5.14z" />
              </svg>
            </button>
            {videoDuration > 0 && (
              <div className="custom-big-play-duration">{formatDuration(videoDuration)}</div>
            )}
          </div>
        </>
      )}

      {/* Control Bar */}
      <div
        className="custom-video-controls"
        data-show-controls={showControls || !hasStarted}
        data-initial-state={!hasStarted}
      >
        {/* Progress Bar */}
        <div
          ref={progressBarRef}
          className="custom-progress-container"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
          onMouseUp={handleProgressMouseUp}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setHoverTime(null);
            setHoverPosition(null);
            setActiveMarker(null);
          }}
          onMouseMove={handleProgressMouseMove}
        >
          {/* Progress bar background */}
          <div className="custom-progress-bar">
            {/* Played progress */}
            <div className="custom-progress-played" style={{ width: `${progress}%` }} />

            {/* Hover tooltip */}
            {isHovering && hoverTime !== null && hoverPosition !== null && (
              <div className="custom-progress-tooltip" style={{ left: `${hoverPosition}px` }}>
                {activeMarker ? (
                  <>
                    <div
                      className="custom-progress-tooltip-marker"
                      style={{ color: activeMarker.color }}
                    >
                      {activeMarker.label}
                    </div>
                    <div className="custom-progress-tooltip-time">
                      {formatTime(activeMarker.time)}
                    </div>
                  </>
                ) : (
                  <div className="custom-progress-tooltip-time">{formatTime(hoverTime)}</div>
                )}
              </div>
            )}

            {/* Markers */}
            {markers.map((marker, index) => {
              const markerPosition = duration > 0 ? (marker.time / duration) * 100 : 0;
              return (
                <div
                  key={index}
                  className="custom-progress-marker"
                  style={{
                    left: `${markerPosition}%`,
                    backgroundColor: marker.color || '#fbbf24',
                  }}
                  title={marker.label}
                />
              );
            })}

            {/* Progress handle */}
            <div className="custom-progress-handle" style={{ left: `${progress}%` }} />
          </div>
        </div>

        {/* Control buttons */}
        <div className="custom-controls-bar">
          {/* Left side - Play and Time */}
          <div className="custom-controls-left">
            <button
              className="custom-control-button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              type="button"
            >
              {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>

            <div className="custom-time-display">
              <span className="custom-time-current">{formatTime(currentTime)}</span>
              <span className="custom-time-separator">/</span>
              <span className="custom-time-duration">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right side - Quality, Speed, Volume and Fullscreen */}
          <div className="custom-controls-right">
            {/* Quality selector */}
            {qualities.length > 0 && (
              <div className="custom-dropdown-container" ref={qualityMenuRef}>
                <button
                  className="custom-control-button custom-quality-button"
                  onClick={toggleQualityMenu}
                  aria-label={`Video quality: ${currentQuality}`}
                  type="button"
                  title={`Quality: ${currentQuality}`}
                >
                  <span className="custom-quality-label">{currentQuality}</span>
                </button>
                {showQualityMenu && (
                  <div className="custom-dropdown-menu">
                    <button
                      className={`custom-dropdown-item ${currentQuality === 'Auto' ? 'active' : ''}`}
                      onClick={() => handleQualitySelect('auto')}
                      type="button"
                    >
                      Auto
                      {currentQuality === 'Auto' && (
                        <span className="custom-dropdown-check">✓</span>
                      )}
                    </button>
                    {qualities.map((quality) => (
                      <button
                        key={quality.height}
                        className={`custom-dropdown-item ${
                          currentQuality === `${quality.height}p` ? 'active' : ''
                        }`}
                        onClick={() => handleQualitySelect(quality.height)}
                        type="button"
                      >
                        {quality.height}p
                        {currentQuality === `${quality.height}p` && (
                          <span className="custom-dropdown-check">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Playback speed */}
            <div className="custom-dropdown-container" ref={speedMenuRef}>
              <button
                className="custom-control-button custom-speed-button"
                onClick={toggleSpeedMenu}
                aria-label={`Playback speed: ${playbackSpeed}x`}
                type="button"
                title={`Speed: ${playbackSpeed}x`}
              >
                <span className="custom-speed-label">{playbackSpeed}x</span>
              </button>
              {showSpeedMenu && (
                <div className="custom-dropdown-menu">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      className={`custom-dropdown-item ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => handleSpeedSelect(speed)}
                      type="button"
                    >
                      {speed === 1 ? 'Normal' : `${speed}x`}
                      {playbackSpeed === speed && <span className="custom-dropdown-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume control */}
            <div className="custom-volume-control">
              <button
                className="custom-control-button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                type="button"
              >
                {isMuted || volume === 0 ? (
                  <VolumeXIcon className="w-5 h-5" />
                ) : (
                  <Volume2Icon className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="custom-volume-slider"
                aria-label="Volume"
              />
            </div>

            {/* Fullscreen button */}
            {onFullscreen && (
              <button
                className="custom-control-button"
                onClick={onFullscreen}
                aria-label="Fullscreen"
                type="button"
              >
                <MaximizeIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomControls;
