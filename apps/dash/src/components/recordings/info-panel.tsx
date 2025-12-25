'use client';

import { format } from 'date-fns';

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
  const { meta, recordingDurationMs } = recording;
  const systemMeta = meta.systemMeta;

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* System Metadata */}
      {systemMeta && Object.keys(systemMeta).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4">System Metadata</h3>
          <div className="space-y-3">
            {Object.entries(systemMeta).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[140px_1fr] gap-4 text-sm">
                <span className="text-muted-foreground">{key}</span>
                <span className="font-mono">{formatValue(value)}</span>
              </div>
            ))}
            <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-mono">{formatDuration(recordingDurationMs)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Custom Metadata */}
      {meta.customMeta && Object.keys(meta.customMeta).length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-4">Custom Metadata</h3>
          <div className="space-y-3">
            {Object.entries(meta.customMeta).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[140px_1fr] gap-4 text-sm">
                <span className="text-muted-foreground">{key}</span>
                <span className="font-mono">{formatValue(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link Metadata */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">Link Metadata</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Link Title</span>
            <span className="font-mono">{meta.link.title || 'Untitled'}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Requested By</span>
            <span className="font-mono">{meta.creator.name}</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-4 text-sm">
            <span className="text-muted-foreground">Requested At</span>
            <span className="font-mono">
              {format(new Date(meta.createdAt), 'MMM dd, yyyy HH:mm:ss')}
            </span>
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
        </div>
      </div>
    </div>
  );
}
