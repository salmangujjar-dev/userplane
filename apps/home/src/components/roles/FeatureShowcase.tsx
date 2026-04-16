import { ChevronRight } from 'lucide-react';

import type { FeatureData } from '@/types/roles';

import FadeEdge from './FadeEdge';
import GlassCard from './GlassCard';
import GradientBlur from './GradientBlur';

interface FeatureShowcaseProps {
  features: FeatureData[];
}

export default function FeatureShowcase({ features }: FeatureShowcaseProps) {
  return (
    <div className="w-full">
      {features.map((feature) => (
        <section key={feature.number} className="overflow-x-clip py-12 sm:py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 p-4 md:grid-cols-2 md:gap-10">
            {/* Text */}
            <div className="flex items-center">
              <div className="max-w-[480px]">
                <span className="font-mono text-xs text-muted-foreground">{feature.number}</span>
                <h3 className="mt-3 mb-4 font-dm-sans text-[clamp(24px,4vw,36px)] font-medium leading-tight tracking-[-0.02em] text-foreground">
                  {feature.title}
                </h3>
                <p className="mb-6 text-base leading-relaxed text-muted-foreground sm:mb-8">
                  {feature.description}
                </p>

                <p className="mb-3 text-sm font-semibold text-foreground">{feature.tagline}</p>
                <hr className="mb-3 border-border/10" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {feature.capabilities.map((cap) => (
                    <span key={cap} className="text-sm text-muted-foreground">
                      {cap}
                    </span>
                  ))}
                </div>

                {feature.learnMoreHref && (
                  <a
                    href={feature.learnMoreHref}
                    className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    Learn more <ChevronRight className="size-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Image card — bleeds right past container */}
            <div className="group relative flex h-[320px] items-center justify-start sm:h-[420px] md:h-[640px]">
              <GradientBlur
                className="top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 rounded-[300px] h-[140%] w-[120%] opacity-30 transition-opacity duration-700 ease-out group-hover:opacity-45"
                blur={60}
              />
              <GlassCard
                className="h-full w-full shrink-0 md:min-w-[864px]"
                overlay={
                  <>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 sm:h-60 bg-linear-to-t from-background to-transparent" />
                    <FadeEdge direction="right" />
                  </>
                }
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  width={864}
                  height={540}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top-left"
                />
              </GlassCard>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
