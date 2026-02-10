'use client';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@workspace/ui/components/input-group';
import { cn } from '@workspace/ui/lib/utils';
import { Search } from 'lucide-react';
import * as React from 'react';

// Standalone search input built on top of InputGroup.
// Renders a search icon at inline-start with an input field.
function SearchInput({
  className,
  inputClassName,
  ...props
}: React.ComponentProps<'input'> & {
  /** Additional class names applied to the outer InputGroup wrapper. */
  className?: string;
  /** Additional class names applied to the inner input element. */
  inputClassName?: string;
}) {
  return (
    <InputGroup className={cn(className)}>
      <InputGroupInput type="search" className={cn(inputClassName)} {...props} />
      <InputGroupAddon align="inline-start">
        <Search className="text-muted-foreground" />
      </InputGroupAddon>
    </InputGroup>
  );
}

export { SearchInput };
