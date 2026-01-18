'use client';

import { cn } from '@workspace/ui/lib/utils';
import React from 'react';

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  id?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

// Detect protocol and strip it from display value
const processUrl = (url: string): { protocol: 'http' | 'https'; cleanUrl: string } => {
  const httpMatch = url.match(/^http:\/\//i);
  const httpsMatch = url.match(/^https:\/\//i);

  let cleanUrl = url;
  let detectedProtocol: 'http' | 'https' = 'https';

  if (httpMatch) {
    detectedProtocol = 'http';
    cleanUrl = url.replace(/^http:\/\//i, '');
  } else if (httpsMatch) {
    detectedProtocol = 'https';
    cleanUrl = url.replace(/^https:\/\//i, '');
  }

  return { protocol: detectedProtocol, cleanUrl };
};

// Split URL into origin and path for styling
const splitUrlForDisplay = (url: string): { origin: string; path: string } => {
  const firstSlashIndex = url.indexOf('/');
  if (firstSlashIndex === -1) {
    return { origin: url, path: '' };
  }
  return {
    origin: url.substring(0, firstSlashIndex),
    path: url.substring(firstSlashIndex),
  };
};

export const URLInput = React.forwardRef<HTMLInputElement, URLInputProps>(
  (
    {
      value,
      onChange,
      placeholder = 'example.com',
      className,
      error,
      id,
      onKeyDown,
      disabled,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [protocol, setProtocol] = React.useState<'http' | 'https'>('https');
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Expose input ref to parent if provided
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Initialize protocol from value prop
    React.useEffect(() => {
      if (value) {
        const { protocol: detectedProtocol } = processUrl(value);
        setProtocol(detectedProtocol);
      }
    }, [value]);

    // Handle input changes and detect protocol
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Check if user explicitly typed a protocol
      const hasProtocol = inputValue.match(/^https?:\/\//i);

      let finalProtocol = protocol;
      let cleanUrl = inputValue;

      if (hasProtocol) {
        // User typed a protocol, extract it
        const { protocol: detectedProtocol, cleanUrl: extractedUrl } = processUrl(inputValue);
        finalProtocol = detectedProtocol;
        cleanUrl = extractedUrl;
        setProtocol(detectedProtocol);
      }

      // Return the full URL with the current protocol state
      const finalUrl = `${finalProtocol}://${cleanUrl}`;
      onChange(finalUrl);
    };

    const displayValue = processUrl(value).cleanUrl;

    // Toggle protocol button handler
    const toggleProtocol = () => {
      const newProtocol = protocol === 'https' ? 'http' : 'https';
      setProtocol(newProtocol);
      const finalUrl = `${newProtocol}://${displayValue}`;
      onChange(finalUrl);
    };

    const { origin, path } = splitUrlForDisplay(displayValue);

    return (
      <div
        className={cn(
          'flex items-center w-full rounded-md border border-input bg-background text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          error && 'border-destructive',
          className
        )}
      >
        <button
          type="button"
          onClick={toggleProtocol}
          className="flex items-center gap-2 border-r border-border pl-3 pr-3 py-2 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Switch to ${protocol === 'https' ? 'http' : 'https'}`}
          disabled={disabled}
        >
          {protocol === 'https' ? (
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          )}
          <span className="inline-block w-[60px] text-sm font-medium text-muted-foreground">
            {protocol}://
          </span>
        </button>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id={id}
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            disabled={disabled}
            className="w-full px-3 py-2 bg-transparent border-0 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-transparent"
            style={{ caretColor: 'var(--foreground)' }}
            {...props}
          />
          <div className="absolute inset-0 px-3 py-2 pointer-events-none flex items-center overflow-hidden">
            <span className="text-sm text-foreground">{origin}</span>
            <span className="text-sm text-muted-foreground">{path}</span>
          </div>
        </div>
      </div>
    );
  }
);

URLInput.displayName = 'URLInput';
