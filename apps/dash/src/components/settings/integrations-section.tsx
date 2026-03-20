'use client';

import { Button } from '@userplane/ui/components/button';
import { Skeleton } from '@userplane/ui/components/skeleton';
import { ChevronRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { IntegrationPostConnectModal } from '@/components/modals/integration-post-connect-modal';
import { IntegrationPreConnectModal } from '@/components/modals/integration-pre-connect-modal';
import { ZendeskSubdomainInput } from '@/components/zendesk-subdomain-input';
import {
  useIntercomAuthorize,
  useIntercomDisconnect,
  useIntercomIntegration,
  useZendeskAuthorize,
  useZendeskDisconnect,
  useZendeskIntegration,
} from '@/features/integrations';
import { mediaClient } from '@/lib/media';
import { showIntercomDisconnectedToast, showZendeskDisconnectedToast } from '@/lib/toasts';

export function IntegrationsSection() {
  const [showIntercomModal, setShowIntercomModal] = useState(false);
  const [showZendeskModal, setShowZendeskModal] = useState(false);
  const [zendeskSubdomain, setZendeskSubdomain] = useState('');

  // Intercom hooks
  const { data: intercomData, isLoading: intercomLoading } = useIntercomIntegration();
  const authorizeIntercom = useIntercomAuthorize();
  const disconnectIntercom = useIntercomDisconnect();

  // Zendesk hooks
  const { data: zendeskData, isLoading: zendeskLoading } = useZendeskIntegration();
  const authorizeZendesk = useZendeskAuthorize();
  const disconnectZendesk = useZendeskDisconnect();

  const isIntercomConnected = intercomData?.success && intercomData.data.integration.connected;
  const isZendeskConnected = zendeskData?.success && zendeskData.data.integration.connected;

  const handleIntercomConnect = async () => {
    authorizeIntercom.mutate();
  };

  const handleIntercomDisconnect = async () => {
    disconnectIntercom.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          showIntercomDisconnectedToast();
          setShowIntercomModal(false);
        }
      },
    });
  };

  const handleZendeskConnect = async () => {
    if (!zendeskSubdomain.trim()) return;
    authorizeZendesk.mutate(zendeskSubdomain.trim());
  };

  const handleZendeskDisconnect = async () => {
    disconnectZendesk.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          showZendeskDisconnectedToast();
          setShowZendeskModal(false);
        }
      },
    });
  };

  const isLoading = intercomLoading || zendeskLoading;

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect third-party services to your workspace
          </p>
        </div>
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-24 h-4" />
            </div>
            <Skeleton className="w-[120px] h-9 rounded-full" />
          </div>
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
      <div className="max-w-2xl space-y-3">
        {/* Intercom card */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <Image
              src={mediaClient.getIntegrationMediaUrl('integrations/intercom.webp')}
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
            onClick={() => setShowIntercomModal(true)}
            disabled={authorizeIntercom.isPending}
          >
            {authorizeIntercom.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isIntercomConnected ? 'Connected' : 'Connect'}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Zendesk card */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <Image
              src={mediaClient.getIntegrationMediaUrl('integrations/zendesk.webp')}
              alt="Zendesk"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-medium">Zendesk</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full min-w-[120px]"
            onClick={() => setShowZendeskModal(true)}
            disabled={authorizeZendesk.isPending}
          >
            {authorizeZendesk.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isZendeskConnected ? 'Connected' : 'Connect'}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Intercom modals */}
      {!isIntercomConnected && (
        <IntegrationPreConnectModal
          open={showIntercomModal}
          onOpenChange={setShowIntercomModal}
          integrationName="Intercom"
          integrationImage={mediaClient.getIntegrationMediaUrl('integrations/intercom.webp')}
          onConnect={handleIntercomConnect}
        />
      )}

      {isIntercomConnected && (
        <IntegrationPostConnectModal
          open={showIntercomModal}
          onOpenChange={setShowIntercomModal}
          integrationName="Intercom"
          integrationImage={mediaClient.getIntegrationMediaUrl('integrations/intercom.webp')}
          onDisconnect={handleIntercomDisconnect}
          isDisconnecting={disconnectIntercom.isPending}
        />
      )}

      {/* Zendesk modals */}
      {!isZendeskConnected && (
        <IntegrationPreConnectModal
          open={showZendeskModal}
          onOpenChange={setShowZendeskModal}
          integrationName="Zendesk"
          integrationImage={mediaClient.getIntegrationMediaUrl('integrations/zendesk.webp')}
          onConnect={handleZendeskConnect}
        >
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium" htmlFor="zendesk-subdomain">
              Zendesk Subdomain
            </label>
            <ZendeskSubdomainInput
              id="zendesk-subdomain"
              value={zendeskSubdomain}
              onChange={setZendeskSubdomain}
            />
          </div>
        </IntegrationPreConnectModal>
      )}

      {isZendeskConnected && (
        <IntegrationPostConnectModal
          open={showZendeskModal}
          onOpenChange={setShowZendeskModal}
          integrationName="Zendesk"
          integrationImage={mediaClient.getIntegrationMediaUrl('integrations/zendesk.webp')}
          onDisconnect={handleZendeskDisconnect}
          isDisconnecting={disconnectZendesk.isPending}
        />
      )}
    </div>
  );
}
