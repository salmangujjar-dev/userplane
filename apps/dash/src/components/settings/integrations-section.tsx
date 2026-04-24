'use client';

import type { IntegrationAssetKey } from '@userplane/storage/media';
import { Button } from '@userplane/ui/components/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@userplane/ui/components/pagination';
import { Skeleton } from '@userplane/ui/components/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@userplane/ui/components/tabs';
import { ChevronRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { IntegrationPostConnectModal } from '@/components/modals/integration-post-connect-modal';
import { IntegrationPreConnectModal } from '@/components/modals/integration-pre-connect-modal';
import {
  useIntercomAuthorize,
  useIntercomDisconnect,
  useIntercomIntegration,
  useSlackAuthorize,
  useSlackDisconnect,
  useSlackIntegration,
  useZendeskDisconnect,
  useZendeskIntegration,
} from '@/features/integrations';
import {
  CHROME_EXTENSION_MARKETPLACE_APP_URL,
  type IntegrationMarketplaceProvider,
  isIntegrationMarketplaceProvider,
  openIntegrationMarketplace,
} from '@/lib/integration-marketplace';
import { mediaClient } from '@/lib/media';
import {
  showIntercomDisconnectedToast,
  showSlackDisconnectedToast,
  showZendeskDisconnectedToast,
} from '@/lib/toasts';

type ConnectedIntegrationId = 'intercom' | 'zendesk' | 'slack';
type StaticIntegrationId =
  | 'chrome'
  | 'crisp'
  | 'freshdesk'
  | 'freshchat'
  | 'front'
  | 'happyfox'
  | 'hiver'
  | 'jiraservicedesk'
  | 'zoho'
  | 'jira'
  | 'linear'
  | 'asana'
  | 'clickup'
  | 'notion'
  | 'salesforce'
  | 'sentry';
type SettingsIntegrationId =
  | ConnectedIntegrationId
  | IntegrationMarketplaceProvider
  | StaticIntegrationId;
type SettingsIntegrationCategory = 'helpdesks' | 'issue-trackers';

type SettingsIntegrationConfig = {
  id: SettingsIntegrationId;
  name: string;
  icon: IntegrationAssetKey;
  category: SettingsIntegrationCategory;
};

const INTEGRATIONS_PAGE_SIZE = 6;
const INTEGRATION_SKELETON_ROW_KEYS = [
  'integration-skeleton-1',
  'integration-skeleton-2',
  'integration-skeleton-3',
  'integration-skeleton-4',
  'integration-skeleton-5',
  'integration-skeleton-6',
] as const;

const SETTINGS_INTEGRATION_CATEGORIES = [
  { id: 'helpdesks', label: 'Help desks' },
  { id: 'issue-trackers', label: 'Issue trackers' },
] as const satisfies readonly { id: SettingsIntegrationCategory; label: string }[];

const SETTINGS_INTEGRATIONS = [
  { id: 'intercom', name: 'Intercom', icon: 'integrations/intercom.webp', category: 'helpdesks' },
  { id: 'zendesk', name: 'Zendesk', icon: 'integrations/zendesk.webp', category: 'helpdesks' },
  { id: 'slack', name: 'Slack', icon: 'integrations/slack.webp', category: 'helpdesks' },
  { id: 'chrome', name: 'Chrome', icon: 'integrations/chrome.webp', category: 'helpdesks' },
  { id: 'discord', name: 'Discord', icon: 'integrations/discord.webp', category: 'helpdesks' },
  {
    id: 'helpscout',
    name: 'Help Scout',
    icon: 'integrations/helpscout.webp',
    category: 'helpdesks',
  },
  { id: 'pylon', name: 'Pylon', icon: 'integrations/pylon.webp', category: 'helpdesks' },
  { id: 'plain', name: 'Plain', icon: 'integrations/plain.webp', category: 'helpdesks' },
  { id: 'hubspot', name: 'HubSpot', icon: 'integrations/hubspot.webp', category: 'helpdesks' },
  { id: 'crisp', name: 'Crisp', icon: 'integrations/crisp.webp', category: 'helpdesks' },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    icon: 'integrations/freshdesk.webp',
    category: 'helpdesks',
  },
  {
    id: 'freshchat',
    name: 'Freshchat',
    icon: 'integrations/freshchat.webp',
    category: 'helpdesks',
  },
  { id: 'front', name: 'Front', icon: 'integrations/front.webp', category: 'helpdesks' },
  {
    id: 'happyfox',
    name: 'HappyFox',
    icon: 'integrations/happyfox.webp',
    category: 'helpdesks',
  },
  { id: 'hiver', name: 'Hiver', icon: 'integrations/hiver.webp', category: 'helpdesks' },
  {
    id: 'jiraservicedesk',
    name: 'Jira Service Desk',
    icon: 'integrations/jiraservicedesk.webp',
    category: 'helpdesks',
  },
  { id: 'zoho', name: 'Zoho', icon: 'integrations/zoho.webp', category: 'helpdesks' },
  { id: 'jira', name: 'Jira', icon: 'integrations/jira.webp', category: 'issue-trackers' },
  { id: 'linear', name: 'Linear', icon: 'integrations/linear.webp', category: 'issue-trackers' },
  { id: 'asana', name: 'Asana', icon: 'integrations/asana.webp', category: 'issue-trackers' },
  {
    id: 'clickup',
    name: 'ClickUp',
    icon: 'integrations/clickup.webp',
    category: 'issue-trackers',
  },
  { id: 'notion', name: 'Notion', icon: 'integrations/notion.webp', category: 'issue-trackers' },
  {
    id: 'salesforce',
    name: 'Salesforce Service Cloud',
    icon: 'integrations/salesforce.webp',
    category: 'helpdesks',
  },
  { id: 'sentry', name: 'Sentry', icon: 'integrations/sentry.webp', category: 'issue-trackers' },
] as const satisfies readonly SettingsIntegrationConfig[];

function hasConnectedState(id: SettingsIntegrationId): id is ConnectedIntegrationId {
  return id === 'intercom' || id === 'zendesk' || id === 'slack';
}

function IntegrationRowsSkeleton() {
  return (
    <div className="max-w-2xl space-y-3">
      {INTEGRATION_SKELETON_ROW_KEYS.map((key) => (
        <div key={key} className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="w-24 h-4" />
          </div>
          <Skeleton className="w-[120px] h-9 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function IntegrationCategoryTabs() {
  return (
    <TabsList className="mb-4">
      {SETTINGS_INTEGRATION_CATEGORIES.map((category) => (
        <TabsTrigger key={category.id} value={category.id}>
          {category.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

function SettingsIntegrationRow({
  integration,
  isConnected,
  isPending,
  onSelect,
}: {
  integration: SettingsIntegrationConfig;
  isConnected: boolean;
  isPending: boolean;
  onSelect: (id: SettingsIntegrationId) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <Image
          src={mediaClient.getIntegrationMediaUrl(integration.icon)}
          alt={integration.name}
          width={32}
          height={32}
          className="object-contain"
        />
        <span className="font-medium">{integration.name}</span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="min-w-[120px]"
        onClick={() => onSelect(integration.id)}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {isConnected ? 'Connected' : 'Connect'}
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

function IntegrationPaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          />
        </PaginationItem>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <PaginationItem key={page}>
                <PaginationLink onClick={() => onPageChange(page)} isActive={currentPage === page}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          }

          if (page === currentPage - 2 || page === currentPage + 2) {
            return (
              <PaginationItem key={page}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return null;
        })}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function IntegrationsSection() {
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<SettingsIntegrationId | null>(
    null
  );
  const [activeCategory, setActiveCategory] = useState<SettingsIntegrationCategory>('helpdesks');
  const [currentPage, setCurrentPage] = useState(1);

  // Intercom hooks
  const { data: intercomData, isLoading: intercomLoading } = useIntercomIntegration();
  const authorizeIntercom = useIntercomAuthorize();
  const disconnectIntercom = useIntercomDisconnect();

  // Zendesk hooks
  const { data: zendeskData, isLoading: zendeskLoading } = useZendeskIntegration();
  const disconnectZendesk = useZendeskDisconnect();

  // Slack hooks
  const { data: slackData, isLoading: slackLoading } = useSlackIntegration();
  const authorizeSlack = useSlackAuthorize();
  const disconnectSlack = useSlackDisconnect();

  const isIntercomConnected = intercomData?.success && intercomData.data.integration.connected;
  const isZendeskConnected = zendeskData?.success && zendeskData.data.integration.connected;
  const isSlackConnected = slackData?.success && slackData.data.integration.connected;

  const handleIntercomConnect = async () => {
    authorizeIntercom.mutate();
  };

  const handleIntercomDisconnect = async () => {
    disconnectIntercom.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          showIntercomDisconnectedToast();
          setSelectedIntegrationId(null);
        }
      },
    });
  };

  const handleZendeskDisconnect = async () => {
    disconnectZendesk.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          showZendeskDisconnectedToast();
          setSelectedIntegrationId(null);
        }
      },
    });
  };

  const handleSlackConnect = async () => {
    authorizeSlack.mutate();
  };

  const handleSlackDisconnect = async () => {
    disconnectSlack.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          showSlackDisconnectedToast();
          setSelectedIntegrationId(null);
        }
      },
    });
  };

  const isLoading = intercomLoading || zendeskLoading || slackLoading;
  const selectedIntegration =
    SETTINGS_INTEGRATIONS.find((integration) => integration.id === selectedIntegrationId) ?? null;
  const selectedConnectedIntegrationId =
    selectedIntegration && hasConnectedState(selectedIntegration.id)
      ? selectedIntegration.id
      : null;
  const filteredIntegrations = SETTINGS_INTEGRATIONS.filter(
    (integration) => integration.category === activeCategory
  );
  const totalPages = Math.max(1, Math.ceil(filteredIntegrations.length / INTEGRATIONS_PAGE_SIZE));
  const paginatedIntegrations = filteredIntegrations.slice(
    (currentPage - 1) * INTEGRATIONS_PAGE_SIZE,
    currentPage * INTEGRATIONS_PAGE_SIZE
  );

  const getIsConnected = (id: SettingsIntegrationId) => {
    if (id === 'intercom') return !!isIntercomConnected;
    if (id === 'zendesk') return !!isZendeskConnected;
    if (id === 'slack') return !!isSlackConnected;
    return false;
  };

  const getIsPending = (id: SettingsIntegrationId) => {
    if (id === 'intercom') return authorizeIntercom.isPending;
    if (id === 'slack') return authorizeSlack.isPending;
    return false;
  };

  const getIsDisconnecting = (id: SettingsIntegrationId) => {
    if (id === 'intercom') return disconnectIntercom.isPending;
    if (id === 'zendesk') return disconnectZendesk.isPending;
    if (id === 'slack') return disconnectSlack.isPending;
    return false;
  };

  const handleBrowserConnect = (id: SettingsIntegrationId) => {
    if (id === 'chrome') {
      window.open(CHROME_EXTENSION_MARKETPLACE_APP_URL, '_blank');
      return;
    }

    if (isIntegrationMarketplaceProvider(id)) {
      openIntegrationMarketplace(id);
      return;
    }

    window.open(CHROME_EXTENSION_MARKETPLACE_APP_URL, '_blank');
  };

  const handleIntegrationConnect = (id: SettingsIntegrationId) => {
    if (id === 'intercom') {
      handleIntercomConnect();
      return;
    }

    if (id === 'slack') {
      handleSlackConnect();
      return;
    }

    if (id === 'zendesk') {
      openIntegrationMarketplace('zendesk');
      return;
    }

    handleBrowserConnect(id);
  };

  const handleIntegrationDisconnect = (id: ConnectedIntegrationId) => {
    if (id === 'intercom') {
      handleIntercomDisconnect();
      return;
    }

    if (id === 'zendesk') {
      handleZendeskDisconnect();
      return;
    }

    handleSlackDisconnect();
  };

  const handleCategoryChange = (value: string) => {
    setActiveCategory(value as SettingsIntegrationCategory);
    setCurrentPage(1);
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
        <IntegrationRowsSkeleton />
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
      <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="max-w-2xl">
        <IntegrationCategoryTabs />

        <div className="space-y-3">
          {paginatedIntegrations.map((integration) => {
            const isConnected = getIsConnected(integration.id);
            const isPending = getIsPending(integration.id);

            return (
              <SettingsIntegrationRow
                key={integration.id}
                integration={integration}
                isConnected={isConnected}
                isPending={isPending}
                onSelect={setSelectedIntegrationId}
              />
            );
          })}
        </div>

        <IntegrationPaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Tabs>

      {selectedIntegration && !getIsConnected(selectedIntegration.id) && (
        <IntegrationPreConnectModal
          open={!!selectedIntegration}
          onOpenChange={(open) => setSelectedIntegrationId(open ? selectedIntegration.id : null)}
          integrationName={selectedIntegration.name}
          integrationImage={mediaClient.getIntegrationMediaUrl(selectedIntegration.icon)}
          onConnect={() => handleIntegrationConnect(selectedIntegration.id)}
        />
      )}

      {selectedIntegration &&
        selectedConnectedIntegrationId &&
        getIsConnected(selectedConnectedIntegrationId) && (
          <IntegrationPostConnectModal
            open={!!selectedIntegration}
            onOpenChange={(open) => setSelectedIntegrationId(open ? selectedIntegration.id : null)}
            integrationName={selectedIntegration.name}
            integrationImage={mediaClient.getIntegrationMediaUrl(selectedIntegration.icon)}
            onDisconnect={() => handleIntegrationDisconnect(selectedConnectedIntegrationId)}
            isDisconnecting={getIsDisconnecting(selectedConnectedIntegrationId)}
          />
        )}
    </div>
  );
}
