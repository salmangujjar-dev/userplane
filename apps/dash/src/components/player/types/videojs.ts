// Custom Video.js type definitions for v8
// Since video.js v8 uses `any` for options, we define our own complete types

// Re-export Player type from video.js
export type { default as Player } from 'video.js/dist/types/player';

export interface VideoJsSource {
  src: string;
  type: string;
}

export interface TextTrackOptions {
  kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
}

export interface ControlBarOptions {
  children?: string[];
  playToggle?: boolean;
  volumePanel?: {
    inline?: boolean;
    vertical?: boolean;
  };
  currentTimeDisplay?: boolean;
  timeDivider?: boolean;
  durationDisplay?: boolean;
  progressControl?: boolean;
  liveDisplay?: boolean;
  seekToLive?: boolean;
  remainingTimeDisplay?: boolean;
  customControlSpacer?: boolean;
  playbackRateMenuButton?: boolean;
  chaptersButton?: boolean;
  descriptionsButton?: boolean;
  subsCapsButton?: boolean;
  audioTrackButton?: boolean;
  fullscreenToggle?: boolean;
  pictureInPictureToggle?: boolean;
}

export interface PlayerOptions {
  // Playback
  autoplay?: boolean | 'muted' | 'play' | 'any';
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: 'auto' | 'metadata' | 'none';

  // Sources
  sources?: VideoJsSource[];
  src?: string;
  poster?: string;

  // Dimensions
  width?: number;
  height?: number;
  fluid?: boolean;
  fill?: boolean;
  responsive?: boolean;
  aspectRatio?: string;

  // Control Bar
  controlBar?: ControlBarOptions | false;

  // Tracks
  tracks?: TextTrackOptions[];

  // UI
  bigPlayButton?: boolean;
  textTrackDisplay?: boolean;
  errorDisplay?: boolean;
  textTrackSettings?: boolean;

  // Language
  language?: string;
  languages?: Record<string, Record<string, string>>;

  // Behavior
  inactivityTimeout?: number;
  playsinline?: boolean;
  nativeControlsForTouch?: boolean;
  notSupportedMessage?: string;
  normalizeAutoplay?: boolean;

  // Tech
  techOrder?: string[];
  html5?: Record<string, unknown>;

  // Plugins
  plugins?: Record<string, unknown>;

  // Advanced
  liveui?: boolean;
  liveTracker?: {
    trackingThreshold?: number;
    liveTolerance?: number;
  };
  breakpoints?: Record<string, number>;
  playbackRates?: number[];
  userActions?: {
    click?: boolean | ((event: MouseEvent) => void);
    doubleClick?: boolean | ((event: MouseEvent) => void);
    hotkeys?: boolean | ((event: KeyboardEvent) => void);
  };

  // Other
  [key: string]: unknown; // Allow additional options
}
