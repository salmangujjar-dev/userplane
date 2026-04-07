import { Button } from '@userplane/ui/components/button';
import Logo from '@userplane/ui/components/logo';
import { AlignJustify, LogIn, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { LOGO_LINK, NAV_LINKS } from '@/constants/navigation';
import { SIGNUP_URL } from '@/constants/onboarding';

import IntegrationsDropdown, { type DropdownEntry } from './IntegrationsDropdown';
import TeamsDropdown, { type TeamDropdownEntry } from './TeamsDropdown';

export interface HeaderProps {
  integrations?: DropdownEntry[];
  integrationsHref?: string;
  docsHref?: string;
  teams?: TeamDropdownEntry[];
  teamsHref?: string;
}

function MobileNavLink({
  href,
  children,
  icon,
  onClick,
  isButton = false,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  isButton?: boolean;
  className?: string;
}) {
  if (isButton) {
    return (
      <Button
        asChild
        className={`border-[0.5px] hover:brightness-99 ${className}`}
        onClick={onClick}
        variant="secondary"
      >
        <a className="flex items-center gap-2 px-5 py-5 font-medium" href={href}>
          {icon}
          {children}
        </a>
      </Button>
    );
  }
  return (
    <a
      className={`flex w-full min-h-[48px] items-center gap-2 rounded-lg py-3 opacity-60 transition-opacity hover:opacity-100 ${className}`}
      href={href}
      onClick={onClick}
      tabIndex={0}
    >
      {icon}
      {children}
    </a>
  );
}

export default function Header({
  integrations,
  integrationsHref,
  docsHref,
  teams,
  teamsHref,
}: HeaderProps = {}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeMenu]);

  return (
    <nav className="mx-auto mt-12 flex w-full max-w-7xl flex-wrap items-center justify-between gap-8 p-4 font-inter text-sm">
      <div className="flex flex-1 shrink-0 items-center justify-start gap-2">
        <a href={NAV_LINKS.home} aria-label={LOGO_LINK.ariaLabel}>
          <Logo />
        </a>
      </div>

      <div className="hidden items-center gap-8 md:flex">
        <a
          className="inline-block min-h-[48px] py-3 text-sm opacity-70 transition-opacity hover:opacity-100"
          href="/#features"
        >
          Features
        </a>
        <a
          className="inline-block min-h-[48px] py-3 text-sm opacity-70 transition-opacity hover:opacity-100"
          href="/pricing"
        >
          Pricing
        </a>
        {teams && teamsHref ? (
          <TeamsDropdown entries={teams} teamsHref={teamsHref} />
        ) : (
          <a
            className="inline-block min-h-[48px] py-3 text-sm opacity-70 transition-opacity hover:opacity-100"
            href={NAV_LINKS.solutions}
          >
            Teams
          </a>
        )}
        {integrations && integrationsHref && docsHref ? (
          <IntegrationsDropdown entries={integrations} integrationsHref={integrationsHref} />
        ) : (
          <a
            className="inline-block min-h-[48px] py-3 text-sm opacity-70 transition-opacity hover:opacity-100"
            href={NAV_LINKS.integrations}
          >
            Integrations
          </a>
        )}
        <a
          className="inline-block min-h-[48px] py-3 text-sm opacity-70 transition-opacity hover:opacity-100"
          href={NAV_LINKS.help}
        >
          Support
        </a>
      </div>

      <div className="hidden flex-1 justify-end gap-1 md:flex">
        <Button asChild className="border-[0.5px] hover:brightness-99" variant="secondary">
          <a className="flex items-center gap-2 px-5 py-5 font-medium" href={SIGNUP_URL}>
            Get Started
          </a>
        </Button>
      </div>

      {/* Mobile menu trigger */}
      <div className="flex items-center md:hidden">
        <Button
          aria-label="open-sidebar"
          size="icon"
          variant="ghost"
          onClick={() => setMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <AlignJustify className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile menu overlay + panel */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in-0 duration-200"
            role="button"
            tabIndex={-1}
            aria-label="Close navigation menu"
            onClick={closeMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') closeMenu();
            }}
          />
          {/* Panel sliding up from bottom */}
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] rounded-t-lg border-t bg-background animate-in slide-in-from-bottom duration-300 ease-out">
            <div className="mx-auto mt-4 h-1.5 w-[100px] shrink-0 rounded-full bg-muted" />
            <div className="flex justify-end px-4 pt-2">
              <Button aria-label="close-sidebar" size="icon" variant="ghost" onClick={closeMenu}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col gap-6 p-6 pt-2">
              <div className="flex w-full flex-col items-center gap-4">
                <nav className="flex w-full flex-col">
                  <MobileNavLink href="/#features" onClick={closeMenu}>
                    Features
                  </MobileNavLink>
                  <MobileNavLink href="/pricing" onClick={closeMenu}>
                    Pricing
                  </MobileNavLink>
                  <MobileNavLink href={NAV_LINKS.solutions} onClick={closeMenu}>
                    Teams
                  </MobileNavLink>
                  <MobileNavLink href={NAV_LINKS.integrations} onClick={closeMenu}>
                    Integrations
                  </MobileNavLink>
                  <MobileNavLink href={NAV_LINKS.help} onClick={closeMenu}>
                    Support
                  </MobileNavLink>
                </nav>
                <div className="flex w-full flex-col">
                  <MobileNavLink
                    href={SIGNUP_URL}
                    icon={<LogIn className="h-4 w-4" />}
                    isButton
                    onClick={closeMenu}
                  >
                    Get Started
                  </MobileNavLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
