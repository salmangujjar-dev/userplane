import { Table, TableBody, TableCell, TableRow } from '@userplane/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@userplane/ui/components/tabs';
import { AlertCircle, AlertTriangle, Bug, ChevronRight, Info, Skull, X } from 'lucide-react';
import { useState } from 'react';

import type { BackendLogLevel, RecordingBackendLog } from './backend-log-types';

const tabTriggerClass =
  'rounded-none border-0 bg-transparent px-0 pb-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground';

function getRecordingTime(eventTimestamp: number, recordingStartTime?: number): string {
  if (!recordingStartTime) return '00:00';
  const elapsed = eventTimestamp - recordingStartTime;
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getLevelColor(level: BackendLogLevel): string {
  switch (level) {
    case 'error':
      return 'text-red-500';
    case 'fatal':
      return 'text-red-700 dark:text-red-400';
    case 'warn':
      return 'text-yellow-500';
    case 'info':
      return 'text-blue-500';
    case 'debug':
      return 'text-purple-500';
  }
}

function BackendLevelIcon({ level }: { level: BackendLogLevel }) {
  switch (level) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'fatal':
      return <Skull className="h-4 w-4 text-red-700 dark:text-red-400" />;
    case 'warn':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    case 'debug':
      return <Bug className="h-4 w-4 text-purple-500" />;
  }
}

interface BackendDetailPanelProps {
  log: RecordingBackendLog;
  onClose: () => void;
}

function BackendDetailPanel({ log, onClose }: BackendDetailPanelProps) {
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;
  const hasTrace = !!log.trace;
  const hasError = !!log.error;

  return (
    <div className="border-b border-border bg-background p-4">
      <Tabs defaultValue="details" className="w-full">
        <div className="flex items-center justify-between border-b">
          <TabsList className="justify-start bg-transparent p-0 h-auto gap-6 border-0">
            <TabsTrigger value="details" className={tabTriggerClass}>
              Details
            </TabsTrigger>
            {hasMetadata && (
              <TabsTrigger value="metadata" className={tabTriggerClass}>
                Metadata
              </TabsTrigger>
            )}
            {hasTrace && (
              <TabsTrigger value="trace" className={tabTriggerClass}>
                Trace
              </TabsTrigger>
            )}
            {hasError && (
              <TabsTrigger value="error" className={tabTriggerClass}>
                Error
              </TabsTrigger>
            )}
          </TabsList>
          <button onClick={onClose} className="hover:bg-muted rounded p-1 mb-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <TabsContent value="details" className="mt-4">
          <Table className="text-xs">
            <TableBody>
              <TableRow>
                <TableCell className="text-muted-foreground w-[140px]">Level</TableCell>
                <TableCell>{log.level}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Timestamp</TableCell>
                <TableCell>{new Date(log.timestamp).toISOString()}</TableCell>
              </TableRow>
              {log.service && (
                <TableRow>
                  <TableCell className="text-muted-foreground">Service</TableCell>
                  <TableCell>{log.service}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="text-muted-foreground">Message</TableCell>
                <TableCell className="break-all whitespace-normal">{log.message}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>

        {hasMetadata && (
          <TabsContent value="metadata" className="mt-4">
            <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </TabsContent>
        )}

        {hasTrace && (
          <TabsContent value="trace" className="mt-4">
            <Table className="text-xs">
              <TableBody>
                {log.trace!.traceId && (
                  <TableRow>
                    <TableCell className="text-muted-foreground w-[140px]">Trace ID</TableCell>
                    <TableCell className="break-all whitespace-normal">
                      {log.trace!.traceId}
                    </TableCell>
                  </TableRow>
                )}
                {log.trace!.spanId && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">Span ID</TableCell>
                    <TableCell className="break-all whitespace-normal">
                      {log.trace!.spanId}
                    </TableCell>
                  </TableRow>
                )}
                {log.trace!.parentSpanId && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">Parent Span ID</TableCell>
                    <TableCell className="break-all whitespace-normal">
                      {log.trace!.parentSpanId}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        )}

        {hasError && (
          <TabsContent value="error" className="mt-4 space-y-3">
            <Table className="text-xs">
              <TableBody>
                {log.error!.type && (
                  <TableRow>
                    <TableCell className="text-muted-foreground w-[140px]">Type</TableCell>
                    <TableCell>{log.error!.type}</TableCell>
                  </TableRow>
                )}
                {log.error!.message && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">Message</TableCell>
                    <TableCell className="break-all whitespace-normal">
                      {log.error!.message}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {log.error!.stack && (
              <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-64">
                {log.error!.stack}
              </pre>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface BackendLogEntryProps {
  log: RecordingBackendLog;
  recordingStartTime?: number;
}

export function BackendLogEntry({ log, recordingStartTime }: BackendLogEntryProps) {
  const [showDetails, setShowDetails] = useState(false);

  const recordingTime = getRecordingTime(log.timestamp, recordingStartTime);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`w-full flex items-start gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left ${showDetails ? 'bg-muted/30' : ''}`}
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 mt-0.5 transition-transform text-muted-foreground ${showDetails ? 'rotate-90' : ''}`}
        />
        <span className="text-muted-foreground shrink-0 mt-0.5 tabular-nums w-12">
          {recordingTime}
        </span>
        <div className="shrink-0 mt-0.5">
          <BackendLevelIcon level={log.level} />
        </div>

        <div className="flex-1">
          <div className="flex items-start gap-2 flex-wrap">
            <span className={`uppercase text-[10px] font-semibold ${getLevelColor(log.level)}`}>
              {log.level}
            </span>
            {log.service && (
              <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">[{log.service}]</span>
            )}
            <span>{log.message}</span>
          </div>
        </div>
      </button>

      {showDetails && <BackendDetailPanel log={log} onClose={() => setShowDetails(false)} />}
    </div>
  );
}
