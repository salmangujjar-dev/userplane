import { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, MessageSquare, Bug, ChevronRight } from 'lucide-react';
import {
  ConsoleLogEvent,
  RemoteObject,
  formatRemoteObject,
  ConsoleAPIType,
} from './console-log-types';

interface ConsoleLogEntryProps {
  log: ConsoleLogEvent;
  recordingStartTime?: number;
}

export function ConsoleLogEntry({ log, recordingStartTime }: ConsoleLogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isObjectExpanded, setIsObjectExpanded] = useState(false);

  const getRecordingTime = () => {
    if (!recordingStartTime) return '00:00';
    const elapsed = log.event.timestamp - recordingStartTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getLevelIcon = (type: ConsoleAPIType) => {
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
  };

  const getLevelColor = (type: ConsoleAPIType) => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'log':
        return 'text-foreground';
      case 'debug':
        return 'text-purple-500';
      default:
        return 'text-foreground';
    }
  };

  const getValueColor = (obj: RemoteObject): string => {
    if (obj.subtype === 'null' || obj.type === 'undefined') {
      return 'text-gray-500';
    }

    switch (obj.type) {
      case 'string':
        return 'text-red-600 dark:text-red-400';
      case 'number':
      case 'bigint':
        return 'text-blue-600 dark:text-blue-400';
      case 'boolean':
        return 'text-purple-600 dark:text-purple-400';
      case 'function':
        return 'text-purple-600 dark:text-purple-400';
      case 'object':
        return 'text-foreground';
      default:
        return 'text-foreground';
    }
  };

  const hasExpandableContent = (obj: RemoteObject): boolean => {
    return obj.type === 'object' && !!obj.preview && obj.preview.properties.length > 0;
  };

  const renderLogValue = (obj: RemoteObject, index: number) => {
    const canExpand = hasExpandableContent(obj);
    const color = getValueColor(obj);

    if (canExpand) {
      return (
        <span key={index} className="inline-flex items-start">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setIsObjectExpanded(!isObjectExpanded);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                e.preventDefault();
                setIsObjectExpanded(!isObjectExpanded);
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
      return (
        <span key={index} className={color}>
          &quot;{formatRemoteObject(obj)}&quot;
        </span>
      );
    }

    return (
      <span key={index} className={color}>
        {formatRemoteObject(obj)}
      </span>
    );
  };

  const renderExpandedProperties = () => {
    if (!isObjectExpanded) return null;

    const firstArg = log.event.args[0];
    if (!firstArg?.preview?.properties) return null;

    return (
      <div className="ml-8 mt-1 space-y-0.5">
        {firstArg.preview.properties.map((prop) => (
          <div key={prop.name} className="text-xs">
            <span className="text-purple-600 dark:text-purple-400">{prop.name}</span>
            <span className="text-muted-foreground">: </span>
            <span
              className={
                prop.type === 'string'
                  ? 'text-red-600 dark:text-red-400'
                  : prop.type === 'number'
                    ? 'text-blue-600 dark:text-blue-400'
                    : prop.type === 'boolean'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-foreground'
              }
            >
              {prop.type === 'string' ? `"${prop.value}"` : prop.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const sourceLocation = log.event.stackTrace?.callFrames[0];
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
        <div className="shrink-0 mt-0.5">{getLevelIcon(log.event.type)}</div>

        <div className={`flex-1 ${getLevelColor(log.event.type)}`}>
          <div className="flex items-start gap-1 flex-wrap">
            {log.event.args.map((arg, index) => (
              <span key={index}>
                {renderLogValue(arg, index)}
                {index < log.event.args.length - 1 && (
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

          {renderExpandedProperties()}

          {log.event.stackTrace && log.event.stackTrace.callFrames.length > 0 && (
            <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1">
              <div className="font-medium">Stack trace:</div>
              {log.event.stackTrace.callFrames.map((frame, index) => (
                <div key={index} className="pl-2">
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
