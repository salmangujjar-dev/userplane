import { useState } from 'react';
import { ChevronRight, AlertCircle, AlertTriangle, Info, Bug, Skull } from 'lucide-react';
import { StructuredLog, LogLevel } from './backend-log-types';

interface BackendLogEntryProps {
  log: StructuredLog;
  recordingStartTime?: number;
}

export function BackendLogEntry({ log, recordingStartTime }: BackendLogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRecordingTime = () => {
    if (!recordingStartTime) return '00:00';
    const elapsed = log.timestamp - recordingStartTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getLevelIcon = (level: LogLevel) => {
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
  };

  const getLevelColor = (level: LogLevel) => {
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
  };

  const recordingTime = getRecordingTime();

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left"
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 mt-0.5 transition-transform text-muted-foreground ${isExpanded ? 'rotate-90' : ''}`}
        />
        <span className="text-muted-foreground shrink-0 mt-0.5 tabular-nums w-12">
          {recordingTime}
        </span>
        <div className="shrink-0 mt-0.5">{getLevelIcon(log.level)}</div>

        <div className={`flex-1 ${getLevelColor(log.level)}`}>
          <div className="flex items-start gap-2 flex-wrap">
            <span className="uppercase text-[10px] font-semibold">{log.level}</span>
            {log.service && (
              <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">[{log.service}]</span>
            )}
            <span>{log.message}</span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 ml-12 space-y-2 text-xs">
          <div className="text-[10px] text-muted-foreground">
            <div>Timestamp: {new Date(log.timestamp).toISOString()}</div>
            {log.service && <div>Service: {log.service}</div>}
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <div className="text-[10px] font-medium text-muted-foreground mb-1">Metadata:</div>
              <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-auto max-h-48">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          {log.trace && (
            <div>
              <div className="text-[10px] font-medium text-muted-foreground mb-1">Trace:</div>
              <div className="pl-2 text-[10px] space-y-0.5">
                {log.trace.traceId && <div>Trace ID: {log.trace.traceId}</div>}
                {log.trace.spanId && <div>Span ID: {log.trace.spanId}</div>}
                {log.trace.parentSpanId && <div>Parent Span ID: {log.trace.parentSpanId}</div>}
              </div>
            </div>
          )}

          {log.error && (
            <div>
              <div className="text-[10px] font-medium text-muted-foreground mb-1">Error:</div>
              <div className="pl-2 space-y-1">
                {log.error.type && <div className="text-[10px]">Type: {log.error.type}</div>}
                {log.error.message && (
                  <div className="text-[10px]">Message: {log.error.message}</div>
                )}
                {log.error.stack && (
                  <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-auto max-h-48">
                    {log.error.stack}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
