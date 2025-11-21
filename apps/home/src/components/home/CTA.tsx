import { ChevronRight } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
  CTA_HEADING,
  CTA_HIGHLIGHTS,
  CTA_DESCRIPTION,
  CTA_PRIMARY_BUTTON,
  CTA_SECONDARY_BUTTON,
} from '../../constants/cta';
import type { HighlightColor } from '../../constants/types';
import Highlight from './Highlight';

interface WordSegment {
  text: string;
  color?: HighlightColor;
}

export default function CTA() {
  const words = CTA_HEADING.split(' ');
  const highlightMap = new Map(CTA_HIGHLIGHTS.map((h) => [h.wordIndex, h.color]));

  // Group consecutive words with the same highlight color
  const segments: WordSegment[] = [];
  let currentSegment: WordSegment | null = null;

  words.forEach((word, index) => {
    const color = highlightMap.get(index);

    if (!currentSegment) {
      currentSegment = { text: word, color };
    } else if (currentSegment.color === color) {
      // Same color or both undefined, merge into current segment
      currentSegment.text += ` ${word}`;
    } else {
      // Different color, push current segment and start new one
      segments.push(currentSegment);
      currentSegment = { text: word, color };
    }
  });

  // Push the last segment
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return (
    <section className="w-full py-16 md:py-24 px-6 md:px-12 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-4xl bg-card p-8 py-12 md:p-12 md:py-16">
          <div className="flex flex-col items-center gap-8 text-center">
            {/* Main heading */}
            <div className="flex flex-col gap-6">
              <h2 className="font-dm-sans font-medium text-4xl text-foreground tracking-tighter md:text-5xl lg:text-6xl leading-tight">
                {segments.map((segment, index) => (
                  <span key={index}>
                    {segment.color ? (
                      <Highlight color={segment.color}>{segment.text}</Highlight>
                    ) : (
                      segment.text
                    )}{' '}
                  </span>
                ))}
              </h2>
              <p className="text-center text-base text-muted-foreground md:text-lg">
                {CTA_DESCRIPTION}
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Button asChild className="w-full rounded-full px-7 py-6 md:w-fit" size="lg">
                <a className="flex items-center gap-2 font-medium" href={CTA_PRIMARY_BUTTON.href}>
                  {CTA_PRIMARY_BUTTON.text} <ChevronRight />
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
                  href={CTA_SECONDARY_BUTTON.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CTA_SECONDARY_BUTTON.text}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
