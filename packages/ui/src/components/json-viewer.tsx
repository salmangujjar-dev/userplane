'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { Check, ChevronDown, ChevronRight, ChevronUp, Copy, MoreHorizontal } from 'lucide-react';
import * as React from 'react';

type JsonViewerProps = {
  data: unknown;
  rootName?: string;
  defaultExpanded?: boolean;
  className?: string;
};

export function JsonViewer({
  data,
  rootName = 'root',
  defaultExpanded = true,
  className,
}: JsonViewerProps) {
  return (
    <div className={cn('font-mono text-sm', className)}>
      <JsonNode name={rootName} data={data} isRoot={true} defaultExpanded={defaultExpanded} />
    </div>
  );
}

type JsonNodeProps = {
  name: string;
  data: unknown;
  isRoot?: boolean;
  defaultExpanded?: boolean;
  level?: number;
};

function JsonNode({
  name,
  data,
  isRoot = false,
  defaultExpanded = true,
  level = 0,
}: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [isCopied, setIsCopied] = React.useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const dataType = data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data;
  const isExpandable =
    data !== null &&
    data !== undefined &&
    !(data instanceof Date) &&
    (dataType === 'object' || dataType === 'array');
  const itemCount =
    isExpandable && data !== null && data !== undefined ? Object.keys(data as object).length : 0;

  return (
    <div className={cn('group/object pl-4', level > 0 && 'border-border border-l')}>
      <div
        className={cn(
          'hover:bg-muted/50 group/property -ml-4 flex cursor-pointer items-center gap-1 rounded px-1 py-1',
          isRoot && 'text-primary font-semibold'
        )}
        onClick={isExpandable ? handleToggle : undefined}
      >
        {isExpandable ? (
          <div className="flex h-4 w-4 items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
            )}
          </div>
        ) : (
          <div className="w-4" />
        )}

        <span className="text-primary">{name}</span>

        <span className="text-muted-foreground">
          {isExpandable ? (
            <>
              {dataType === 'array' ? '[' : '{'}
              {!isExpanded && (
                <span className="text-muted-foreground">
                  {' '}
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}{' '}
                  {dataType === 'array' ? ']' : '}'}
                </span>
              )}
            </>
          ) : (
            ':'
          )}
        </span>

        {!isExpandable && <JsonValue data={data} />}

        {!isExpandable && <div className="w-3.5" />}

        <button
          onClick={copyToClipboard}
          className="hover:bg-muted ml-auto rounded p-1 opacity-0 group-hover/property:opacity-100"
          title="Copy to clipboard"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="text-muted-foreground h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {isExpandable && isExpanded && data !== null && data !== undefined && (
        <div className="pl-4">
          {Object.keys(data as object).map((key) => (
            <JsonNode
              key={key}
              name={dataType === 'array' ? `${key}` : key}
              data={(data as Record<string, unknown>)[key]}
              level={level + 1}
              defaultExpanded={level < 1}
            />
          ))}
          <div className="text-muted-foreground py-1 pl-4">{dataType === 'array' ? ']' : '}'}</div>
        </div>
      )}
    </div>
  );
}

function JsonValue({ data }: { data: unknown }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const dataType = typeof data;
  const TEXT_LIMIT = 80;

  if (data === null) {
    return <span className="text-rose-500">null</span>;
  }

  if (data === undefined) {
    return <span className="text-muted-foreground">undefined</span>;
  }

  if (data instanceof Date) {
    return <span className="text-purple-500">{data.toISOString()}</span>;
  }

  switch (dataType) {
    case 'string': {
      const strData = data as string;
      if (strData.length > TEXT_LIMIT) {
        return (
          <div
            className="group relative flex flex-1 cursor-pointer items-center text-emerald-500"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {`"`}
            {isExpanded ? (
              <span className="inline-block max-w-full">{strData}</span>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block max-w-full">
                    {strData.substring(0, TEXT_LIMIT)}...
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-md wrap-break-word p-2 text-xs">
                  {strData}
                </TooltipContent>
              </Tooltip>
            )}
            {`"`}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+4px)] opacity-0 transition-opacity group-hover:opacity-100">
              {isExpanded ? (
                <ChevronUp className="text-muted-foreground h-3 w-3" />
              ) : (
                <MoreHorizontal className="text-muted-foreground h-3 w-3" />
              )}
            </div>
          </div>
        );
      }
      return <span className="text-emerald-500">{`"${strData}"`}</span>;
    }
    case 'number':
      return <span className="text-amber-500">{String(data)}</span>;
    case 'boolean':
      return <span className="text-blue-500">{String(data)}</span>;
    default:
      return <span>{String(data)}</span>;
  }
}
