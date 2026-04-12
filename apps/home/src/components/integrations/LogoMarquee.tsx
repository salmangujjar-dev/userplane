import { mergeTransformOptions } from '@userplane/storage/media';

import { mediaClient } from '@/lib/media';
import type { IntegrationLogo } from '@/types/integrations';

interface LogoMarqueeProps {
  label: string;
  logos: IntegrationLogo[];
}

export default function LogoMarquee({ label, logos }: LogoMarqueeProps) {
  const doubled = [...logos, ...logos];

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:gap-8">
        <p className="shrink-0 whitespace-nowrap text-[13px] text-muted-foreground">{label}</p>
        <div className="w-full flex-1 overflow-hidden">
          <div className="flex animate-infinite-scroll items-center">
            {doubled.map((logo, i) => (
              <div key={`${logo.name}-${i}`} className="flex shrink-0 items-center gap-2.5 px-5">
                <img
                  src={mediaClient.getIntegrationMediaUrl(logo.asset, {
                    transform: mergeTransformOptions('icon', {
                      width: 24,
                      height: 24,
                      dpr: 2,
                    }),
                  })}
                  alt={logo.name}
                  width={24}
                  height={24}
                  className="object-contain grayscale opacity-50"
                  loading="lazy"
                  decoding="async"
                />
                <span className="whitespace-nowrap text-sm font-medium tracking-tight text-foreground/50">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
