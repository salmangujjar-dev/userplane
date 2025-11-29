'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@workspace/ui/components/button';
import { ChevronRight } from 'lucide-react';
import { IntegrationPreConnectModal } from '@/components/modals/integration-pre-connect-modal';
import { IntegrationPostConnectModal } from '@/components/modals/integration-post-connect-modal';

export function IntegrationSection() {
  const [isConnected, setIsConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleConnect = () => {
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">Manage your workspace integrations</p>
      </div>
      <div className="max-w-md">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <Image
              src="/integrations/intercom.webp"
              alt="Intercom"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-medium">Intercom</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full min-w-[120px]"
            onClick={() => setShowModal(true)}
          >
            {isConnected ? 'Connected' : 'Connect'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isConnected && (
        <IntegrationPreConnectModal
          open={showModal}
          onOpenChange={setShowModal}
          integrationName="Intercom"
          integrationImage="/integrations/intercom.webp"
          onConnect={handleConnect}
        />
      )}

      {isConnected && (
        <IntegrationPostConnectModal
          open={showModal}
          onOpenChange={setShowModal}
          integrationName="Intercom"
          integrationImage="/integrations/intercom.webp"
        />
      )}
    </div>
  );
}
