'use client';

import { SearchIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';

interface ExpenseFiltersProps {
  status: string;
  categoryId: string;
  search: string;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function ExpenseFilters({
  status,
  categoryId,
  search,
  onStatusChange,
  onCategoryChange,
  onSearchChange,
}: ExpenseFiltersProps) {
  const { categories } = useCategories();

  const statusLabels: Record<string, string> = {
    all: 'All Statuses',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };

  const getCategoryLabel = (id: string) => {
    if (id === 'all') return 'All Categories';
    return categories.find((cat) => cat.id === id)?.name ?? id;
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => onSearchChange((e.target as HTMLInputElement).value)}
          className="pl-9"
        />
      </div>

      <Select value={status} onValueChange={(val) => onStatusChange(val as string)}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="All Statuses">
            {() => statusLabels[status] || 'All Statuses'}
          </SelectValue>
        </SelectTrigger>
        <SelectPopup>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectPopup>
      </Select>

      <Select value={categoryId} onValueChange={(val) => onCategoryChange(val as string)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="All Categories">
            {() => getCategoryLabel(categoryId)}
          </SelectValue>
        </SelectTrigger>
        <SelectPopup>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  );
}
