import type { ReactNode } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';

import { IntercomInviteHeader } from './intercom-invite-header';

interface IntercomInviteLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

/**
 * Layout wrapper for Intercom invite-related pages.
 * Provides consistent styling with AuthIcons background and centered content.
 */
export function IntercomInviteLayout({ children, title, description }: IntercomInviteLayoutProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <IntercomInviteHeader />

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground text-center">{description}</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
