import { Table, TableBody, TableCell, TableRow } from '@workspace/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  LogIn,
  LogOut,
  MousePointer2,
  Pause,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import { useState } from 'react';

import type { RecordingActionLog, UserActionData } from './action-types';
import { formatActionLabel, formatActionTarget } from './action-types';

const tabTriggerClass =
  'rounded-none border-0 bg-transparent px-0 pb-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-foreground';

const KNOWN_DATA_KEYS = new Set([
  'action',
  'url',
  'title',
  'from',
  'to',
  'triggeredBy',
  'method',
  'tabId',
  'info',
]);

function getRecordingTime(eventTimestamp: number, recordingStartTime?: number): string {
  if (!recordingStartTime) return '00:00';
  const elapsed = eventTimestamp - recordingStartTime;
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getExtraFields(data: UserActionData): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!KNOWN_DATA_KEYS.has(key) && value !== undefined && value !== null) {
      extras[key] = value;
    }
  }
  return extras;
}

function ActionIcon({ action }: { action: RecordingActionLog }) {
  const iconClass = 'h-4 w-4';
  switch (action.data.action) {
    case 'click':
      return <MousePointer2 className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
    case 'navigate':
      return <Globe className={`${iconClass} text-green-600 dark:text-green-400`} />;
    case 'spa_route':
      return <RefreshCw className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
    case 'tab_activated':
      return <Eye className={`${iconClass} text-cyan-600 dark:text-cyan-400`} />;
    case 'tab_deactivated':
      return <EyeOff className={`${iconClass} text-gray-500`} />;
    case 'tab_switch':
      return <ArrowRight className={`${iconClass} text-orange-600 dark:text-orange-400`} />;
    case 'init_page':
      return <LogIn className={`${iconClass} text-green-600 dark:text-green-400`} />;
    case 'page_unload':
      return <LogOut className={`${iconClass} text-red-600 dark:text-red-400`} />;
    case 'recorder-pause':
      return <Pause className={`${iconClass} text-yellow-600 dark:text-yellow-400`} />;
    case 'recorder-resume':
      return <Play className={`${iconClass} text-green-600 dark:text-green-400`} />;
    default:
      return <MousePointer2 className={`${iconClass} text-muted-foreground`} />;
  }
}

function ActionSubtitle({ action, data }: { action: string; data: UserActionData }) {
  if (action === 'click' && data.url) {
    return <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{data.url}</div>;
  }

  if ((action === 'navigate' || action === 'spa_route') && (data.from || data.to)) {
    return (
      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
        {data.from && data.to ? (
          <>
            {data.from} → {data.to}
          </>
        ) : (
          data.to || data.url
        )}
      </div>
    );
  }

  if (action === 'init_page' && data.url) {
    return <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{data.url}</div>;
  }

  return null;
}

interface ActionDetailPanelProps {
  action: RecordingActionLog;
  targetHTML: string;
  extraFields: Record<string, unknown>;
  onClose: () => void;
}

function ActionDetailPanel({ action, targetHTML, extraFields, onClose }: ActionDetailPanelProps) {
  const hasElement = !!action.data.info;
  const hasNavigation = !!(action.data.from || action.data.to);
  const hasExtra = Object.keys(extraFields).length > 0;

  return (
    <div className="border-b border-border bg-background p-4">
      <Tabs defaultValue="details" className="w-full">
        <div className="flex items-center justify-between border-b">
          <TabsList className="justify-start bg-transparent p-0 h-auto gap-6 border-0">
            <TabsTrigger value="details" className={tabTriggerClass}>
              Details
            </TabsTrigger>
            {hasElement && (
              <TabsTrigger value="element" className={tabTriggerClass}>
                Element
              </TabsTrigger>
            )}
            {hasNavigation && (
              <TabsTrigger value="navigation" className={tabTriggerClass}>
                Navigation
              </TabsTrigger>
            )}
            {hasExtra && (
              <TabsTrigger value="data" className={tabTriggerClass}>
                Data
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
                <TableCell className="text-muted-foreground w-[140px]">Action</TableCell>
                <TableCell>{action.data.action}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Timestamp</TableCell>
                <TableCell>{new Date(action.timestamp).toISOString()}</TableCell>
              </TableRow>
              {action.data.url && (
                <TableRow>
                  <TableCell className="text-muted-foreground">URL</TableCell>
                  <TableCell className="break-all whitespace-normal">{action.data.url}</TableCell>
                </TableRow>
              )}
              {action.data.title && (
                <TableRow>
                  <TableCell className="text-muted-foreground">Page Title</TableCell>
                  <TableCell className="break-all whitespace-normal">{action.data.title}</TableCell>
                </TableRow>
              )}
              {action.data.method && (
                <TableRow>
                  <TableCell className="text-muted-foreground">Method</TableCell>
                  <TableCell>{action.data.method}</TableCell>
                </TableRow>
              )}
              {action.data.triggeredBy && (
                <TableRow>
                  <TableCell className="text-muted-foreground">Triggered By</TableCell>
                  <TableCell>{action.data.triggeredBy}</TableCell>
                </TableRow>
              )}
              {action.data.tabId && (
                <TableRow>
                  <TableCell className="text-muted-foreground">Tab ID</TableCell>
                  <TableCell className="break-all whitespace-normal">{action.data.tabId}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {hasElement && (
          <TabsContent value="element" className="mt-4">
            <Table className="text-xs">
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground w-[140px]">Tag</TableCell>
                  <TableCell>{action.data.info!.tagName}</TableCell>
                </TableRow>
                {action.data.info!.id && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">ID</TableCell>
                    <TableCell className="break-all whitespace-normal">
                      {action.data.info!.id}
                    </TableCell>
                  </TableRow>
                )}
                {action.data.info!.classList.length > 0 && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">Classes</TableCell>
                    <TableCell className="break-all whitespace-normal">
                      {action.data.info!.classList.join(' ')}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="text-muted-foreground">Selector</TableCell>
                  <TableCell className="break-all whitespace-normal">{targetHTML}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        )}

        {hasNavigation && (
          <TabsContent value="navigation" className="mt-4">
            <Table className="text-xs">
              <TableBody>
                {action.data.from && (
                  <TableRow>
                    <TableCell className="text-muted-foreground w-[140px]">From</TableCell>
                    <TableCell className="break-all whitespace-normal">
                      {action.data.from}
                    </TableCell>
                  </TableRow>
                )}
                {action.data.to && (
                  <TableRow>
                    <TableCell className="text-muted-foreground">To</TableCell>
                    <TableCell className="break-all whitespace-normal">{action.data.to}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        )}

        {hasExtra && (
          <TabsContent value="data" className="mt-4">
            <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-48">
              {JSON.stringify(extraFields, null, 2)}
            </pre>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface ActionEntryProps {
  action: RecordingActionLog;
  recordingStartTime?: number;
}

export function ActionEntry({ action, recordingStartTime }: ActionEntryProps) {
  const [showDetails, setShowDetails] = useState(false);

  const recordingTime = getRecordingTime(action.timestamp, recordingStartTime);
  const label = formatActionLabel(action.data.action);
  const targetHTML = action.data.info ? formatActionTarget(action.data) : '';
  const extraFields = getExtraFields(action.data);

  return (
    <>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`w-full flex items-start gap-3 px-3 py-2 text-xs hover:bg-muted/50 text-left border-b border-border/50 ${showDetails ? 'bg-muted/30' : ''}`}
      >
        <span className="text-muted-foreground shrink-0 tabular-nums w-12">{recordingTime}</span>

        <div className="shrink-0 mt-0.5">
          <ActionIcon action={action} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{label}</span>
            {targetHTML && <span className="text-muted-foreground truncate">{targetHTML}</span>}
          </div>
          <ActionSubtitle action={action.data.action} data={action.data} />
        </div>
      </button>

      {showDetails && (
        <ActionDetailPanel
          action={action}
          targetHTML={targetHTML}
          extraFields={extraFields}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}
