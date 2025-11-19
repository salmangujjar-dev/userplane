export type HighlightColor = 'blue' | 'yellow' | 'green' | 'purple';

export interface HighlightConfig {
  wordIndex: number;
  color: HighlightColor;
}
