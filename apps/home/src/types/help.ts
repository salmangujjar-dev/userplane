import type { HighlightConfig } from './highlight';

export interface HelpTopic {
  title: string;
  subtitle: string;
  href: string;
  highlights: HighlightConfig[];
}
