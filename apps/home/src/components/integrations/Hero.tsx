import { Button } from '@userplane/ui/components/button';
import { ChevronRight } from 'lucide-react';

import type { ButtonConfig, IntegrationHeadline } from '@/types/integrations';

import FadeEdge from './FadeEdge';
import GlassCard from './GlassCard';
import GradientBlur from './GradientBlur';

interface HeroProps {
  headline: IntegrationHeadline;
  description: string;
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
  preview?: { src: string; alt: string };
}

export default function Hero({
  headline,
  description,
  primaryCTA,
  secondaryCTA,
  preview,
}: HeroProps) {
  return (
    <section className="w-full overflow-x-clip">
      <div className="mx-auto max-w-7xl p-4">
        {/* Headline row — bottom-aligned, 2 columns on desktop */}
        <div className="relative flex flex-col items-start justify-between gap-6 pt-8 pb-10 sm:pt-12 sm:pb-12 lg:flex-row lg:items-end lg:gap-0 lg:pt-28 lg:pb-14">
          <div>
            <h1 className="font-dm-sans text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
              {headline.lines.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}{' '}
              <span className="italic">{headline.accent}</span>
            </h1>
          </div>

          <div className="flex flex-col items-start gap-4 sm:gap-6 lg:items-end">
            <p className="max-w-[448px] text-[15px] leading-[1.6] text-muted-foreground lg:text-right">
              {description}
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

            <GlassCard
              className="h-[360px] w-full min-w-0 sm:h-[480px] md:h-[640px] md:min-w-[1440px] lg:h-[800px]"
              overlay={
                <>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 sm:h-60 lg:h-80 bg-linear-to-t from-background to-transparent" />
                  <FadeEdge direction="right" />
                </>
              }
            >
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
