'use client';

import { ArrowUpRightIcon, Building2Icon, RepeatIcon, SearchIcon, TagsIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useVendors } from '@/hooks/useVendors';
import { deriveVendorSummaries } from '@/lib/data/mock-finance';
import { isFailureActive } from '@/lib/feature-flags';
import { formatCurrency, formatDate } from '@/lib/utils';

const signalLabels: Record<string, string> = {
  all: 'All Signals',
  recurring: 'Recurring',
  review: 'Review',
  monitor: 'Monitor',
};

export default function VendorsPage() {
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { vendors: persistedVendors, isLoading: vendorsLoading } = useVendors();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [signal, setSignal] = useState('all');
  const isLoading = expensesLoading || categoriesLoading || vendorsLoading;

  const vendors = useMemo(
    () => deriveVendorSummaries(persistedVendors, expenses),
    [expenses, persistedVendors]
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const searchMatches =
        !query ||
        vendor.merchant.toLowerCase().includes(query) ||
        vendor.categoryName.toLowerCase().includes(query) ||
        vendor.savingsOpportunity.toLowerCase().includes(query);
      const categoryMatches = categoryId === 'all' || vendor.categoryId === categoryId;
      const signalMatches =
        signal === 'all' ||
        (signal === 'recurring' && vendor.recurring) ||
        (signal === 'review' && vendor.savingsOpportunity !== 'Monitor') ||
        (signal === 'monitor' && vendor.savingsOpportunity === 'Monitor');

      return searchMatches && categoryMatches && signalMatches;
    });
  }, [categoryId, search, signal, vendors]);

  const totalSpend = filtered.reduce((sum, vendor) => sum + vendor.totalSpend, 0);
  const recurringCount = vendors.filter((vendor) => vendor.recurring).length;
  const reviewCount = vendors.filter((vendor) => vendor.savingsOpportunity !== 'Monitor').length;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Visible spend" value={formatCurrency(totalSpend)} />
        <SummaryTile label="Vendors" value={filtered.length.toString()} />
        <SummaryTile label="Recurring" value={recurringCount.toString()} />
        <SummaryTile label="Review signals" value={reviewCount.toString()} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(event) => setSearch((event.target as HTMLInputElement).value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryId} onValueChange={(value) => setCategoryId(value as string)}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue>
                {() =>
                  categoryId === 'all'
                    ? 'All Categories'
                    : (categories.find((category) => category.id === categoryId)?.name ??
                      categoryId)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <Select value={signal} onValueChange={(value) => setSignal(value as string)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue>{() => signalLabels[signal] ?? 'All Signals'}</SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Signals</SelectItem>
              <SelectItem value="recurring">Recurring</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="monitor">Monitor</SelectItem>
            </SelectPopup>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">Grouped from {expenses.length} expenses</p>
      </div>

      {isFailureActive('vendorDirectoryRender') ? (
        <ErrorBoundary>
          <VendorsChaosFailure />
        </ErrorBoundary>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Building2Icon />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No vendors found</EmptyTitle>
            <EmptyDescription>Try adjusting your vendor filters.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="hidden md:table-cell">Activity</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead className="hidden lg:table-cell">Last charge</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vendor) => (
                <TableRow key={vendor.merchant}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{vendor.merchant}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {vendor.employeeCount} employees · avg{' '}
                        {formatCurrency(vendor.averageAmount)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" size="sm">
                      <TagsIcon /> {vendor.categoryName}
                    </Badge>
                  </TableCell>
                  <TableCell className="expense-amount text-right font-medium">
                    {formatCurrency(vendor.totalSpend)}
                    {vendor.pendingSpend > 0 && (
                      <p className="text-xs font-normal text-muted-foreground">
                        {formatCurrency(vendor.pendingSpend)} pending
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {vendor.transactionCount} transactions
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {vendor.recurring && (
                        <Badge variant="info" size="sm">
                          <RepeatIcon /> Recurring
                        </Badge>
                      )}
                      <Badge
                        variant={vendor.savingsOpportunity === 'Monitor' ? 'secondary' : 'warning'}
                        size="sm"
                      >
                        {vendor.savingsOpportunity}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {vendor.lastChargeDate ? formatDate(vendor.lastChargeDate) : 'No charges'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`View ${vendor.merchant} expenses`}
                      render={
                        <Link href={`/expenses?search=${encodeURIComponent(vendor.merchant)}`} />
                      }
                    >
                      <ArrowUpRightIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function VendorsChaosFailure(): never {
  throw new Error('Vendor directory failed during procurement signal merge.');
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
