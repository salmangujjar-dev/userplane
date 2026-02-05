'use client';

import NextImage from 'next/image';

import { useFavicon } from '@/hooks/use-favicon';

interface LinkReferenceInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

/**
 * Input component for link references (tickets, issues, URLs, customer refs, etc.)
 * Automatically displays a favicon when a valid URL is detected in the input
 * Supports any text input - favicon is only shown if a URL is found
 * Debounces favicon fetching to prevent excessive API calls
 */
export function LinkReferenceInput({
  id,
  value,
  onChange,
  placeholder = 'Enter URL or reference',
  className = 'w-full rounded-lg bg-muted py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
  debounceMs = 300,
}: LinkReferenceInputProps) {
  const { faviconUrl, handleFaviconError } = useFavicon(value, { debounceMs });

  return (
    <div className="relative">
      {faviconUrl && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded bg-background border shadow-sm">
          <NextImage
            src={faviconUrl}
            alt="Site favicon"
            width={16}
            height={16}
            className="w-4 h-4 object-contain"
            onError={handleFaviconError}
          />
        </div>
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} ${faviconUrl ? 'pl-12 pr-4' : 'px-4'}`}
      />
    </div>
  );
}
