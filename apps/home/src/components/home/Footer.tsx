import Logo from '@userplane/ui/components/logo';
import { Separator } from '@userplane/ui/components/separator';

import { FOOTER_AI_LINKS, FOOTER_COPYRIGHT, FOOTER_LINKS } from '@/constants/footer';

const NAV_SECTIONS = [
  { title: 'Product', links: FOOTER_LINKS.product },
  { title: 'Company', links: FOOTER_LINKS.company },
  { title: 'Legal', links: FOOTER_LINKS.legal },
] as const;

export default function Footer() {
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
                  &copy; {new Date().getFullYear()} {FOOTER_COPYRIGHT}
                </p>
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
                      <img alt={link.label} className="size-5" src={link.icon} />
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex h-8 items-center gap-2 rounded-lg bg-background px-2.5">
                <img alt="" className="size-3 text-emerald-500" src="/icons/status-grid.svg" />
                <p className="text-emerald-500 text-sm">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
