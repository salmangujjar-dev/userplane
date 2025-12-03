import { Separator } from '@workspace/ui/components/separator';
import Logo from '@workspace/ui/components/logo';
import { FOOTER_LINKS, FOOTER_COPYRIGHT } from '@/constants/v2/footer';

export default function FooterV2() {
  return (
    <footer className="mx-auto my-12 w-full max-w-7xl bg-background">
      <div className="mx-auto flex w-full flex-col px-4 md:px-8">
        {/* Rounded container matching ikiform */}
        <div className="rounded-4xl bg-card p-8 md:p-12">
          <div className="flex flex-col gap-8">
            {/* Top section with logo and navigation */}
            <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
              {/* Header section with logo */}
              <div className="flex shrink-0 flex-col gap-8">
                <div className="flex shrink-0 flex-col gap-4">
                  <Logo size="lg" />
                  <p className="max-w-sm text-muted-foreground text-sm">
                    © {new Date().getFullYear()} {FOOTER_COPYRIGHT}
                  </p>
                </div>
              </div>

              <Separator className="flex lg:hidden" />

              {/* Navigation sections */}
              <div className="flex flex-wrap gap-8 md:grid md:grid-cols-3 md:gap-10">
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-foreground">Product</h3>
                  <ul className="flex flex-col gap-1">
                    {FOOTER_LINKS.product.map((link) => (
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

                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-foreground">Company</h3>
                  <ul className="flex flex-col gap-1">
                    {FOOTER_LINKS.company.map((link) => (
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

                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-foreground">Legal</h3>
                  <ul className="flex flex-col gap-1">
                    {FOOTER_LINKS.legal.map((link) => (
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
              </div>
            </div>

            <Separator />
          </div>
        </div>
      </div>
    </footer>
  );
}
