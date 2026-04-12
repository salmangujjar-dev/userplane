import Logo from '@userplane/ui/components/logo';
import { Separator } from '@userplane/ui/components/separator';

import { FOOTER_AI_LINKS, FOOTER_COPYRIGHT, FOOTER_LINKS } from '@/constants/footer';

interface ListingBadge {
  name: string;
  href: string;
  badge: { src: string; alt: string; width: number; height: number };
}

interface LaunchFooterProps {
  listingBadges?: ListingBadge[];
}

const NAV_SECTIONS = [
  { title: 'Product', links: FOOTER_LINKS.product },
  { title: 'Company', links: FOOTER_LINKS.company },
  { title: 'Legal', links: FOOTER_LINKS.legal },
] as const;

export default function LaunchFooter({ listingBadges }: LaunchFooterProps) {
  return (
    <footer className="mx-auto my-12 w-full max-w-7xl bg-background">
      <div className="mx-auto flex w-full flex-col px-4 md:px-8">
        <div className="rounded-4xl bg-card p-8 md:p-12">
          <div className="flex flex-col gap-8">
            {/* Top section with logo and navigation */}
            <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
              <div className="flex shrink-0 flex-col gap-4">
                <Logo size="lg" />
                <p className="max-w-sm text-muted-foreground text-sm">
                  &copy;{' '}
                  <time dateTime={new Date().toISOString().slice(0, 10)}>
                    {new Date().getFullYear()}
                  </time>{' '}
                  {FOOTER_COPYRIGHT}
                </p>
                {listingBadges && listingBadges.length > 0 && (
                  <div
                    className="overflow-hidden w-48"
                    style={{
                      maskImage:
                        'linear-gradient(to right, transparent, black 18%, black 82%, transparent)',
                      WebkitMaskImage:
                        'linear-gradient(to right, transparent, black 18%, black 82%, transparent)',
                    }}
                  >
                    <style>{`
                      @keyframes badge-scroll {
                        0%   { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                      }
                      .badge-carousel { animation: badge-scroll 20s linear infinite; }
                      .badge-carousel:hover { animation-play-state: paused; }
                    `}</style>
                    <div className="badge-carousel flex gap-2" style={{ width: 'max-content' }}>
                      {[...listingBadges, ...listingBadges].map((item, i) => (
                        <a
                          key={`${item.name}-${i}`}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex w-fit items-center gap-3 rounded-lg border border-border/60 px-4 py-2.5 transition-colors hover:border-border hover:bg-muted/30"
                        >
                          <img
                            src={item.badge.src}
                            alt={item.badge.alt}
                            width={item.badge.width / 2}
                            height={item.badge.height / 2}
                            loading="lazy"
                            decoding="async"
                            className="block"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="flex lg:hidden" />

              <div className="flex flex-wrap gap-8 md:grid md:grid-cols-3 md:gap-10">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title} className="flex flex-col gap-4">
                    <h3 className="font-semibold text-foreground">{section.title}</h3>
                    <ul className="flex flex-col gap-1">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <a
                            className="inline-block py-3 text-muted-foreground text-sm transition-colors hover:text-foreground"
                            href={link.href}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Ask about Userplane on + status */}
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <p className="text-muted-foreground text-sm">Ask about Userplane on</p>
                <div className="flex items-center gap-2">
                  {FOOTER_AI_LINKS.map((link) => (
                    <a
                      key={link.label}
                      aria-label={`Ask about Userplane on ${link.label}`}
                      className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                      href={link.href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <img
                        alt={link.label}
                        src={link.icon}
                        width={20}
                        height={20}
                        loading="lazy"
                        decoding="async"
                        className="size-5"
                      />
                    </a>
                  ))}
                </div>
              </div>

              <a
                href="https://status.userplane.io"
                target="_blank"
                rel="noopener noreferrer"
                className="group isolate block rounded-lg"
              >
                <div className="relative z-10 flex h-8 items-center justify-center gap-2 rounded-[7px] bg-background px-2.5">
                  <svg
                    className="size-3 text-emerald-500"
                    fill="none"
                    viewBox="0 0 11 11"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <style>
                      {`
                        @keyframes status-row {
                          0%  { opacity: 0.2; }
                          25% { opacity: 0.4; }
                          50% { opacity: 0.6; }
                          75% { opacity: 1;   }
                          100%{ opacity: 0.2; }
                        }
                        .status-row { animation: status-row 1.2s ease-in-out infinite; }
                      `}
                    </style>
                    <g className="status-row" style={{ animationDelay: '0s' }}>
                      <path d="M0 0H1.5V1.5H0V0Z" fill="currentColor" />
                      <path d="M3 0H4.5V1.5H3V0Z" fill="currentColor" />
                      <path d="M6 0H7.5V1.5H6V0Z" fill="currentColor" />
                      <path d="M9 0H10.5V1.5H9V0Z" fill="currentColor" />
                    </g>
                    <g className="status-row" style={{ animationDelay: '0.3s' }}>
                      <path d="M0 3H1.5V4.5H0V3Z" fill="currentColor" />
                      <path d="M3 3H4.5V4.5H3V3Z" fill="currentColor" />
                      <path d="M6 3H7.5V4.5H6V3Z" fill="currentColor" />
                      <path d="M9 3H10.5V4.5H9V3Z" fill="currentColor" />
                    </g>
                    <g className="status-row" style={{ animationDelay: '0.6s' }}>
                      <path d="M0 6H1.5V7.5H0V6Z" fill="currentColor" />
                      <path d="M3 6H4.5V7.5H3V6Z" fill="currentColor" />
                      <path d="M6 6H7.5V7.5H6V6Z" fill="currentColor" />
                      <path d="M9 6H10.5V7.5H9V6Z" fill="currentColor" />
                    </g>
                    <g className="status-row" style={{ animationDelay: '0.9s' }}>
                      <path d="M0 9H1.5V10.5H0V9Z" fill="currentColor" />
                      <path d="M3 9H4.5V10.5H3V9Z" fill="currentColor" />
                      <path d="M6 9H7.5V10.5H6V9Z" fill="currentColor" />
                      <path d="M9 9H10.5V10.5H9V9Z" fill="currentColor" />
                    </g>
                  </svg>
                  <p className="text-emerald-500 text-sm select-none">All systems operational</p>
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-[7px] bg-emerald-500/3 transition-colors duration-200 ease-out group-hover:bg-emerald-500/8" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
