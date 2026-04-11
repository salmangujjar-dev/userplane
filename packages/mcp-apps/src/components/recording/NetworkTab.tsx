import { useMemo, useState } from 'react';

import {
  cn,
  extractDomain,
  extractFilename,
  formatNetworkDuration,
  formatTimestamp,
} from '../../utils';
import { EmptyState, FilterPill, SearchInput } from '../shared';
import {
  CableIcon,
  ChevronRightIcon,
  FileCodeIcon,
  FileIcon,
  FileJsonIcon,
  FileTextIcon,
  FileTypeIcon,
  FileVideoIcon,
  GlobeIcon,
} from '../shared/icons';
import type { NetworkLogEntry } from './types';

interface NetworkTabProps {
  data: NetworkLogEntry[];
  recordingStartTime?: number;
}

const REQUEST_TYPES = [
  { type: 'fetch', label: 'Fetch/XHR', icon: GlobeIcon, color: 'text-orange-500' },
  { type: 'ws', label: 'WS', icon: CableIcon, color: 'text-cyan-500' },
  { type: 'js', label: 'JS', icon: FileCodeIcon, color: 'text-yellow-500' },
  { type: 'css', label: 'CSS', icon: FileTextIcon, color: 'text-blue-500' },
  { type: 'media', label: 'Media', icon: FileVideoIcon, color: 'text-pink-500' },
  { type: 'font', label: 'Font', icon: FileTypeIcon, color: 'text-green-500' },
  { type: 'doc', label: 'Doc', icon: FileJsonIcon, color: 'text-red-500' },
  { type: 'other', label: 'Other', icon: FileIcon, color: 'text-muted-foreground' },
] as const;

function getRequestTypeConfig(type: string) {
  // Map common initiator types to our categories
  const typeMap: Record<string, string> = {
    xmlhttprequest: 'fetch',
    fetch: 'fetch',
    websocket: 'ws',
    script: 'js',
    stylesheet: 'css',
    image: 'media',
    media: 'media',
    font: 'font',
    document: 'doc',
  };
  const category = typeMap[type.toLowerCase()] ?? 'other';
  return REQUEST_TYPES.find((t) => t.type === category) ?? REQUEST_TYPES[7];
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-600';
  if (status >= 300 && status < 400) return 'text-blue-600';
  if (status >= 400 && status < 500) return 'text-yellow-600';
  if (status >= 500) return 'text-red-600';
  return 'text-muted-foreground';
}

export function NetworkTab({ data, recordingStartTime }: NetworkTabProps) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return data.filter((entry) => {
      const typeConfig = getRequestTypeConfig(entry.type);
      if (activeFilters.size > 0 && !activeFilters.has(typeConfig.type)) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        const matchUrl = entry.url.toLowerCase().includes(searchLower);
        const matchMethod = entry.method.toLowerCase().includes(searchLower);
        const matchStatus = String(entry.status).includes(searchLower);
        if (!matchUrl && !matchMethod && !matchStatus) return false;
      }
      return true;
    });
  }, [data, activeFilters, search]);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={GlobeIcon}
        title="No network activity"
        description="No network requests were captured during this recording."
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-4 space-y-3 border-b">
        <SearchInput value={search} onChange={setSearch} placeholder="Search requests..." />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {REQUEST_TYPES.map((type) => (
            <FilterPill
              key={type.type}
              label={type.label}
              active={activeFilters.has(type.type)}
              onClick={() => toggleFilter(type.type)}
            />
          ))}
        </div>
      </div>

      {/* Request entries */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No matching requests</div>
        ) : (
          filtered.map((entry) => (
            <NetworkEntryRow
              key={entry.requestId}
              entry={entry}
              recordingStartTime={recordingStartTime}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Network entry row
// ---------------------------------------------------------------------------

function NetworkEntryRow({
  entry,
  recordingStartTime,
}: {
  entry: NetworkLogEntry;
  recordingStartTime?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'headers' | 'request' | 'response'>(
    'headers'
  );
  const typeConfig = getRequestTypeConfig(entry.type);
  const TypeIcon = typeConfig.icon;

  const filename = extractFilename(entry.url);
  const domain = extractDomain(entry.url);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 text-left transition-colors cursor-pointer"
      >
        {/* Timestamp */}
        <span className="text-xs font-family-geist-mono text-muted-foreground shrink-0 w-12">
          {formatTimestamp(entry.timestamp, recordingStartTime)}
        </span>

        {/* Type icon */}
        <TypeIcon className={cn('size-4 shrink-0', typeConfig.color)} />

        {/* URL info */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">{filename}</span>
          <span className="text-xs text-muted-foreground truncate block">{domain}</span>
        </div>

        {/* Status */}
        <span
          className={cn(
            'text-xs font-family-geist-mono font-medium shrink-0',
            getStatusColor(entry.status)
          )}
        >
          {entry.status}
        </span>

        {/* Duration */}
        <span className="text-xs font-family-geist-mono text-muted-foreground shrink-0 w-16 text-right">
          {formatNetworkDuration(entry.duration)}
        </span>

        {/* Expand */}
        <ChevronRightIcon
          className={cn(
            'size-4 text-muted-foreground shrink-0 transition-transform',
            expanded && 'rotate-90'
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 ml-[76px]">
          {/* Detail tabs */}
          <div className="flex gap-4 mb-2 border-b">
            {(['headers', 'request', 'response'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveDetailTab(tab)}
                className={cn(
                  'text-xs pb-2 capitalize transition-colors cursor-pointer',
                  activeDetailTab === tab
                    ? 'text-foreground border-b-2 border-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Detail content */}
          {activeDetailTab === 'headers' && (
            <div className="space-y-3">
              <HeaderSection title="General">
                <HeaderRow label="URL" value={entry.url} />
                <HeaderRow label="Method" value={entry.method} />
                <HeaderRow label="Status" value={`${entry.status} ${entry.statusText}`} />
                {entry.protocol && <HeaderRow label="Protocol" value={entry.protocol} />}
                <HeaderRow label="Type" value={entry.mimeType} />
              </HeaderSection>

              {Object.keys(entry.responseHeaders).length > 0 && (
                <HeaderSection title="Response Headers">
                  {Object.entries(entry.responseHeaders).map(([k, v]) => (
                    <HeaderRow key={k} label={k} value={v} />
                  ))}
                </HeaderSection>
              )}

              {Object.keys(entry.requestHeaders).length > 0 && (
                <HeaderSection title="Request Headers">
                  {Object.entries(entry.requestHeaders).map(([k, v]) => (
                    <HeaderRow key={k} label={k} value={v} />
                  ))}
                </HeaderSection>
              )}
            </div>
          )}

          {activeDetailTab === 'request' && (
            <BodyContent
              body={entry.requestBody}
              isContentAllowed={entry.isContentAllowed}
              emptyMessage="No request body"
            />
          )}

          {activeDetailTab === 'response' && (
            <BodyContent
              body={entry.responseBody}
              isContentAllowed={entry.isContentAllowed}
              emptyMessage="No response body"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function HeaderSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function HeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs font-family-geist-mono">
      <span className="text-muted-foreground shrink-0 min-w-[120px]">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}

function BodyContent({
  body,
  isContentAllowed,
  emptyMessage,
}: {
  body: unknown;
  isContentAllowed: boolean;
  emptyMessage: string;
}) {
  if (!isContentAllowed) {
    return (
      <p className="text-xs text-muted-foreground italic py-2">
        Content not available for static assets.
      </p>
    );
  }

  if (body === null || body === undefined) {
    return <p className="text-xs text-muted-foreground italic py-2">{emptyMessage}</p>;
  }

  const formatted = typeof body === 'string' ? body : JSON.stringify(body, null, 2);

  return (
    <pre className="text-xs font-family-geist-mono bg-muted/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-60">
      {formatted}
    </pre>
  );
}
