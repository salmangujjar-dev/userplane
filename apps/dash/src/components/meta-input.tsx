'use client';

import { LINK_META } from '@userplane/contract';
import { Button } from '@userplane/ui/components/button';
import { Input } from '@userplane/ui/components/input';
import { Plus, X } from 'lucide-react';

export interface MetaEntry {
  key: string;
  value: string;
}

interface MetaInputProps {
  value: MetaEntry[];
  onChange: (entries: MetaEntry[]) => void;
  disabled?: boolean;
  maxEntries?: number;
}

function MetaEmptyIllustration() {
  return (
    <div className="w-52 h-32 rounded-xl overflow-hidden bg-linear-to-br from-violet-100 via-purple-100 to-pink-100 p-3">
      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="h-5 rounded bg-violet-50 border border-violet-100 w-[38%] flex items-center px-1.5">
              <div className="h-1 bg-violet-200 rounded w-4/5" />
            </div>
            <div className="text-[8px] text-violet-300 font-bold">=</div>
            <div className="h-5 rounded bg-gray-50 border border-gray-100 flex-1 flex items-center px-1.5">
              <div className="h-1 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 rounded bg-purple-50 border border-purple-100 w-[38%] flex items-center px-1.5">
              <div className="h-1 bg-purple-200 rounded w-3/5" />
            </div>
            <div className="text-[8px] text-purple-300 font-bold">=</div>
            <div className="h-5 rounded bg-gray-50 border border-gray-100 flex-1 flex items-center px-1.5">
              <div className="h-1 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetaInput({
  value,
  onChange,
  disabled = false,
  maxEntries = LINK_META.MAX_ENTRIES,
}: MetaInputProps) {
  const handleAdd = () => {
    if (value.length >= maxEntries) return;
    onChange([...value, { key: '', value: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'key' | 'value', newValue: string) => {
    // Strip invalid characters from keys (only alphanumeric, hyphens, underscores allowed)
    const sanitized = field === 'key' ? newValue.replace(/[^a-zA-Z0-9_-]/g, '') : newValue;
    const updated = value.map((entry, i) =>
      i === index ? { ...entry, [field]: sanitized } : entry
    );
    onChange(updated);
  };

  return (
    <div className="flex flex-col min-h-[220px] gap-2">
      {value.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-4 px-4">
          <div className="relative mb-4">
            <MetaEmptyIllustration />
          </div>
          <Button
            type="button"
            size="default"
            variant="ghost"
            className="border border-input"
            onClick={handleAdd}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add metadata
          </Button>
        </div>
      ) : (
        value.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder="Key"
              value={entry.key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
            <Input
              placeholder="Value"
              value={entry.value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => handleRemove(index)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
      {value.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || value.length >= maxEntries}
          className="w-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add field
        </Button>
      )}
    </div>
  );
}

/** Convert MetaEntry[] to Record<string, string>, skipping empty keys */
export function metaEntriesToRecord(entries: MetaEntry[]): Record<string, string> | undefined {
  const filtered = entries.filter((e) => e.key.trim() !== '');
  if (filtered.length === 0) return undefined;
  return Object.fromEntries(filtered.map((e) => [e.key.trim(), e.value]));
}

/** Convert Record<string, string> | null to MetaEntry[] */
export function recordToMetaEntries(
  record: Record<string, string> | null | undefined
): MetaEntry[] {
  if (!record) return [];
  return Object.entries(record).map(([key, value]) => ({ key, value }));
}
