'use client';

import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { toast } from '@workspace/ui/components/sonner';
import { ChevronRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { IntegrationPostConnectModal } from '@/components/modals/integration-post-connect-modal';
import { IntegrationPreConnectModal } from '@/components/modals/integration-pre-connect-modal';
import {
  useIntercomAuthorize,
  useIntercomDisconnect,
  useIntercomIntegration,
} from '@/features/integrations';
import { mediaClient } from '@/lib/media';

export function IntegrationsSection() {
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useIntercomIntegration();
  const authorizeIntercom = useIntercomAuthorize();
  const disconnectIntercom = useIntercomDisconnect();

  const isConnected = data?.success && data.data.integration.connected;

  const handleConnect = async () => {
    authorizeIntercom.mutate();
  };

  const handleDisconnect = async () => {
    disconnectIntercom.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Intercom disconnected successfully');
          setShowModal(false);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect third-party services to your workspace
          </p>
        </div>
        <div className="max-w-2xl">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-24 h-4" />
            </div>
            <Skeleton className="w-[120px] h-9 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect third-party services to your workspace
        </p>
      </div>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <Image
              src={mediaClient.getIntegrationMediaUrl('integrations/intercom.webp')}
              alt="Intercom"
              width={32}
              height={32}
              unoptimized
              className="object-contain"
            />
            <span className="font-medium">Intercom</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full min-w-[120px]"
            onClick={() => setShowModal(true)}
            disabled={authorizeIntercom.isPending}
          >
            {authorizeIntercom.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isConnected ? 'Connected' : 'Connect'}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {!isConnected && (
        <IntegrationPreConnectModal
          open={showModal}
          onOpenChange={setShowModal}
          integrationName="Intercom"
          integrationImage={mediaClient.getIntegrationMediaUrl('integrations/intercom.webp')}
          onConnect={handleConnect}
        />
      )}

      {isConnected && (
        <IntegrationPostConnectModal
          open={showModal}
          onOpenChange={setShowModal}
          integrationName="Intercom"
          integrationImage={mediaClient.getIntegrationMediaUrl('integrations/intercom.webp')}
          onDisconnect={handleDisconnect}
          isDisconnecting={disconnectIntercom.isPending}
        />
      )}
    </div>
  );
}
