// Re-export Video.js types for convenience
export type {
  ControlBarOptions,
  Player,
  PlayerOptions,
  TextTrackOptions,
  VideoJsSource,
} from './videojs';

// Video marker types for timeline annotations
export interface VideoMarker {
  time: number;
  label: string;
  color?: string;
}
