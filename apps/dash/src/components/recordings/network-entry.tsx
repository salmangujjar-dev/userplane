import { Table, TableBody, TableCell, TableRow } from '@userplane/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@userplane/ui/components/tabs';
import { cn } from '@userplane/ui/lib/utils';
import {
  Cable,
  File,
  FileCode,
  FileText,
  FileType,
  FileVideo,
  Globe,
  Image,
  Play,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { RecordingNetworkLog } from './network-types';
import { formatTime, getStatusColor } from './network-types';
import { useRecordingPlayerSeek } from './recording-player-context';
import { getRecordingTime } from './recording-time-utils';

const tabTriggerClass =
  'rounded-none border-0 bg-transparent px-0 pb-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground';

function getFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const fileName = parts[parts.length - 1] || urlObj.hostname;
    return fileName.length > 0 ? fileName : urlObj.hostname;
  } catch {
    return url;
  }
}

function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

function formatRequestBody(requestBody: RecordingNetworkLog['requestBody']): string | null {
  if (!requestBody) return null;
  const body = requestBody.body;
  if (body === null || body === undefined) return null;
  if (typeof body === 'string') return body;
  return JSON.stringify(body, null, 2);
}

function formatResponseBody(responseBody: RecordingNetworkLog['responseBody']): string | null {
  if (responseBody === null || responseBody === undefined) return null;
  if (typeof responseBody === 'string') return responseBody;
  return JSON.stringify(responseBody, null, 2);
}

function NetworkTypeIcon({ type, mimeType }: { type: string; mimeType: string }) {
  const iconClass = 'h-4 w-4';
  const t = type.toLowerCase();
  const m = mimeType.toLowerCase();

  if (t === 'fetch' || t === 'xhr' || t === 'xmlhttprequest')
    return <Globe className={`${iconClass} text-orange-600 dark:text-orange-400`} />;
  if (t === 'websocket')
    return <Cable className={`${iconClass} text-cyan-600 dark:text-cyan-400`} />;
  if (t === 'script' || m.includes('javascript'))
    return <FileCode className={`${iconClass} text-yellow-600 dark:text-yellow-400`} />;
  if (t === 'link' || t === 'css' || m.includes('css'))
    return <FileText className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
  if (t === 'img' || m.includes('image'))
    return <Image className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
  if (t === 'video' || t === 'audio' || m.includes('video') || m.includes('audio'))
    return <FileVideo className={`${iconClass} text-pink-600 dark:text-pink-400`} />;
  if (m.includes('font') || m.includes('woff') || m.includes('ttf'))
    return <FileType className={`${iconClass} text-green-600 dark:text-green-400`} />;

  return <File className={`${iconClass} text-muted-foreground`} />;
}

interface NetworkDetailPanelProps {
  request: RecordingNetworkLog;
  statusColor: string;
  isStaticAsset: boolean;
  seekSeconds?: number;
  onClose: () => void;
}

function NetworkDetailPanel({
  request,
  statusColor,
  isStaticAsset,
  seekSeconds,
  onClose,
}: NetworkDetailPanelProps) {
  const playerContext = useRecordingPlayerSeek();
  const requestBodyStr = formatRequestBody(request.requestBody);
  const responseBodyStr = formatResponseBody(request.responseBody);

  return (
    <div className="border-b border-border bg-background p-4">
      <Tabs defaultValue="headers" className="w-full">
        <div className="flex items-center justify-between border-b">
          <TabsList className="justify-start bg-transparent p-0 h-auto gap-6 border-0">
            <TabsTrigger value="headers" className={tabTriggerClass}>
              Headers
            </TabsTrigger>
            <TabsTrigger value="request" className={tabTriggerClass}>
              Request
            </TabsTrigger>
            <TabsTrigger value="response" className={tabTriggerClass}>
              Response
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1">
            {playerContext && seekSeconds !== undefined && (
              <button
                onClick={() => playerContext.seekTo(seekSeconds)}
                title="Jump to this point in recording"
                className="hover:bg-muted rounded p-1 mb-2"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={onClose} className="hover:bg-muted rounded p-1 mb-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <TabsContent value="headers" className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-medium">General</div>
            <Table className="text-xs">
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground w-[140px]">Request URL</TableCell>
                  <TableCell className="break-all whitespace-normal">{request.url}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Request Method</TableCell>
                  <TableCell>{request.method}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Status Code</TableCell>
                  <TableCell className={statusColor}>
                    {request.status} {request.statusText}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Type</TableCell>
                  <TableCell>{request.type}</TableCell>
                </TableRow>
                {request.protocol && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">Protocol</TableCell>
                    <TableCell>{request.protocol}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {Object.keys(request.responseHeaders).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium">Response Headers</div>
              <Table className="text-xs">
                <TableBody>
                  {Object.entries(request.responseHeaders).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="text-muted-foreground w-[140px]">{key}</TableCell>
                      <TableCell className="break-all whitespace-normal">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {Object.keys(request.requestHeaders).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium">Request Headers</div>
              <Table className="text-xs">
                <TableBody>
                  {Object.entries(request.requestHeaders).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="text-muted-foreground w-[140px]">{key}</TableCell>
                      <TableCell className="break-all whitespace-normal">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="request" className="mt-4">
          {isStaticAsset ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-sm font-medium">Request body unavailable</div>
              <div className="text-xs text-muted-foreground">
                The request is for a static asset and its request body cannot be captured
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {requestBodyStr ? (
                <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-96">
                  {requestBodyStr}
                </pre>
              ) : (
                <div className="text-sm text-muted-foreground">No request body</div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="response" className="mt-4">
          {isStaticAsset ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-sm font-medium">Response body unavailable</div>
              <div className="text-xs text-muted-foreground">
                The request is for a static asset and its response body cannot be captured
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {responseBodyStr ? (
                <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-96">
                  {responseBodyStr}
                </pre>
              ) : (
                <div className="text-sm text-muted-foreground">No response body</div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NetworkEntryProps {
  request: RecordingNetworkLog;
  recordingStartTime?: number;
  isFocused?: boolean;
}

export function NetworkEntry({ request, recordingStartTime, isFocused }: NetworkEntryProps) {
  const [showDetails, setShowDetails] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const isStaticAsset = !request.isContentAllowed;
  const recordingTime = getRecordingTime(request.timestamp, recordingStartTime);
  const seekSeconds =
    recordingStartTime != null
      ? Math.max(0, (request.timestamp - recordingStartTime) / 1000)
      : undefined;
  const fileName = getFileName(request.url);
  const domain = getDomain(request.url);
  const statusColor = getStatusColor(request.status);

  useEffect(() => {
    if (isFocused) {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isFocused]);

  return (
    <div
      ref={rowRef}
      className={cn(
        'transition-colors duration-700',
        isFocused && 'bg-yellow-100/80 dark:bg-yellow-500/15'
      )}
    >
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/50 text-left border-b border-border/50 ${showDetails ? 'bg-muted/30' : ''}`}
      >
        <span className="text-muted-foreground shrink-0 tabular-nums w-12">{recordingTime}</span>

        <div className="shrink-0">
          <NetworkTypeIcon type={request.type} mimeType={request.mimeType} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="truncate font-medium">{fileName}</div>
          <div className="truncate text-[10px] text-muted-foreground">{domain}</div>
        </div>

        <div className={`w-12 text-center shrink-0 font-medium tabular-nums ${statusColor}`}>
          {request.status || '-'}
        </div>

        <div className="w-20 text-right shrink-0 tabular-nums text-muted-foreground">
          {formatTime(request.duration)}
        </div>
      </button>

      {showDetails && (
        <NetworkDetailPanel
          request={request}
          statusColor={statusColor}
          isStaticAsset={isStaticAsset}
          seekSeconds={seekSeconds}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}
