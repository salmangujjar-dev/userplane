import { useState } from 'react';

import { cn } from '../utils';

export function JsonTree({
  data,
  defaultExpanded = false,
}: {
  data: Record<string, unknown>;
  defaultExpanded?: boolean;
}) {
  return (
    <div className="text-xs font-family-geist-mono space-y-0.5">
      {Object.entries(data).map(([key, value]) => (
        <JsonNode key={key} name={key} value={value} defaultExpanded={defaultExpanded} />
      ))}
    </div>
  );
}

function JsonNode({
  name,
  value,
  defaultExpanded,
}: {
  name: string;
  value: unknown;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isExpandable = value !== null && typeof value === 'object';

  if (!isExpandable) {
    return (
      <div className="flex gap-2 pl-4">
        <span className="text-muted-foreground">{name}:</span>
        <span
          className={cn(
            typeof value === 'string' && 'text-green-600',
            typeof value === 'number' && 'text-blue-600',
            typeof value === 'boolean' && 'text-amber-600',
            value === null && 'text-muted-foreground italic'
          )}
        >
          {value === null ? 'null' : typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 pl-1 hover:bg-accent/50 rounded w-full text-left cursor-pointer"
      >
        <svg
          className={cn(
            'size-3 transition-transform text-muted-foreground',
            expanded && 'rotate-90'
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-muted-foreground">{name}</span>
        <span className="text-muted-foreground/60">
          {Array.isArray(value) ? `[${value.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {expanded && (
        <div className="ml-3 border-l border-border pl-2">
          {entries.map(([k, v]) => (
            <JsonNode key={k} name={k} value={v} defaultExpanded={false} />
          ))}
        </div>
      )}
    </div>
  );
}
