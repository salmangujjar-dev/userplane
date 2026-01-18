/**
 * Styled Video Player
 * Simple video player with play/pause and restart controls
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  /** Video source URL */
  src: string;
  /** Poster image URL (shown before video loads) */
  poster?: string;
  /** Auto-play on load */
  autoPlay?: boolean;
  /** Mute audio */
  muted?: boolean;
  /** Show play/pause controls overlay */
  showControls?: boolean;
  /** Video opacity (0-1) */
  opacity?: number;
  /** Callback when video fails to load */
  onError?: (error: Error) => void;
  /** Callback when video starts loading */
  onLoadStart?: () => void;
  /** Callback when video is ready to play */
  onCanPlay?: () => void;
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  muted = false,
  showControls = true,
  opacity = 1,
  onError,
  onLoadStart,
  onCanPlay,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasError, setHasError] = useState(false);

  const handleVideoError = useCallback(() => {
    setHasError(true);
    const error = new Error('Failed to load video');
    console.error('[VideoPlayer] Video load error:', error);
    onError?.(error);
  }, [onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => {
      setHasError(false);
      onLoadStart?.();
    };
    const handleCanPlay = () => onCanPlay?.();

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleVideoError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleVideoError);
    };
  }, [handleVideoError, onLoadStart, onCanPlay]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.play();
  };

  if (hasError) {
    return (
      <div className="aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-lg p-2">
        <div
          className="relative w-full h-full flex items-center justify-center bg-gray-100 rounded-lg"
          style={{ opacity }}
        >
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-gray-500">Failed to load video</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-lg p-2">
      <div
        className="relative w-full h-full bg-black rounded-lg overflow-hidden group"
        style={{ opacity }}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain bg-black"
          autoPlay={autoPlay}
          muted={muted}
          playsInline
          onClick={togglePlayPause}
          onContextMenu={(e) => e.preventDefault()}
        />

        {showControls && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <div className="absolute left-8 top-1/2 -translate-y-1/2">
              <button
                onClick={handleRestart}
                className="text-white hover:text-gray-300 transition-colors p-4 hover:bg-black/30 bg-black/50 rounded-full backdrop-blur-sm"
                aria-label="Restart"
                title="Restart"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                </svg>
              </button>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <button
                onClick={togglePlayPause}
                className="text-white hover:text-gray-300 transition-colors p-4 hover:bg-black/30 bg-black/50 rounded-full backdrop-blur-sm"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
