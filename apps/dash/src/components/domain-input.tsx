'use client';

import { cn } from '@workspace/ui/lib/utils';
import { Globe } from 'lucide-react';
import React from 'react';

interface DomainInputProps {
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

/**
 * Strips protocol from domain input if user accidentally types it
 * Returns clean domain name without http:// or https://
 */
const stripProtocol = (value: string): string => {
  return value.replace(/^https?:\/\//i, '').trim();
};

/**
 * Splits domain into parts for visual emphasis
 * Example: "subdomain.example.com" -> { main: "example.com", sub: "subdomain." }
 */
const splitDomain = (domain: string): { subdomain: string; mainDomain: string } => {
  const parts = domain.split('.');

  if (parts.length <= 2) {
    // No subdomain or simple domain
    return { subdomain: '', mainDomain: domain };
  }

  // Has subdomain - highlight main domain (last two parts)
  const mainDomain = parts.slice(-2).join('.');
  const subdomain = parts.slice(0, -2).join('.') + '.';

  return { subdomain, mainDomain };
};

export const DomainInput = React.forwardRef<HTMLInputElement, DomainInputProps>(
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
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Expose input ref to parent if provided
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Handle input changes and strip protocol if present
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cleanDomain = stripProtocol(inputValue);
      onChange(cleanDomain);
    };

    const displayValue = stripProtocol(value);
    const { subdomain, mainDomain } = splitDomain(displayValue);

    return (
      <div
        className={cn(
          'flex items-center w-full rounded-md border border-input bg-background text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          error && 'border-destructive',
          className
        )}
      >
        <div className="flex items-center gap-2 border-r border-border pl-3 pr-3 py-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
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
            {subdomain && <span className="text-sm text-muted-foreground">{subdomain}</span>}
            <span className="text-sm text-foreground">{mainDomain}</span>
          </div>
        </div>
      </div>
    );
  }
);

DomainInput.displayName = 'DomainInput';
