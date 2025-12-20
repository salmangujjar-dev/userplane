'use client';

import { useState } from 'react';
import { Check, ChevronDown, Search, X, LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Input } from '@workspace/ui/components/input';
import { cn } from '@workspace/ui/lib/utils';
import { BoringAvatar } from '@/components/shared/boring-avatar';

export interface FilterOption {
  value: string;
  label: string;
  avatar?: boolean;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  icon?: LucideIcon;
  showAvatars?: boolean;
  className?: string;
  singleSelect?: boolean;
  onSearchChange?: (query: string) => void;
  isSearching?: boolean;
}

export function FilterDropdown({
  label,
  options,
  selected,
  onSelectionChange,
  placeholder = 'Search...',
  icon: Icon,
  showAvatars = false,
  className,
  singleSelect = false,
  onSearchChange,
  isSearching = false,
}: FilterDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const filteredOptions = onSearchChange
    ? options
    : options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleToggle = (value: string) => {
    if (singleSelect) {
      onSelectionChange([value]);
      setOpen(false);
    } else {
      const newSelected = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      onSelectionChange(newSelected);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange([]);
  };

  const getDisplayLabel = () => {
    if (selected.length === 0) return label;
    if (selected.length === 1) {
      const selectedOption = options.find((opt) => opt.value === selected[0]);
      return selectedOption?.label || label;
    }
    return `${selected.length} ${label}`;
  };

  const renderTriggerIcon = () => {
    if (selected.length === 0) return null;

    const selectedOption =
      selected.length === 1 ? options.find((opt) => opt.value === selected[0]) : null;
    const firstTwoSelected = selected
      .slice(0, 2)
      .map((val) => options.find((opt) => opt.value === val))
      .filter(Boolean);

    if (selected.length === 1 && selectedOption) {
      if (showAvatars && selectedOption.avatar) {
        return <BoringAvatar name={selectedOption.label} size={16} className="shrink-0" />;
      }
      if (Icon) {
        return <Icon className="h-3.5 w-3.5 shrink-0" />;
      }
      return null;
    }

    if (selected.length > 1) {
      if (showAvatars && firstTwoSelected[0]?.avatar) {
        return (
          <div className="flex -space-x-1 shrink-0">
            {firstTwoSelected.slice(0, 2).map((opt, idx) => (
              <BoringAvatar
                key={idx}
                name={opt?.label || ''}
                size={16}
                className="ring-1 ring-background"
              />
            ))}
          </div>
        );
      }
      if (Icon) {
        return <Icon className="h-3.5 w-3.5 shrink-0" />;
      }
    }

    return null;
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-normal transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md border',
            selected.length > 0
              ? 'bg-background text-foreground border-border hover:bg-accent'
              : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground',
            className
          )}
        >
          {renderTriggerIcon()}
          <span>{getDisplayLabel()}</span>
          {selected.length > 0 ? (
            <>
              <div className="h-4 w-px bg-border" />
              <X className="h-3.5 w-3.5 shrink-0" onClick={handleClearAll} />
            </>
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px] p-0" sideOffset={6}>
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-8 border-0 bg-transparent px-0 py-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {isSearching ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No results found</div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggle(option.value)}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent/50'
                  )}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  {showAvatars && option.avatar && (
                    <BoringAvatar name={option.label} size={24} className="mr-2 shrink-0" />
                  )}
                  <span className="flex-1 text-left">{option.label}</span>
                  {Icon && !showAvatars && (
                    <Icon className="h-3.5 w-3.5 ml-2 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
