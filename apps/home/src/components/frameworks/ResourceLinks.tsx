import { ChevronRight } from 'lucide-react';

import type { ResourceLink } from '@/types/integrations';

interface FooterLink {
  text: string;
  href: string;
  external?: boolean;
}

interface ResourceLinksProps {
  label: string;
  headline: string;
  links: ResourceLink[];
  footerLinks?: FooterLink[];
}

export default function ResourceLinks({ label, headline, links, footerLinks }: ResourceLinksProps) {
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
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 border-t border-border/20 pt-6 sm:grid-cols-3">
          {links.map((link) => {
            const isExternal = link.href.startsWith('http://') || link.href.startsWith('https://');
            return (
              <a
                key={link.title}
                href={link.href}
                {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
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
            );
          })}
        </div>

        {/* Footer links */}
        {footerLinks && footerLinks.length > 0 && (
          <div className="mt-10 flex items-center gap-6 sm:mt-14">
            {footerLinks.map((link) => (
              <a
                key={link.text}
                href={link.href}
                {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground hover:underline"
              >
                {link.text} <ChevronRight className="size-3.5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
