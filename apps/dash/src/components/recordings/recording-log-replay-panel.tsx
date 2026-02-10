import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';

import { ActionsPanel } from './actions-panel';
import { BackendPanel } from './backend-panel';
import { ComingSoonOverlay } from './coming-soon-overlay';
import { ConsolePanel } from './console-panel';
import { InfoPanel } from './info-panel';
import { NetworkPanel } from './network-panel';

interface RecordingLogReplayPanelProps {
  recordingId: string;
  recording: {
    recordingId: string;
    recordingDurationMs: number;
    meta: {
      link: {
        linkId: string;
        title: string | null;
        providerType: string | null;
      };
      creator: {
        workspaceMemberId: string;
        name: string;
      };
      project: {
        projectId: string | null;
        title: string | null;
      };
      domain: {
        domainId: string;
        url: string;
      };
      workspaceId: string;
      status: string;
      systemMeta: Record<string, unknown> | null;
      customMeta?: Record<string, unknown> | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
  };
}

export function RecordingLogReplayPanel({ recording }: RecordingLogReplayPanelProps) {
  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <Tabs defaultValue="info" className="flex flex-col h-full">
        <div className="border-b px-6 pt-3">
          <TabsList className="w-full justify-center bg-transparent p-0 h-auto gap-6 border-0">
            <TabsTrigger
              value="info"
              className="rounded-none border-0 bg-transparent px-0 pb-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground"
            >
              Info
            </TabsTrigger>
            <TabsTrigger
              value="console"
              className="rounded-none border-0 bg-transparent px-0 pb-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground"
            >
              Console
            </TabsTrigger>
            <TabsTrigger
              value="network"
              className="rounded-none border-0 bg-transparent px-0 pb-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground"
            >
              Network
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="rounded-none border-0 bg-transparent px-0 pb-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground"
            >
              Actions
            </TabsTrigger>
            <TabsTrigger
              value="backend"
              className="rounded-none border-0 bg-transparent px-0 pb-3 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground"
            >
              Backend
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="info" className="h-full mt-0 p-0">
            <InfoPanel recording={recording} />
          </TabsContent>
          <TabsContent value="console" className="h-full mt-0 p-0">
            <ComingSoonOverlay
              title="Console Logs"
              subtitle="View browser console logs, errors, and debug messages captured during the session."
            >
              <ConsolePanel />
            </ComingSoonOverlay>
          </TabsContent>
          <TabsContent value="network" className="h-full mt-0 p-0">
            <ComingSoonOverlay
              title="Network Activity"
              subtitle="Inspect HTTP requests, responses, and API calls made during the recording."
            >
              <NetworkPanel />
            </ComingSoonOverlay>
          </TabsContent>
          <TabsContent value="actions" className="h-full mt-0 p-0">
            <ComingSoonOverlay
              title="User Actions"
              subtitle="Track clicks, inputs, and interactions to understand user behavior."
            >
              <ActionsPanel />
            </ComingSoonOverlay>
          </TabsContent>
          <TabsContent value="backend" className="h-full mt-0 p-0">
            <ComingSoonOverlay
              title="Backend Logs"
              subtitle="Correlate frontend sessions with server-side logs and traces."
            >
              <BackendPanel />
            </ComingSoonOverlay>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
