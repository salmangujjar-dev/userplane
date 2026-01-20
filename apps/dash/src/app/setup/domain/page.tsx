'use client';

import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { useQueryState } from 'nuqs';
import { Suspense } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { DomainCodeSnippet } from '@/components/domains/domain-code-snippet';

function DomainSetupContent() {
  const [workspaceId] = useQueryState('workspaceId', { defaultValue: '[WORKSPACE_ID]' });
  const [domainURL] = useQueryState('domainURL', { defaultValue: '[DOMAIN_URL]' });
  const [token] = useQueryState('userplane-token', { defaultValue: '[TOKEN]' });

  const handleVerify = () => {
    if (domainURL && domainURL !== '[DOMAIN_URL]' && token && token !== '[TOKEN]') {
      const absoluteUrl =
        domainURL.startsWith('http://') || domainURL.startsWith('https://')
          ? domainURL
          : `https://${domainURL}`;
      const verifyUrl = `${absoluteUrl}?userplane-action=verify&userplane-token=${token}`;
      window.open(verifyUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isPlaceholder =
    workspaceId === '[WORKSPACE_ID]' || domainURL === '[DOMAIN_URL]' || token === '[TOKEN]';

  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <AuthIcons />

      <nav className="absolute top-0 right-0 p-6 z-20">
        <Button onClick={handleVerify} size="lg" className="rounded-full px-7 py-3">
          Verify
        </Button>
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-10 relative z-10">
          <div className="flex flex-col items-center gap-3">
            <Logo showText={false} />
            <h1 className="text-2xl font-medium text-foreground">Userplane Code Snippet</h1>
            <p className="text-sm text-muted-foreground text-center max-w-xl">
              Install the code snippet for redacting sensitive customer data during screen
              recordings.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-foreground">Installation</h2>
            </div>

            <DomainCodeSnippet workspaceId={workspaceId} domainUrl={domainURL} />
          </div>

          {isPlaceholder && (
            <div className="flex justify-center pt-6">
              <p className="text-sm text-muted-foreground">
                Not sure?{' '}
                <a
                  href="mailto:support@userplane.io"
                  className="text-foreground hover:underline font-medium"
                >
                  Ask away
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DomainSetupPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-svh items-center justify-center">Loading...</div>}
    >
      <DomainSetupContent />
    </Suspense>
  );
}
