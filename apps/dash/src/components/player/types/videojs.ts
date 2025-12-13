// Custom Video.js type definitions for v8
// Since video.js v8 uses `any` for options, we define our own complete types

// Import and extend Player type from video.js
import type BasePlayer from 'video.js/dist/types/player';

export interface Player extends BasePlayer {
  hlsQualitySelector?: (options?: {
    displayCurrentQuality?: boolean;
    vjsIconClass?: string;
    placementIndex?: number;
  }) => void;

  qualityLevels?: () => {
    length: number;
    selectedIndex: number;
    [index: number]: {
      id: string;
      width: number;
      height: number;
      bitrate: number;
      enabled: boolean;
    };
  };
}

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
  qualitySelector?: boolean;
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
  html5?: {
    vhs?: {
      overrideNative?: boolean;
      enableLowInitialPlaylist?: boolean;
      smoothQualityChange?: boolean;
      useBandwidthFromLocalStorage?: boolean;
      bandwidth?: number;
      limitRenditionByPlayerDimensions?: boolean;
    };
    nativeVideoTracks?: boolean;
    nativeAudioTracks?: boolean;
    nativeTextTracks?: boolean;
    [key: string]: unknown;
  };

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
