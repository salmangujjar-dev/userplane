import React from 'react';

import CCPAIcon from '@/components/icons/CCPAIcon';
import GDPRIcon from '@/components/icons/GDPRIcon';
import type { ComplianceBadge } from '@/constants/integrations';

interface ComplianceBannerProps {
  label: string;
  headline: { bold: string; muted: string };
  badges: ComplianceBadge[];
}

const icons = {
  gdpr: GDPRIcon,
  ccpa: CCPAIcon,
} as const;

export default function ComplianceBanner({ label, headline, badges }: ComplianceBannerProps) {
  return (
    <section className="pt-4 pb-12 sm:pt-6 sm:pb-16 md:pt-8 md:pb-24">
      <div className="mx-auto max-w-7xl p-4">
        <div className="rounded-2xl bg-secondary/50 px-8 py-10 sm:px-12 sm:py-14">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1px_1fr_1px_1fr]">
            {/* Left — label + headline */}
            <div>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
              <h3 className="mt-3 font-dm-sans text-[clamp(24px,3vw,32px)] font-medium leading-tight tracking-[-0.02em]">
                <span className="text-foreground">{headline.bold}</span>
                <br />
                <span className="text-muted-foreground">{headline.muted}</span>
              </h3>
            </div>

            {badges.map((badge) => {
              const Icon = icons[badge.icon];
              return (
                <React.Fragment key={badge.title}>
                  <div
                    className="hidden h-full min-h-[120px] bg-border/20 lg:block"
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-background">
                      <Icon className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-foreground">{badge.title}</h4>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
