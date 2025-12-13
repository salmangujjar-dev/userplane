// Re-export Video.js types for convenience
export type {
  Player,
  PlayerOptions,
  VideoJsSource,
  TextTrackOptions,
  ControlBarOptions,
} from './videojs';

// Video marker types for timeline annotations
export interface VideoMarker {
  time: number;
  label: string;
  color?: string;
}
