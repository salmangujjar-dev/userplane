import { AlertCircle, AlertTriangle, Bug, ChevronRight, Info, MessageSquare } from 'lucide-react';
import { useState } from 'react';

import {
  ConsoleAPIType,
  ConsoleLogEvent,
  formatRemoteObject,
  RemoteObject,
} from './console-log-types';

function hasExpandableContent(obj: RemoteObject): boolean {
  return obj.type === 'object' && !!obj.preview && obj.preview.properties.length > 0;
}

interface LogValueDisplayProps {
  obj: RemoteObject;
  isObjectExpanded: boolean;
  onToggleExpand: () => void;
}

function LogValueDisplay({ obj, isObjectExpanded, onToggleExpand }: LogValueDisplayProps) {
  const canExpand = hasExpandableContent(obj);
  const color = 'text-foreground';

  if (canExpand) {
    return (
      <span className="inline-flex items-start">
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              onToggleExpand();
            }
          }}
          className="hover:bg-muted/50 rounded px-0.5 cursor-pointer"
        >
          <ChevronRight
            className={`h-3 w-3 transition-transform inline-block ${isObjectExpanded ? 'rotate-90' : ''}`}
          />
        </span>
        <span className={color}>{formatRemoteObject(obj)}</span>
      </span>
    );
  }

  if (obj.type === 'string') {
    return <span className={color}>&quot;{formatRemoteObject(obj)}&quot;</span>;
  }

  return <span className={color}>{formatRemoteObject(obj)}</span>;
}

interface ExpandedPropertiesDisplayProps {
  isObjectExpanded: boolean;
  firstArg: RemoteObject | undefined;
}

function ExpandedPropertiesDisplay({ isObjectExpanded, firstArg }: ExpandedPropertiesDisplayProps) {
  if (!isObjectExpanded) return null;
  if (!firstArg?.preview?.properties) return null;

  return (
    <div className="ml-8 mt-1 space-y-0.5">
      {firstArg.preview.properties.map((prop) => (
        <div key={prop.name} className="text-xs">
          <span>{prop.name}</span>
          <span className="text-muted-foreground">: </span>
          <span>{prop.type === 'string' ? `"${prop.value}"` : prop.value}</span>
        </div>
      ))}
    </div>
  );
}

interface LevelIconProps {
  type: ConsoleAPIType;
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

function getRecordingTime(eventTimestamp: number, recordingStartTime?: number): string {
  if (!recordingStartTime) return '00:00';
  const elapsed = eventTimestamp - recordingStartTime;
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

interface ConsoleLogEntryProps {
  log: ConsoleLogEvent;
  recordingStartTime?: number;
}

export function ConsoleLogEntry({ log, recordingStartTime }: ConsoleLogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isObjectExpanded, setIsObjectExpanded] = useState(false);

  const sourceLocation = log.event.stackTrace?.callFrames[0];
  const recordingTime = getRecordingTime(log.event.timestamp, recordingStartTime);

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
        <div className="shrink-0 mt-0.5">
          <LevelIcon type={log.event.type} />
        </div>

        <div className="flex-1">
          <div className="flex items-start gap-1 flex-wrap">
            {log.event.args.map((arg, pos) => (
              <span key={`arg-${arg.type}-${pos}`}>
                <LogValueDisplay
                  obj={arg}
                  isObjectExpanded={isObjectExpanded}
                  onToggleExpand={() => setIsObjectExpanded(!isObjectExpanded)}
                />
                {pos < log.event.args.length - 1 && (
                  <span className="text-muted-foreground"> </span>
                )}
              </span>
            ))}
            {log.count !== undefined && log.count > 1 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded ml-1">
                {log.count}
              </span>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 ml-12 space-y-1">
          <div className="text-[10px] text-muted-foreground">
            <div>Timestamp: {log.timestamp}</div>
            {sourceLocation && (
              <div>
                Source: {sourceLocation.url}:{sourceLocation.lineNumber}:
                {sourceLocation.columnNumber}
              </div>
            )}
            {log.event.executionContextId && <div>Context ID: {log.event.executionContextId}</div>}
          </div>

          <ExpandedPropertiesDisplay
            isObjectExpanded={isObjectExpanded}
            firstArg={log.event.args[0]}
          />

          {log.event.stackTrace && log.event.stackTrace.callFrames.length > 0 && (
            <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1">
              <div className="font-medium">Stack trace:</div>
              {log.event.stackTrace.callFrames.map((frame) => (
                <div
                  key={`${frame.url}-${frame.lineNumber}-${frame.columnNumber}`}
                  className="pl-2"
                >
                  at {frame.functionName || '(anonymous)'} ({frame.url}:{frame.lineNumber}:
                  {frame.columnNumber})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
