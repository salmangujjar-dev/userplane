import Logo from '@userplane/ui/components/logo';
import Link from 'next/link';

import { AuthIcons } from './auth-icons';

export function AuthLayout({
  children,
  bottomContent,
}: {
  children: React.ReactNode;
  bottomContent?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 pb-32 lg:pb-12 bg-background overflow-hidden">
      <AuthIcons />
      <div className="w-full max-w-md space-y-10 relative z-10">{children}</div>
      {bottomContent}
    </div>
  );
}

export function AuthHeader({ subtitle }: { subtitle: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Link href="/">
        <Logo />
      </Link>
      <p className="text-sm text-muted-foreground text-center">{subtitle}</p>
    </div>
  );
}

export function AuthFooter() {
  return (
    <p className="text-center text-xs text-muted-foreground">
      By continuing, you agree to our{' '}
      <Link href="/terms" className="hover:text-foreground transition-colors">
        Terms of Service
      </Link>{' '}
      and{' '}
      <Link href="/privacy" className="hover:text-foreground transition-colors">
        Privacy Policy
      </Link>
    </p>
  );
}
