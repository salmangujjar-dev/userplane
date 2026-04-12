import { Button } from '@userplane/ui/components/button';
import { ChevronRight } from 'lucide-react';

import type { HighlightColor } from '@/types/highlight';
import type { ButtonConfig, IntegrationHeadline } from '@/types/integrations';

import Highlight from '../shared/Highlight';

interface CallToActionProps {
  headline: IntegrationHeadline;
  description?: string;
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
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

      // If this word has an icon, it needs its own node — flush current
      if (hasIcon && current) {
        nodes.push(current);
        current = null;
      }

      if (hasIcon) {
        // Create a standalone node with icon(s) embedded
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
      width={16}
      height={16}
      decoding="async"
      className="inline-block size-[0.75em] align-middle object-contain"
    />
  );
}

export default function CallToAction({
  headline,
  description,
  primaryCTA,
  secondaryCTA,
}: CallToActionProps) {
  const nodes = buildNodes(headline);

  return (
    <section className="relative w-full overflow-hidden">
      <div className="mx-auto max-w-7xl p-4 pt-32 pb-24 sm:pt-48 sm:pb-32 md:pt-64 md:pb-40">
        <div className="text-center">
          <div className="flex flex-col gap-6 mb-8">
            <h2 className="font-dm-sans text-[clamp(36px,5vw,56px)] font-medium leading-[1.15] tracking-[-0.02em] text-foreground">
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
            </h2>
            {description && (
              <p className="text-base text-muted-foreground md:text-lg">{description}</p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <Button asChild variant="secondary" size="lg">
              <a
                className="font-medium"
                href={secondaryCTA.href}
                target="_blank"
                rel="noopener noreferrer"
              >
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
    </section>
  );
}
