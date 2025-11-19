import { ChevronRight } from 'lucide-react';
import { AiFillExperiment } from 'react-icons/ai';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { CAL_URL } from '../../constants/contact';
import {
  HERO_HEADING,
  HERO_HIGHLIGHTS,
  HERO_DESCRIPTION,
  HERO_PRIMARY_BUTTON,
  HERO_SECONDARY_BUTTON,
  HERO_BADGE,
} from '../../constants/hero';
import type { HighlightColor } from '../../constants/types';
import Highlight from './Highlight';

interface WordSegment {
  text: string;
  color?: HighlightColor;
}

export default function Hero() {
  const words = HERO_HEADING.split(' ');
  const highlightMap = new Map(HERO_HIGHLIGHTS.map((h) => [h.wordIndex, h.color]));

  // Group consecutive words with the same highlight color
  const segments: WordSegment[] = [];
  let currentSegment: WordSegment | null = null;

  words.forEach((word, index) => {
    const color = highlightMap.get(index);

    if (!currentSegment) {
      currentSegment = { text: word, color };
    } else if (currentSegment.color === color) {
      currentSegment.text += ` ${word}`;
    } else {
      segments.push(currentSegment);
      currentSegment = { text: word, color };
    }
  });

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return (
    <section className="w-full pt-16 md:pt-24 pb-8 md:pb-12 px-6 md:px-12">
      <div className="mx-auto max-w-7xl flex flex-col gap-12">
        <div className="z-20 flex h-full grow flex-col items-center gap-12 text-center">
          <Badge className="rounded-full min-h-[48px] py-3" variant={'secondary'}>
            <a
              className="flex items-center justify-center gap-2"
              href={CAL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <AiFillExperiment className="h-4 w-4" />
              {HERO_BADGE.text}
            </a>
          </Badge>

          <h1 className="text-center font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:max-w-4xl md:text-6xl">
            {segments.map((segment, index) => (
              <span key={index}>
                {segment.color ? (
                  <Highlight color={segment.color}>{segment.text}</Highlight>
                ) : (
                  segment.text
                )}{' '}
              </span>
            ))}
          </h1>

          <p className="md:text-lg max-w-2xl">{HERO_DESCRIPTION}</p>

          <div className="flex w-fit flex-wrap items-center justify-center gap-3">
            <Button asChild className="w-full rounded-full px-7 py-6 md:w-fit" size="lg">
              <a className="flex items-center gap-2 font-medium" href={HERO_PRIMARY_BUTTON.href}>
                {HERO_PRIMARY_BUTTON.text} <ChevronRight />
              </a>
            </Button>

            <Button
              asChild
              className="w-full rounded-full px-7 py-6 md:w-fit"
              variant="secondary"
              size="lg"
            >
              <a
                className="flex items-center gap-2 font-medium"
                href={CAL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {HERO_SECONDARY_BUTTON.text}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
