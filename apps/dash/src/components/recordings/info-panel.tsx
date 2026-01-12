'use client';

import { format } from 'date-fns';
import { JsonViewer } from '@workspace/ui/components/json-viewer';
import { BoringAvatar } from '../shared/boring-avatar';

interface InfoPanelProps {
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
      createdAt: Date | string;
      updatedAt: Date | string;
    };
  };
}

export function InfoPanel({ recording }: InfoPanelProps) {
  const { meta } = recording;
  const systemMeta = meta.systemMeta;

  const hasSystemMeta = systemMeta && Object.keys(systemMeta).length > 0;
  const hasCustomMeta = meta.customMeta && Object.keys(meta.customMeta).length > 0;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* About */}
      <div>
        <h3 className="text-sm font-semibold mb-4">About</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Link Title</span>
            <span className="font-mono">{meta.link.title || 'Untitled'}</span>
          </div>
          {meta.project.title && (
            <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
              <span className="text-muted-foreground">Project Title</span>
              <span className="font-mono">{meta.project.title}</span>
            </div>
          )}
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Domain URL</span>
            <span className="font-mono truncate">{meta.domain.url}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Requested By</span>
            <div className="flex items-center gap-2">
              <BoringAvatar size={24} name={meta.creator.name} />
              <span className="font-mono">{meta.creator.name}</span>
            </div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Requested At</span>
            <span className="font-mono">
              {format(new Date(meta.createdAt), 'MMM dd, yyyy HH:mm:ss')}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata Section */}
      {(hasSystemMeta || hasCustomMeta) && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-4">Metadata</h3>
          <div className="space-y-3">
            {hasSystemMeta && (
              <div className="grid grid-cols-[140px_1fr] gap-4 text-sm items-start">
                <span className="text-muted-foreground">System Metadata</span>
                <JsonViewer
                  data={systemMeta}
                  rootName=""
                  defaultExpanded={false}
                  className="text-xs"
                />
              </div>
            )}
            {hasCustomMeta && (
              <div className="grid grid-cols-[140px_1fr] gap-4 text-sm items-start">
                <span className="text-muted-foreground">Custom Metadata</span>
                <JsonViewer
                  data={meta.customMeta}
                  rootName=""
                  defaultExpanded={false}
                  className="text-xs"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
