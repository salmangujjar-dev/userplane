'use client';

import { cn } from '@userplane/ui/lib/utils';
import { GripVerticalIcon } from 'lucide-react';
import * as React from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';

/**
 * v4 dropped the `data-panel-group-direction` attribute the handle styles key
 * off of, and exposes no context carrying the group's orientation. The group
 * republishes it so `ResizableHandle` can keep styling itself.
 */
const ResizableOrientationContext =
  React.createContext<ResizablePrimitive.Orientation>('horizontal');

function ResizablePanelGroup({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) {
  return (
    <ResizableOrientationContext.Provider value={orientation}>
      <ResizablePrimitive.Group
        data-slot="resizable-panel-group"
        data-panel-group-direction={orientation}
        orientation={orientation}
        // `display` and `flex-direction` are owned by the group itself in v4.
        className={cn('h-full w-full', className)}
        {...props}
      />
    </ResizableOrientationContext.Provider>
  );
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  children,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
  children?: React.ReactNode;
}) {
  const orientation = React.useContext(ResizableOrientationContext);

  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      data-panel-group-direction={orientation}
      className={cn(
        'bg-transparent focus-visible:ring-ring relative flex w-2 items-center justify-center border-l-2 border-dotted border-border after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-2 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:border-l-0 data-[panel-group-direction=vertical]:border-t-2 data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-4 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        className
      )}
      {...props}
    >
      {children ??
        (withHandle && (
          <div className="bg-background border-border z-10 flex h-8 w-4 items-center justify-center rounded-sm border shadow-sm">
            <GripVerticalIcon className="size-3 text-muted-foreground" />
          </div>
        ))}
    </ResizablePrimitive.Separator>
  );
}

export type { PanelImperativeHandle, PanelSize } from 'react-resizable-panels';
export { usePanelRef } from 'react-resizable-panels';
export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
