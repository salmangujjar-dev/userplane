import { Button } from '@workspace/ui/components/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '@workspace/ui/components/drawer';
import Logo from '@workspace/ui/components/logo';
import { AlignJustify, LogIn } from 'lucide-react';

import { getPricingUrl } from '@/constants/feature-flags';
import { LOGO_LINK, NAV_LINKS } from '@/constants/navigation';
import { SIGNUP_URL } from '@/constants/onboarding';

function DrawerNavLink({
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
        className={`rounded-full border-[0.5px] hover:brightness-99 ${className}`}
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

export default function Header() {
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
          href={getPricingUrl()}
        >
          Pricing
        </a>
        <a
          className="inline-block min-h-[48px] py-3 text-sm opacity-70 transition-opacity hover:opacity-100"
          href={NAV_LINKS.roadmap}
        >
          Roadmap
        </a>
      </div>

      <div className="hidden flex-1 justify-end gap-1 md:flex">
        <Button
          asChild
          className="rounded-full border-[0.5px] hover:brightness-99"
          variant="secondary"
        >
          <a className="flex items-center gap-2 px-5 py-5 font-medium" href={SIGNUP_URL}>
            Get Started
          </a>
        </Button>
      </div>

      <div className="flex items-center md:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button aria-label="open-sidebar" size="icon" variant="ghost">
              <span className="sr-only">Open sidebar</span>
              <AlignJustify className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="flex flex-col gap-6 p-6 pt-10">
            <div className="sr-only">
              <DrawerTitle>Navigation Menu</DrawerTitle>
            </div>
            <div className="sr-only">
              <DrawerDescription>
                Main navigation links and user actions for Userplane.
              </DrawerDescription>
            </div>
            <div className="flex w-full flex-col items-center gap-4">
              <nav className="flex w-full flex-col">
                <DrawerNavLink href="/#features">Features</DrawerNavLink>
                <DrawerNavLink href={getPricingUrl()}>Pricing</DrawerNavLink>
                <DrawerNavLink href={NAV_LINKS.roadmap}>Roadmap</DrawerNavLink>
              </nav>
              <div className="flex w-full flex-col">
                <DrawerNavLink href={SIGNUP_URL} icon={<LogIn className="h-4 w-4" />} isButton>
                  Get Started
                </DrawerNavLink>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
