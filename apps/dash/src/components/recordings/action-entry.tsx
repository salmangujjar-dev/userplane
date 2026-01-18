import { MousePointer2 } from 'lucide-react';

import { ClickEvent, formatClickTarget } from './action-types';

interface ActionEntryProps {
  click: ClickEvent;
  recordingStartTime?: number;
}

export function ActionEntry({ click, recordingStartTime }: ActionEntryProps) {
  const getRecordingTime = () => {
    if (!recordingStartTime) return '00:00';
    const elapsed = click.timestamp - recordingStartTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const recordingTime = getRecordingTime();
  const targetHTML = formatClickTarget(click.target);

  return (
    <div className="flex items-start gap-3 px-3 py-2 text-xs hover:bg-muted/50 border-b border-border/50 font-mono">
      <span className="text-muted-foreground shrink-0 tabular-nums w-12">{recordingTime}</span>

      <div className="shrink-0 mt-0.5">
        <MousePointer2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">Clicked</span>
          <span className="text-muted-foreground truncate">{targetHTML}</span>
        </div>

        {click.target.textContent && (
          <div className="text-[10px] text-muted-foreground mt-0.5">
            &quot;{click.target.textContent}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
