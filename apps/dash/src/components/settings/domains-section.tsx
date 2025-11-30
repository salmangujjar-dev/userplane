'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { X, ChevronRight } from 'lucide-react';
import { DomainVerificationPreModal } from '@/components/modals/domain-verification-pre-modal';
import { DomainVerificationVerifyingModal } from '@/components/modals/domain-verification-verifying-modal';
import { DomainVerificationPostModal } from '@/components/modals/domain-verification-post-modal';

const DOMAINS = [
  { id: 1, url: 'localhost:5500/', status: 'Installed', verified: true },
  { id: 2, url: 'app.userplane.io', status: 'Pending', verified: false },
  { id: 3, url: 'staging.userplane.io/dashboard', status: 'Installed', verified: true },
];

type VerificationStep = 'pre' | 'verifying' | 'post' | null;

export function DomainsSection() {
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomainUrl, setNewDomainUrl] = useState('');
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(null);

  const handleAddDomain = () => {
    if (newDomainUrl.trim()) {
      console.log('Adding domain:', newDomainUrl);
      setNewDomainUrl('');
      setShowAddDomain(false);
    }
  };

  const handleCancel = () => {
    setNewDomainUrl('');
    setShowAddDomain(false);
  };

  const handleVerify = (domainUrl: string) => {
    setVerifyingDomain(domainUrl);
    setVerificationStep('pre');
  };

  const handleShowVerified = (domainUrl: string) => {
    setVerifyingDomain(domainUrl);
    setVerificationStep('post');
  };

  const handleStartVerification = async () => {
    setVerificationStep('verifying');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setVerificationStep('post');
  };

  const handleCloseModals = () => {
    setVerifyingDomain(null);
    setVerificationStep(null);
  };

  const handleReverify = () => {
    setVerificationStep('pre');
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Domains</h2>
        <p className="text-sm text-muted-foreground">Manage allowed domains for recordings</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {DOMAINS.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center justify-between p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-2 w-2 rounded-full ${domain.verified ? 'bg-green-500' : 'bg-yellow-500'}`}
              />
              <span className="text-sm">
                {domain.url.includes('/') ? (
                  <>
                    <span className="text-foreground">{domain.url.split('/')[0]}/</span>
                    <span className="text-muted-foreground">
                      {domain.url.split('/').slice(1).join('/')}
                    </span>
                  </>
                ) : (
                  <span className="text-foreground">{domain.url}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {domain.verified ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
                  onClick={() => handleShowVerified(domain.url)}
                >
                  Verified
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
                  onClick={() => handleVerify(domain.url)}
                >
                  Verify
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {showAddDomain ? (
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="domain-url" className="text-sm font-medium">
                Domain URL
              </label>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              id="domain-url"
              value={newDomainUrl}
              onChange={(e) => setNewDomainUrl(e.target.value)}
              placeholder="example.com"
              className="w-full"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddDomain} disabled={!newDomainUrl.trim()}>
                Add Domain
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full max-w-2xl"
            onClick={() => setShowAddDomain(true)}
          >
            Set up another domain
          </Button>
        )}
      </div>

      <DomainVerificationPreModal
        open={verificationStep === 'pre'}
        onOpenChange={handleCloseModals}
        domainUrl={verifyingDomain || ''}
        onVerify={handleStartVerification}
      />

      <DomainVerificationVerifyingModal
        open={verificationStep === 'verifying'}
        onOpenChange={handleCloseModals}
      />

      <DomainVerificationPostModal
        open={verificationStep === 'post'}
        onOpenChange={handleCloseModals}
        domainUrl={verifyingDomain || ''}
        onReverify={handleReverify}
      />
    </div>
  );
}
