import { Button } from '@workspace/ui/components/button';
import { ChevronRight } from 'lucide-react';

import {
  HERO_DESCRIPTION,
  HERO_HEADING,
  HERO_HIGHLIGHTS,
  HERO_ICON,
  HERO_PRIMARY_BUTTON,
  HERO_SECONDARY_BUTTON,
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
          <h1 className="text-center font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:max-w-4xl md:text-6xl">
            {segments.map((segment, index) => {
              const firstWordIndex = words.slice(
                0,
                segments.slice(0, index).reduce((acc, s) => acc + s.text.split(' ').length, 0)
              ).length;
              const showIconBefore = firstWordIndex === HERO_ICON.beforeWordIndex;

              return (
                <span key={index}>
                  {showIconBefore ? (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <img
                        src={HERO_ICON.src}
                        alt={HERO_ICON.alt}
                        className="inline-block w-8 h-8 md:w-12 md:h-12"
                      />
                      {segment.color ? (
                        <Highlight color={segment.color}>{segment.text}</Highlight>
                      ) : (
                        segment.text
                      )}
                    </span>
                  ) : (
                    <>
                      {segment.color ? (
                        <Highlight color={segment.color}>{segment.text}</Highlight>
                      ) : (
                        segment.text
                      )}
                    </>
                  )}{' '}
                </span>
              );
            })}
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
                href={HERO_SECONDARY_BUTTON.href}
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
