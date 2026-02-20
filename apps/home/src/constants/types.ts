export type HighlightColor = 'blue' | 'yellow' | 'green' | 'purple' | 'red';

export interface HighlightConfig {
  wordIndex: number;
  color: HighlightColor;
}
