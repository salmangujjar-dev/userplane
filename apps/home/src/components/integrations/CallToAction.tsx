import { Button } from '@userplane/ui/components/button';
import { ChevronRight } from 'lucide-react';

import type { ButtonConfig, IntegrationHeadline } from '@/types/integrations';

import GradientBlur from './GradientBlur';

interface CallToActionProps {
  headline: IntegrationHeadline;
  primaryCTA: ButtonConfig;
  secondaryCTA: ButtonConfig;
}

export default function CallToAction({ headline, primaryCTA, secondaryCTA }: CallToActionProps) {
  return (
    <section className="relative w-full overflow-hidden">
      <GradientBlur
        className="top-0 left-1/2 h-[300px] w-full max-w-[1400px] -translate-x-1/2 -translate-y-1/4 rounded-full sm:h-[400px] lg:h-[500px]"
        blur={120}
      />

      <div className="mx-auto max-w-7xl p-4 pt-32 pb-24 sm:pt-48 sm:pb-32 md:pt-64 md:pb-40">
        <div className="text-center">
          <h2 className="mb-8 font-dm-sans text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.02em] text-foreground">
            {headline.lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}{' '}
            <span className="italic">{headline.accent}</span>
          </h2>
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
