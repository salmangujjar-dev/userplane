import { BASE_PRICING_PLANS, formatPlanRate, type PlanFeature } from '@workspace/pricing';
import { Button } from '@workspace/ui/components/button';
import { ChevronRight } from 'lucide-react';

import { SIGNUP_URL } from '@/constants/onboarding';
import { PRICING_HEADING, PRICING_HIGHLIGHTS } from '@/constants/v3/pricing';

import Highlight from '../Highlight';

function PricingFeatureItem({ text, included, subFeatures }: PlanFeature) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex items-center justify-center pt-1">
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={included ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{text}</h3>
      </div>
      <div>
        {subFeatures && subFeatures.length > 0 && (
          <ul className="space-y-2">
            {subFeatures.map((subFeature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-base text-gray-600">{subFeature.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PricingV3() {
  // Get the Scale Up plan (annual) - popular plan for home page
  const featuredPlan = BASE_PRICING_PLANS.find((plan) => plan.id === 'scale_up_annual');

  if (!featuredPlan) {
    return null;
  }

  const displayRate = formatPlanRate(featuredPlan);

  const words = PRICING_HEADING.title.split(' ');
  const highlightMap = new Map(PRICING_HIGHLIGHTS.map((h) => [h.wordIndex, h.color]));

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 scroll-mt-20" id="pricing">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="flex flex-col gap-8">
          <p className="text-center text-base text-muted-foreground md:text-lg">
            {PRICING_HEADING.label}
          </p>
          <h2 className="font-dm-sans font-medium text-4xl text-foreground tracking-tighter md:text-5xl lg:text-6xl leading-tight">
            {words.map((word, index) => {
              const color = highlightMap.get(index);
              return (
                <span key={index}>
                  {color ? <Highlight color={color}>{word}</Highlight> : word}{' '}
                </span>
              );
            })}
          </h2>
          <p className="md:text-lg max-w-2xl mx-auto">{PRICING_HEADING.subtitle}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Pricing Card */}
        <div className="relative bg-black rounded-3xl p-8 md:p-12 mb-8 overflow-hidden min-h-[480px] flex flex-col justify-end">
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 602 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-60 blur-[0.3px]"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient
                  id="hexGradient"
                  x1="600"
                  y1="0"
                  x2="0"
                  y2="400"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.35" />
                  <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g strokeWidth={0.5}>
                {[0, 68, 136, 204, 272, 340, 408, 476, 544].map((x) =>
                  [0, 152].map((y) => (
                    <path
                      key={`${x}-${y}`}
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d={`M${17.91 + x} ${69.59 + y}C${14.16 + x} ${69.59 + y} ${10.62 + x} ${67.85 + y} ${8.35 + x} ${64.86 + y}L${-11.53 + x} ${38.81 + y}C${-14.82 + x} ${34.5 + y} ${-14.82 + x} ${28.53 + y} ${-11.53 + x} ${24.22 + y}L${8.35 + x} ${-1.83 + y}C${10.62 + x} ${-4.81 + y} ${14.16 + x} ${-6.56 + y} ${17.91 + x} ${-6.56 + y}H${46.09 + x}C${49.84 + x} ${-6.56 + y} ${53.38 + x} ${-4.81 + y} ${55.65 + x} ${-1.83 + y}L${75.53 + x} ${24.22 + y}C${78.82 + x} ${28.53 + y} ${78.82 + x} ${34.5 + y} ${75.53 + x} ${38.81 + y}L${55.65 + x} ${64.86 + y}C${53.38 + x} ${67.85 + y} ${49.84 + x} ${69.59 + y} ${46.09 + x} ${69.59 + y}H${17.91 + x}ZM${31.85 + x} ${58.77 + y}C${32.49 + x} ${58.82 + y} ${33.16 + x} ${58.56 + y} ${33.6 + x} ${57.99 + y}L${51.11 + x} ${33.94 + y}C${52.2 + x} ${32.51 + y} ${52.2 + x} ${30.52 + y} ${51.11 + x} ${29.08 + y}L${33.6 + x} ${5.04 + y}C${33.3 + x} ${4.64 + y} ${32.88 + x} ${4.4 + y} ${32.45 + x} ${4.3 + y}C${32.23 + x} ${4.25 + y} ${32 + x} ${4.24 + y} ${31.78 + x} ${4.26 + y}C${31.26 + x} ${4.32 + y} ${30.76 + x} ${4.58 + y} ${30.41 + x} ${5.04 + y}L${12.9 + x} ${29.08 + y}C${11.8 + x} ${30.52 + y} ${11.8 + x} ${32.51 + y} ${12.9 + x} ${33.94 + y}L${30.41 + x} ${57.99 + y}C${30.76 + x} ${58.45 + y} ${31.26 + x} ${58.71 + y} ${31.78 + x} ${58.77 + y}Z`}
                      stroke="url(#hexGradient)"
                    />
                  ))
                )}
                {[34, 102, 170, 238, 306, 374, 442, 510].map((x) =>
                  [76, 228].map((y) => (
                    <path
                      key={`offset-${x}-${y}`}
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d={`M${17.91 + x} ${69.59 + y}C${14.16 + x} ${69.59 + y} ${10.62 + x} ${67.85 + y} ${8.35 + x} ${64.86 + y}L${-11.53 + x} ${38.81 + y}C${-14.82 + x} ${34.5 + y} ${-14.82 + x} ${28.53 + y} ${-11.53 + x} ${24.22 + y}L${8.35 + x} ${-1.83 + y}C${10.62 + x} ${-4.81 + y} ${14.16 + x} ${-6.56 + y} ${17.91 + x} ${-6.56 + y}H${46.09 + x}C${49.84 + x} ${-6.56 + y} ${53.38 + x} ${-4.81 + y} ${55.65 + x} ${-1.83 + y}L${75.53 + x} ${24.22 + y}C${78.82 + x} ${28.53 + y} ${78.82 + x} ${34.5 + y} ${75.53 + x} ${38.81 + y}L${55.65 + x} ${64.86 + y}C${53.38 + x} ${67.85 + y} ${49.84 + x} ${69.59 + y} ${46.09 + x} ${69.59 + y}H${17.91 + x}ZM${31.85 + x} ${58.77 + y}C${32.49 + x} ${58.82 + y} ${33.16 + x} ${58.56 + y} ${33.6 + x} ${57.99 + y}L${51.11 + x} ${33.94 + y}C${52.2 + x} ${32.51 + y} ${52.2 + x} ${30.52 + y} ${51.11 + x} ${29.08 + y}L${33.6 + x} ${5.04 + y}C${33.3 + x} ${4.64 + y} ${32.88 + x} ${4.4 + y} ${32.45 + x} ${4.3 + y}C${32.23 + x} ${4.25 + y} ${32 + x} ${4.24 + y} ${31.78 + x} ${4.26 + y}C${31.26 + x} ${4.32 + y} ${30.76 + x} ${4.58 + y} ${30.41 + x} ${5.04 + y}L${12.9 + x} ${29.08 + y}C${11.8 + x} ${30.52 + y} ${11.8 + x} ${32.51 + y} ${12.9 + x} ${33.94 + y}L${30.41 + x} ${57.99 + y}C${30.76 + x} ${58.45 + y} ${31.26 + x} ${58.71 + y} ${31.78 + x} ${58.77 + y}Z`}
                      stroke="url(#hexGradient)"
                    />
                  ))
                )}
              </g>
            </svg>
            {/* Directional light glow from top-right */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse 120% 100% at 90% 10%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
                  radial-gradient(ellipse 80% 60% at 75% 25%, rgba(255, 255, 255, 0.05) 0%, transparent 40%),
                  linear-gradient(135deg, transparent 0%, transparent 30%, rgba(0, 0, 0, 0.3) 60%, rgba(0, 0, 0, 0.8) 100%)
                `,
              }}
            />
            {/* Edge fading with directional flow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0, 0, 0, 0.9) 100%),
                  linear-gradient(to left, transparent 0%, transparent 70%, rgba(0, 0, 0, 0.6) 100%),
                  linear-gradient(to top, transparent 60%, rgba(0, 0, 0, 0.4) 100%)
                `,
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div className="text-white">
              <div className="text-6xl md:text-7xl font-bold mb-3">{displayRate}</div>
              <div className="text-base md:text-lg text-gray-400">per month</div>
            </div>

            <Button asChild className="rounded-full px-7 py-6" size="lg" variant="secondary">
              <a className="flex items-center gap-2 font-medium" href={SIGNUP_URL}>
                Start Trial <ChevronRight />
              </a>
            </Button>
          </div>
        </div>

        {/* What's Included Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 tracking-wider mb-8">
            What&apos;s Included
          </h3>
          <div className="space-y-8">
            {featuredPlan.features.map((feature, index) => (
              <PricingFeatureItem key={index} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
