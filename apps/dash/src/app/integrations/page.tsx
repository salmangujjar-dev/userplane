'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { IntegrationPreConnectModal } from '@/components/modals/integration-pre-connect-modal';
import { IntegrationPostConnectModal } from '@/components/modals/integration-post-connect-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { ChevronRight } from 'lucide-react';

interface Integration {
  name: string;
  image: string;
  connected: boolean;
}

const issueTrackers: Integration[] = [
  { name: 'Asana', image: '/integrations/asana.webp', connected: false },
  { name: 'ClickUp', image: '/integrations/clickup.webp', connected: false },
  { name: 'Jira', image: '/integrations/jira.webp', connected: true },
  { name: 'Jira Service Desk', image: '/integrations/jiraservicedesk.webp', connected: false },
  { name: 'Linear', image: '/integrations/linear.webp', connected: false },
  { name: 'Notion', image: '/integrations/notion.webp', connected: false },
  { name: 'Sentry', image: '/integrations/sentry.webp', connected: false },
];

const helpdesk: Integration[] = [
  { name: 'Crisp', image: '/integrations/crisp.webp', connected: false },
  { name: 'Freshchat', image: '/integrations/freshchat.webp', connected: false },
  { name: 'Freshdesk', image: '/integrations/freshdesk.webp', connected: false },
  { name: 'Front', image: '/integrations/front.webp', connected: false },
  { name: 'HappyFox', image: '/integrations/happyfox.webp', connected: false },
  { name: 'Help Scout', image: '/integrations/helpscout.webp', connected: false },
  { name: 'Hiver', image: '/integrations/hiver.webp', connected: false },
  { name: 'Intercom', image: '/integrations/intercom.webp', connected: true },
  { name: 'Plain', image: '/integrations/plain.webp', connected: false },
  { name: 'Pylon', image: '/integrations/pylon.webp', connected: false },
  { name: 'Talkdesk', image: '/integrations/talkdesk.webp', connected: false },
  { name: 'Zendesk', image: '/integrations/zendesk.webp', connected: true },
];

const crm: Integration[] = [
  { name: 'HubSpot', image: '/integrations/hubspot.webp', connected: false },
  { name: 'Salesforce', image: '/integrations/salesforce.webp', connected: false },
  { name: 'Zoho', image: '/integrations/zoho.webp', connected: false },
];

const workflows: Integration[] = [
  { name: 'Make', image: '/integrations/make.webp', connected: false },
  { name: 'n8n', image: '/integrations/n8n.webp', connected: false },
  { name: 'Zapier', image: '/integrations/zapier.webp', connected: false },
  { name: 'Slack', image: '/integrations/slack.webp', connected: false },
  { name: 'Discord', image: '/integrations/discord.webp', connected: false },
];

export default function IntegrationsPage() {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(
    new Set(['Intercom', 'Zendesk', 'Jira'])
  );

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
  };

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
  };

  const handleConnectIntegration = (integrationName: string) => {
    setConnectedIntegrations((prev) => {
      const newSet = new Set(prev);
      newSet.add(integrationName);
      return newSet;
    });
  };

  const handleDisconnect = (integrationName: string) => {
    setConnectedIntegrations((prev) => {
      const newSet = new Set(prev);
      newSet.delete(integrationName);
      return newSet;
    });
  };

  const isIntegrationConnected = (name: string) => connectedIntegrations.has(name);

  const renderIntegrationList = (integrations: Integration[]) => (
    <div className="space-y-3">
      {integrations.map((integration) => {
        const connected = isIntegrationConnected(integration.name);
        return (
          <div
            key={integration.name}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Image
                src={integration.image}
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
              className="rounded-full min-w-[120px]"
              onClick={() => handleConnect(integration)}
            >
              {connected ? 'Connected' : 'Connect'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        workspaceName="Lary's Workspace"
        planName="Starter"
        userName="Olivia Martin"
        userEmail="olivia.martin@email.com"
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopActions
          onInviteClick={() => setInviteModalOpen(true)}
          createLinkButton={<CreateLinkModal onLinkCreated={handleLinkCreated} />}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Integrations</h2>
            <p className="text-sm text-muted-foreground">
              Connect workspace with apps you already use
            </p>
          </div>

          <Tabs defaultValue="helpdesk" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="helpdesk">Helpdesk</TabsTrigger>
              <TabsTrigger value="crm">CRM</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="issue-trackers">Issue trackers</TabsTrigger>
            </TabsList>

            <TabsContent value="helpdesk">{renderIntegrationList(helpdesk)}</TabsContent>

            <TabsContent value="crm">{renderIntegrationList(crm)}</TabsContent>

            <TabsContent value="workflows">{renderIntegrationList(workflows)}</TabsContent>

            <TabsContent value="issue-trackers">{renderIntegrationList(issueTrackers)}</TabsContent>
          </Tabs>
        </main>
      </div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <ShareLinkModal
        link={shareLink || ''}
        open={!!shareLink}
        onClose={() => setShareLink(null)}
      />

      {selectedIntegration && !isIntegrationConnected(selectedIntegration.name) && (
        <IntegrationPreConnectModal
          open={!!selectedIntegration}
          onOpenChange={(open) => !open && setSelectedIntegration(null)}
          integrationName={selectedIntegration.name}
          integrationImage={selectedIntegration.image}
          onConnect={() => handleConnectIntegration(selectedIntegration.name)}
        />
      )}

      {selectedIntegration && isIntegrationConnected(selectedIntegration.name) && (
        <IntegrationPostConnectModal
          open={!!selectedIntegration}
          onOpenChange={(open) => !open && setSelectedIntegration(null)}
          integrationName={selectedIntegration.name}
          integrationImage={selectedIntegration.image}
        />
      )}
    </div>
  );
}
