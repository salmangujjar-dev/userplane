import type { HelpTopic } from '@/constants/help';

import Highlight from '../home/Highlight';

interface TopicHeaderProps {
  topic: HelpTopic;
}

/**
 * Topic page header with word-level highlights.
 * Renders the topic title using the same highlight treatment
 * as the main help header and FAQ headings.
 */
export default function TopicHeader({ topic }: TopicHeaderProps) {
  const words = topic.title.split(' ');
  const highlightMap = new Map(topic.highlights.map((h) => [h.wordIndex, h.color]));

  return (
    <div className="mb-16 flex flex-col items-center justify-center gap-6 text-center">
      <h1 className="font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:text-6xl">
        {words.map((word, index) => {
          const color = highlightMap.get(index);
          return (
            <span key={index}>{color ? <Highlight color={color}>{word}</Highlight> : word} </span>
          );
        })}
      </h1>
      <p className="md:text-lg max-w-2xl text-muted-foreground">{topic.subtitle}</p>
    </div>
  );
}
