import { Button } from '@userplane/ui/components/button';
import { ChevronRight } from 'lucide-react';

import type { HighlightColor } from '@/types/highlight';
import type { ButtonConfig, IntegrationHeadline } from '@/types/integrations';

import Highlight from '../shared/Highlight';
import GlassCard from './GlassCard';
import GradientBlur from './GradientBlur';

interface HeroProps {
  headline: IntegrationHeadline;
  description: string[];
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
  preview?: { src: string; alt: string };
}

interface IconData {
  src: string;
  alt: string;
}

type HeadlineNode =
  | { kind: 'text'; text: string; beforeIcon?: IconData; afterIcon?: IconData }
  | {
      kind: 'highlight';
      text: string;
      color: HighlightColor;
      beforeIcon?: IconData;
      afterIcon?: IconData;
    }
  | { kind: 'br' };

function buildNodes(headline: IntegrationHeadline): HeadlineNode[] {
  const highlightMap = new Map((headline.highlights ?? []).map((h) => [h.wordIndex, h.color]));
  const beforeIconMap = new Map(
    (headline.icons ?? [])
      .filter((ic) => (ic.position ?? 'before') === 'before')
      .map((ic) => [ic.wordIndex, ic])
  );
  const afterIconMap = new Map(
    (headline.icons ?? []).filter((ic) => ic.position === 'after').map((ic) => [ic.wordIndex, ic])
  );
  const nodes: HeadlineNode[] = [];
  let wordIndex = 0;

  headline.lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) nodes.push({ kind: 'br' });

    const words = line.split(' ');
    let current: HeadlineNode | null = null;

    words.forEach((word) => {
      const beforeIcon = beforeIconMap.get(wordIndex);
      const afterIcon = afterIconMap.get(wordIndex);
      const color = highlightMap.get(wordIndex);
      const hasIcon = beforeIcon || afterIcon;

      if (hasIcon && current) {
        nodes.push(current);
        current = null;
      }

      if (hasIcon) {
        const node: HeadlineNode = color
          ? { kind: 'highlight', text: word, color }
          : { kind: 'text', text: word };
        if (beforeIcon) node.beforeIcon = { src: beforeIcon.src, alt: beforeIcon.alt };
        if (afterIcon) node.afterIcon = { src: afterIcon.src, alt: afterIcon.alt };
        nodes.push(node);
      } else if (!current) {
        current = color ? { kind: 'highlight', text: word, color } : { kind: 'text', text: word };
      } else if (current.kind === 'highlight' && color && current.color === color) {
        current.text += ` ${word}`;
      } else if (current.kind === 'text' && !color) {
        current.text += ` ${word}`;
      } else {
        nodes.push(current);
        current = color ? { kind: 'highlight', text: word, color } : { kind: 'text', text: word };
      }

      wordIndex++;
    });
    if (current) nodes.push(current);
  });

  return nodes;
}

function InlineIcon({ icon }: { icon: IconData }) {
  return (
    <img
      src={icon.src}
      alt={icon.alt}
      className="inline-block size-[0.75em] align-middle object-contain"
    />
  );
}

export default function Hero({
  headline,
  description,
  primaryCTA,
  secondaryCTA,
  preview,
}: HeroProps) {
  const nodes = buildNodes(headline);

  return (
    <section className="w-full overflow-x-clip">
      <div className="mx-auto max-w-7xl p-4">
        {/* Headline row — top-aligned, 2 columns on desktop */}
        <div className="relative flex flex-col items-start justify-between gap-6 pt-8 pb-10 sm:pt-12 sm:pb-12 lg:flex-row lg:items-start lg:gap-0 lg:pt-28 lg:pb-14">
          <div className="flex flex-col">
            <h1 className="-mt-2 font-dm-sans text-[clamp(36px,5vw,56px)] font-medium leading-[1.15] tracking-[-0.02em] text-foreground">
              {nodes.map((node, i) => {
                if (node.kind === 'br') return <br key={i} />;

                const content = (
                  <>
                    {node.beforeIcon && (
                      <>
                        <InlineIcon icon={node.beforeIcon} />{' '}
                      </>
                    )}
                    {node.text}
                    {node.afterIcon && (
                      <>
                        {' '}
                        <InlineIcon icon={node.afterIcon} />
                      </>
                    )}
                  </>
                );

                if (node.kind === 'highlight')
                  return (
                    <span key={i}>
                      <Highlight color={node.color}>{content}</Highlight>{' '}
                    </span>
                  );
                return <span key={i}>{content} </span>;
              })}
            </h1>
          </div>

          <div className="flex flex-col items-start gap-4 sm:gap-6 lg:items-end">
            <p className="text-[15px] leading-[1.6] text-muted-foreground lg:text-right">
              {description.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <Button asChild variant="secondary" size="lg">
                <a className="font-medium" href={secondaryCTA.href}>
                  {secondaryCTA.text}
                </a>
              </Button>
              <Button asChild size="lg">
                <a className="flex items-center gap-2 font-medium" href={primaryCTA.href}>
                  {primaryCTA.text} <ChevronRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Preview area with frosted glass */}
        {preview && (
          <div className="relative flex shrink-0 mb-8 lg:mb-16">
            <GradientBlur
              className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[300px] h-[500px] w-[600px] sm:h-[700px] sm:w-[1000px] lg:h-[856px] lg:w-[1496px]"
              blur={50}
            />

            <GlassCard className="h-[360px] w-full min-w-0 sm:h-[480px] md:h-[640px] md:min-w-[1440px] lg:h-[800px]">
              <img
                src={preview.src}
                alt={preview.alt}
                className="h-full w-full object-cover object-top"
              />
            </GlassCard>
          </div>
        )}
      </div>
    </section>
  );
}
