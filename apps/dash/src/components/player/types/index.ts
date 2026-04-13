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
  /** Source of the marker — set when the marker is actionable (clickable to focus a panel entry). */
  kind?: 'console' | 'network';
  /** Unix ms timestamp of the underlying log entry, used to correlate with the side-panel row. */
  entryTimestamp?: number;
}
