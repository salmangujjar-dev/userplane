'use client';

import { cn } from '@userplane/ui/lib/utils';
import React from 'react';

interface ZendeskSubdomainInputProps {
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  className?: string;
  error?: boolean;
  id?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const ZendeskSubdomainInput = React.forwardRef<HTMLInputElement, ZendeskSubdomainInputProps>(
  (
    {
      value,
      onChange,
      suffix = '.zendesk.com',
      placeholder = 'your-company',
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
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div
        className={cn(
          'flex items-center w-full rounded-md border border-input bg-background text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          error && 'border-destructive',
          className
        )}
      >
        <input
          ref={ref}
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={disabled}
          className="flex-1 px-3 py-2 bg-transparent border-0 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <span className="border-l border-border px-3 py-2 text-sm text-muted-foreground select-none">
          {suffix}
        </span>
      </div>
    );
  }
);

ZendeskSubdomainInput.displayName = 'ZendeskSubdomainInput';
