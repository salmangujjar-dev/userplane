import { Table, TableBody, TableCell, TableRow } from '@userplane/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@userplane/ui/components/tabs';
import { cn } from '@userplane/ui/lib/utils';
import { AlertCircle, AlertTriangle, Bug, Info, MessageSquare, Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { RecordingConsoleLog, SerializedValue } from './console-log-types';
import { formatSerializedValue } from './console-log-types';
import { useRecordingPlayerSeek } from './recording-player-context';
import { getRecordingTime } from './recording-time-utils';

function formatDetailValue(value: SerializedValue): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.type === 'element') return formatSerializedValue(value);
    if (obj.type === 'function') return formatSerializedValue(value);
    if (obj.type === 'error') {
      const parts = [`${obj.name}: ${obj.message}`];
      if (obj.stack) parts.push(String(obj.stack));
      return parts.join('\n');
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function LogValueDisplay({ value }: { value: SerializedValue }) {
  const formatted = formatSerializedValue(value);
  return <span className="text-foreground">{formatted}</span>;
}

interface LevelIconProps {
  type: string;
}

function LevelIcon({ type }: LevelIconProps) {
  switch (type) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    case 'log':
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    case 'debug':
      return <Bug className="h-4 w-4 text-purple-500" />;
    default:
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  }
}

const tabTriggerClass =
  'rounded-none border-0 bg-transparent px-0 pb-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground';

interface ConsoleDetailPanelProps {
  log: RecordingConsoleLog;
  hasTrace: boolean;
  seekSeconds?: number;
  onClose: () => void;
}

function ConsoleDetailPanel({ log, hasTrace, seekSeconds, onClose }: ConsoleDetailPanelProps) {
  const playerContext = useRecordingPlayerSeek();
  return (
    <div className="border-b border-border bg-background p-4">
      <Tabs defaultValue="output" className="w-full">
        <div className="flex items-center justify-between border-b">
          <TabsList className="justify-start bg-transparent p-0 h-auto gap-6 border-0">
            <TabsTrigger value="output" className={tabTriggerClass}>
              Output
            </TabsTrigger>
            <TabsTrigger value="source" className={tabTriggerClass}>
              Source
            </TabsTrigger>
            {hasTrace && (
              <TabsTrigger value="trace" className={tabTriggerClass}>
                Stack Trace
              </TabsTrigger>
            )}
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

        <TabsContent value="output" className="mt-4">
          <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-64 space-y-0.5">
            {log.args.map((arg, pos) => (
              <div key={`detail-arg-${pos}`}>{formatDetailValue(arg)}</div>
            ))}
          </pre>
        </TabsContent>

        <TabsContent value="source" className="mt-4">
          <Table className="text-xs">
            <TableBody>
              <TableRow>
                <TableCell className="text-muted-foreground w-[140px]">Level</TableCell>
                <TableCell>{log.type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Timestamp</TableCell>
                <TableCell>{new Date(log.timestamp).toISOString()}</TableCell>
              </TableRow>
              {log.url && (
                <TableRow>
                  <TableCell className="text-muted-foreground">Source</TableCell>
                  <TableCell className="break-all whitespace-normal">{log.url}</TableCell>
                </TableRow>
              )}
              {log.isInitialConsoleLog && (
                <TableRow>
                  <TableCell className="text-muted-foreground">Origin</TableCell>
                  <TableCell>Initial page load</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="text-muted-foreground">Arguments</TableCell>
                <TableCell>{log.args.length}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>

        {hasTrace && (
          <TabsContent value="trace" className="mt-4">
            <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-64 space-y-0.5">
              {log.trace!.map((frame, i) => (
                <div key={i} className="text-muted-foreground hover:text-foreground">
                  {frame}
                </div>
              ))}
            </pre>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface ConsoleLogEntryProps {
  log: RecordingConsoleLog;
  recordingStartTime?: number;
  isFocused?: boolean;
}

export function ConsoleLogEntry({ log, recordingStartTime, isFocused }: ConsoleLogEntryProps) {
  const [showDetails, setShowDetails] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const recordingTime = getRecordingTime(log.timestamp, recordingStartTime);
  const hasTrace = !!(log.trace && log.trace.length > 0);
  const seekSeconds =
    recordingStartTime != null
      ? Math.max(0, (log.timestamp - recordingStartTime) / 1000)
      : undefined;

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
          <LevelIcon type={log.type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="truncate">
            {log.args.map((arg, pos) => (
              <span key={`arg-${pos}`}>
                <LogValueDisplay value={arg} />
                {pos < log.args.length - 1 && ' '}
              </span>
            ))}
          </div>
        </div>

        <div className="w-28 text-right shrink-0 truncate text-muted-foreground">{log.url}</div>
      </button>

      {showDetails && (
        <ConsoleDetailPanel
          log={log}
          hasTrace={hasTrace}
          seekSeconds={seekSeconds}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}
