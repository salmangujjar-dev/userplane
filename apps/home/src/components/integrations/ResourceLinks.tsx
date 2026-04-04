import { ChevronRight } from 'lucide-react';

import type { IntegrationConfig, ResourceLink } from '@/types/integrations';

interface ResourceLinksProps {
  label: string;
  headline: string;
  links: ResourceLink[];
  seeAllHref: string;
  relatedIntegrations?: Array<Pick<IntegrationConfig, 'slug' | 'name' | 'seo'>>;
}

export default function ResourceLinks({
  label,
  headline,
  links,
  seeAllHref,
  relatedIntegrations,
}: ResourceLinksProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl p-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <h3 className="mt-1 font-dm-sans text-[clamp(24px,3vw,32px)] font-medium leading-tight tracking-[-0.02em] text-foreground">
            {headline}
          </h3>
        </div>

        {/* Resource links — 3-column grid */}
        <div className="grid grid-cols-1 gap-6 border-t border-border/20 pt-6 sm:grid-cols-3">
          {links.map((link) => (
            <a
              key={link.title}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {link.label}
                </span>
                <ChevronRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mb-1.5 text-[15px] font-medium text-foreground">{link.title}</p>
              <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                {link.description}
              </p>
            </a>
          ))}
        </div>

        {/* See all docs link */}
        <a
          href={seeAllHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground hover:underline sm:mt-14"
        >
          See all docs <ChevronRight className="size-3.5" />
        </a>

        {/* Related integrations */}
        {relatedIntegrations && relatedIntegrations.length > 0 && (
          <>
            <div className="mt-14 grid grid-cols-1 gap-6 border-t border-border/20 pt-6 sm:grid-cols-3">
              {relatedIntegrations.map((config) => (
                <a key={config.slug} href={`/integrations/${config.slug}`} className="group block">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Integration
                    </span>
                    <ChevronRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mb-1.5 text-[15px] font-medium text-foreground">{config.name}</p>
                  <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                    {config.seo.description}
                  </p>
                </a>
              ))}
            </div>

            <a
              href="/integrations"
              className="mt-10 inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground hover:underline sm:mt-14"
            >
              View all integrations <ChevronRight className="size-3.5" />
            </a>
          </>
        )}
      </div>
    </section>
  );
}
