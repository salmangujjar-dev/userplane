'use client';

import { ArrowUpRightIcon, Building2Icon, RepeatIcon, SearchIcon, TagsIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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
import { useVendorDirectorySummary } from '@/hooks/useFinanceSummaries';
import { isFailureActive } from '@/lib/feature-flags';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const signalLabels: Record<string, string> = {
  all: 'All Signals',
  recurring: 'Recurring',
  review: 'Review',
  monitor: 'Monitor',
};
const PAGE_SIZE = 25;

export default function VendorsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [signal, setSignal] = useState('all');
  const [page, setPage] = useState(0);
  const { data, isLoading } = useVendorDirectorySummary({
    search,
    categoryId,
    signal,
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  const vendors = data?.vendors ?? [];
  const categories = data?.categories ?? [];
  const totals = data?.totals;
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (isLoading || !data) {
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
        <SummaryTile
          label="Visible spend"
          value={formatCurrency(totals?.visibleSpend ?? 0)}
          valueClassName="financial-amount"
        />
        <SummaryTile label="Vendors" value={(totals?.visibleVendors ?? 0).toString()} />
        <SummaryTile label="Recurring" value={(totals?.recurring ?? 0).toString()} />
        <SummaryTile label="Review signals" value={(totals?.review ?? 0).toString()} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(event) => {
                setSearch((event.target as HTMLInputElement).value);
                setPage(0);
              }}
              className="sensitive-form-field pl-9"
            />
          </div>
          <Select
            value={categoryId}
            onValueChange={(value) => {
              setCategoryId(value as string);
              setPage(0);
            }}
          >
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
          <Select
            value={signal}
            onValueChange={(value) => {
              setSignal(value as string);
              setPage(0);
            }}
          >
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
        <p className="text-sm text-muted-foreground">
          Showing {vendors.length} of {total} vendors · grouped from {data.expenseCount} expenses
        </p>
      </div>

      {isFailureActive('vendorDirectoryRender') ? (
        <ErrorBoundary>
          <VendorsChaosFailure />
        </ErrorBoundary>
      ) : vendors.length === 0 ? (
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
              {vendors.map((vendor) => (
                <TableRow key={vendor.merchant}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="vendor-name truncate font-medium">{vendor.merchant}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {vendor.employeeCount} employees · avg{' '}
                        <span className="financial-amount">
                          {formatCurrency(vendor.averageAmount)}
                        </span>
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
                  <TableCell className="sensitive-data hidden lg:table-cell text-muted-foreground">
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

      {totalPages > 1 && (
        <DirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

function VendorsChaosFailure(): never {
  throw new Error('Vendor directory failed during procurement signal merge.');
}

function DirectoryPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Page {page + 1} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums', valueClassName)}>{value}</p>
    </div>
  );
}
