import { useState } from 'react';
import {
  X,
  FileCode,
  FileText,
  Image,
  FileVideo,
  FileType,
  Globe,
  Cable,
  FileJson,
  File,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@workspace/ui/components/tabs';
import {
  NetworkRequest,
  formatBytes,
  formatTime,
  getStatusColor,
  ResourceType,
} from './network-types';

interface NetworkEntryProps {
  request: NetworkRequest;
  recordingStartTime?: number;
}

export function NetworkEntry({ request, recordingStartTime }: NetworkEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isStaticAsset = ['Script', 'Stylesheet', 'Image', 'Font', 'Media'].includes(request.type);

  const getTypeIcon = (type: ResourceType) => {
    const iconClass = 'h-4 w-4';
    switch (type) {
      case 'Script':
        return <FileCode className={`${iconClass} text-yellow-600 dark:text-yellow-400`} />;
      case 'Stylesheet':
        return <FileText className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
      case 'Image':
        return <Image className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
      case 'Media':
        return <FileVideo className={`${iconClass} text-pink-600 dark:text-pink-400`} />;
      case 'Font':
        return <FileType className={`${iconClass} text-green-600 dark:text-green-400`} />;
      case 'XHR':
      case 'Fetch':
        return <Globe className={`${iconClass} text-orange-600 dark:text-orange-400`} />;
      case 'WebSocket':
        return <Cable className={`${iconClass} text-cyan-600 dark:text-cyan-400`} />;
      case 'Document':
        return <FileJson className={`${iconClass} text-red-600 dark:text-red-400`} />;
      default:
        return <File className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const getRecordingTime = () => {
    if (!recordingStartTime) return '00:00';
    const elapsed = request.timestamp - recordingStartTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      const fileName = parts[parts.length - 1] || urlObj.hostname;
      return fileName.length > 0 ? fileName : urlObj.hostname;
    } catch {
      return url;
    }
  };

  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  };

  const recordingTime = getRecordingTime();
  const fileName = getFileName(request.url);
  const domain = getDomain(request.url);
  const statusColor = request.status ? getStatusColor(request.status) : 'text-muted-foreground';

  return (
    <>
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          setShowDetails(!showDetails);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/50 text-left border-b border-border/50 ${showDetails ? 'bg-muted/30' : ''}`}
      >
        <span className="text-muted-foreground shrink-0 tabular-nums w-12">{recordingTime}</span>

        <div className="shrink-0">{getTypeIcon(request.type)}</div>

        <div className="flex-1 min-w-0">
          <div className="truncate font-medium">{fileName}</div>
          <div className="truncate text-[10px] text-muted-foreground">{domain}</div>
        </div>

        <div className={`w-12 text-center shrink-0 font-medium tabular-nums ${statusColor}`}>
          {request.status || '-'}
        </div>

        <div className="w-20 text-right shrink-0 tabular-nums text-muted-foreground">
          {formatTime(request.time)}
        </div>
      </button>

      {showDetails && (
        <div className="border-b border-border bg-background p-4">
          <Tabs defaultValue="headers" className="w-full">
            <div className="flex items-center justify-between border-b">
              <TabsList className="justify-start bg-transparent p-0 h-auto gap-6 border-0">
                <TabsTrigger
                  value="headers"
                  className="rounded-none border-0 bg-transparent px-0 pb-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground"
                >
                  Headers
                </TabsTrigger>
                <TabsTrigger
                  value="request"
                  className="rounded-none border-0 bg-transparent px-0 pb-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground"
                >
                  Request
                </TabsTrigger>
                <TabsTrigger
                  value="response"
                  className="rounded-none border-0 bg-transparent px-0 pb-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground"
                >
                  Response
                </TabsTrigger>
              </TabsList>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setIsExpanded(false);
                }}
                className="hover:bg-muted rounded p-1 mb-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <TabsContent value="headers" className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="font-medium text-sm">General</div>
                <div className="pl-4 space-y-1 text-xs">
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-muted-foreground">Request URL:</span>
                    <span className="break-all">{request.url}</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-muted-foreground">Request Method:</span>
                    <span>{request.method}</span>
                  </div>
                  {request.status && (
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <span className="text-muted-foreground">Status Code:</span>
                      <span className={statusColor}>
                        {request.status} {request.statusText}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-muted-foreground">Resource Type:</span>
                    <span>{request.type}</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{formatBytes(request.size)}</span>
                  </div>
                  {request.response?.remoteIPAddress && (
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <span className="text-muted-foreground">Remote Address:</span>
                      <span>
                        {request.response.remoteIPAddress}:{request.response.remotePort}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {request.response?.headers && (
                <div className="space-y-2">
                  <div className="font-medium text-sm">Response Headers</div>
                  <div className="pl-4 space-y-1 text-xs font-mono">
                    {Object.entries(request.response.headers).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[140px_1fr] gap-2">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.request.headers && (
                <div className="space-y-2">
                  <div className="font-medium text-sm">Request Headers</div>
                  <div className="pl-4 space-y-1 text-xs font-mono">
                    {Object.entries(request.request.headers).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[140px_1fr] gap-2">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="break-all">{value}</span>
                      </div>
                    ))}
                  </div>
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
                  {request.request.postData ? (
                    <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-96">
                      {request.request.postData}
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
                  {request.responseBody ? (
                    <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-96">
                      {request.responseBody}
                    </pre>
                  ) : (
                    <div className="text-sm text-muted-foreground">No response body</div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}
