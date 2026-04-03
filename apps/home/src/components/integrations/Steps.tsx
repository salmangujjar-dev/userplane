import type { StepData, StepsHeadline } from '@/constants/integrations';

import GlassCard from './GlassCard';

interface StepsProps {
  headline: StepsHeadline;
  steps: StepData[];
}

export default function Steps({ headline, steps }: StepsProps) {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="mx-auto max-w-7xl p-4">
        {/* Dynamic headline with superscript step numbers */}
        <h2 className="mb-14 max-w-3xl font-dm-sans text-[clamp(24px,4vw,36px)] font-medium leading-[1.2] tracking-[-0.02em] text-foreground">
          {headline.before}{' '}
          {headline.segments.map((segment, i) => (
            <span key={i}>
              <span className="italic">{segment.accent}</span>
              <sup className="ml-1 font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, '0')}
              </sup>{' '}
              {segment.after}{' '}
            </span>
          ))}
        </h2>

        {/* Step illustration cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <GlassCard
              key={`img-${step.number}`}
              className="h-[220px]"
              overlay={
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[40%] bg-gradient-to-t from-background to-transparent"
                  aria-hidden="true"
                />
              }
            >
              <img
                src={
                  step.image ??
                  `https://placehold.co/400x220/f8f8f8/cccccc?text=Step+${step.number}`
                }
                alt={`Step ${step.number}: ${step.title}`}
                className="h-full w-full object-cover"
              />
            </GlassCard>
          ))}
        </div>

        {/* Step descriptions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number}>
              <span className="font-mono text-xs text-muted-foreground">{step.number}</span>
              <h3 className="mt-1 mb-2 font-dm-sans text-[clamp(18px,2.5vw,20px)] font-medium leading-tight tracking-[-0.01em] text-foreground">
                {step.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
