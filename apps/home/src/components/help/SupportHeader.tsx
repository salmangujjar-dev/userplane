import { HELP_HEADING, HELP_HIGHLIGHTS } from '@/constants/help';

import Highlight from '../home/Highlight';

/**
 * Help page header with highlighted title.
 * Mirrors the BlogHeader pattern but uses the help-specific
 * heading constants and word-level highlights.
 */
export default function SupportHeader() {
  const words = HELP_HEADING.title.split(' ');
  const highlightMap = new Map(HELP_HIGHLIGHTS.map((h) => [h.wordIndex, h.color]));

  return (
    <div className="mb-12 flex flex-col items-center justify-center gap-6 text-center">
      <h1 className="font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:text-6xl">
        {words.map((word, index) => {
          const color = highlightMap.get(index);
          return (
            <span key={index}>{color ? <Highlight color={color}>{word}</Highlight> : word} </span>
          );
        })}
      </h1>
      <p className="md:text-lg max-w-2xl text-muted-foreground">{HELP_HEADING.subtitle}</p>
    </div>
  );
}
