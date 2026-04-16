import { ChevronRight } from 'lucide-react';

import type { IntegrationConfig } from '@/types/integrations';

interface RelatedIntegrationsProps {
  integrations: Array<Pick<IntegrationConfig, 'slug' | 'name' | 'seo'>>;
}

export default function RelatedIntegrations({ integrations }: RelatedIntegrationsProps) {
  if (integrations.length === 0) return null;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl p-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            More Integrations
          </span>
          <h3 className="mt-1 font-dm-sans text-[clamp(24px,3vw,32px)] font-medium leading-tight tracking-[-0.02em] text-foreground">
            Explore other integrations
          </h3>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 gap-6 border-t border-border/20 pt-6 sm:grid-cols-3">
          {integrations.map((config) => (
            <a key={config.slug} href={`/integrations/${config.slug}`} className="group block">
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Integration
                </span>
                <ChevronRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mb-1.5 text-base font-medium text-foreground">{config.name}</p>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {config.seo.description}
              </p>
            </a>
          ))}
        </div>

        {/* See all link */}
        <a
          href="/integrations"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline sm:mt-14"
        >
          View all integrations <ChevronRight className="size-3.5" />
        </a>
      </div>
    </section>
  );
}
