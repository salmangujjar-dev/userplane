'use client';

import BoringAvatar from 'boring-avatars';
import { ArrowUpRightIcon, Grid3X3Icon, ListIcon, SearchIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { Suspense, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardPanel } from '@/components/ui/card';
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
import { toastManager } from '@/components/ui/toast';
import { useEmployeeDirectorySummary } from '@/hooks/useFinanceSummaries';
import { log } from '@/lib/client-logger';
import type { EmployeeSpendSummary } from '@/lib/data/mock-finance';
import { isFailureActive } from '@/lib/feature-flags';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

type ViewMode = 'cards' | 'list';
const PAGE_SIZE = 25;

const AVATAR_COLORS = ['#1F1F1F', '#E4F222', '#737373', '#A3A3A3', '#D4D4D4'];

const filterParsers = {
  view: parseAsString.withDefault('cards'),
  search: parseAsString.withDefault(''),
  department: parseAsString.withDefault('All'),
  page: parseAsInteger.withDefault(0),
};

export default function EmployeesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-9 w-40" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-44" />
            ))}
          </div>
        </div>
      }
    >
      <EmployeesContent />
    </Suspense>
  );
}

function EmployeesContent() {
  const [filters, setFilters] = useQueryStates(filterParsers, { shallow: false });
  const { data, isLoading } = useEmployeeDirectorySummary({
    search: filters.search,
    department: filters.department,
    page: String(filters.page),
    pageSize: String(PAGE_SIZE),
  });
  const view: ViewMode = filters.view === 'list' ? 'list' : 'cards';
  const filtered = data?.employees ?? [];
  const departments = data?.departments ?? ['All'];
  const totals = data?.totals;
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    log.debug('EmployeesPage mounted');
  }, []);

  useEffect(() => {
    if (!isLoading) {
      log.debug({ visibleCount: filtered.length }, 'EmployeesPage data ready');
    }
  }, [filtered.length, isLoading]);

  const handleViewChange = (nextView: ViewMode) => {
    if (isFailureActive('employeeViewToggle')) {
      console.error('[Employees] View toggle is temporarily unresponsive');
      toastManager.add({
        title: 'View did not change',
        description: 'The employee view toggle is temporarily unavailable.',
        type: 'error',
      });
      return;
    }
    setFilters({ view: nextView });
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Visible employees" value={(totals?.visibleEmployees ?? 0).toString()} />
        <SummaryTile
          label="Approved spend"
          value={formatCurrency(totals?.approvedSpend ?? 0)}
          valueClassName="financial-amount"
        />
        <SummaryTile label="Pending items" value={(totals?.pendingItems ?? 0).toString()} />
        <SummaryTile label="Receipt coverage" value={`${totals?.avgReceiptCoverage ?? 0}%`} />
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={filters.search}
              onChange={(event) =>
                setFilters({ search: (event.target as HTMLInputElement).value, page: 0 })
              }
              className="sensitive-form-field pl-9"
            />
          </div>
          <Select
            value={filters.department}
            onValueChange={(value) => setFilters({ department: value as string, page: 0 })}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Departments">
                {() => (filters.department === 'All' ? 'All Departments' : filters.department)}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {departments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department === 'All' ? 'All Departments' : department}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="inline-flex w-fit rounded-lg border bg-muted/60 p-0.5">
          <Button
            size="sm"
            variant={view === 'cards' ? 'secondary' : 'ghost'}
            className="h-7"
            onClick={() => handleViewChange('cards')}
          >
            <Grid3X3Icon /> Cards
          </Button>
          <Button
            size="sm"
            variant={view === 'list' ? 'secondary' : 'ghost'}
            className="h-7"
            onClick={() => handleViewChange('list')}
          >
            <ListIcon /> List
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No employees found</EmptyTitle>
            <EmptyDescription>Try adjusting your search or filter.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : view === 'cards' ? (
        <EmployeeCards employees={filtered} />
      ) : (
        <EmployeesTable employees={filtered} />
      )}

      {totalPages > 1 && (
        <DirectoryPagination
          page={filters.page}
          totalPages={totalPages}
          onPageChange={(nextPage) => setFilters({ page: nextPage })}
        />
      )}
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

function EmployeeCards({ employees }: { employees: EmployeeSpendSummary[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {employees.map((employee) => (
        <Link key={employee.id} href={`/expenses?employeeId=${employee.id}`} className="block">
          <Card className="h-full gap-0 rounded-lg py-0 transition-shadow hover:shadow-md">
            <CardHeader className="border-b px-4 py-3">
              <div className="flex items-start gap-3">
                <BoringAvatar
                  size={40}
                  name={employee.name}
                  variant="beam"
                  colors={AVATAR_COLORS}
                />
                <div className="min-w-0 flex-1">
                  <p className="employee-name truncate text-sm font-semibold">{employee.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{employee.position}</p>
                </div>
                <Badge variant="secondary" size="sm">
                  {employee.department}
                </Badge>
              </div>
            </CardHeader>
            <CardPanel className="space-y-4 p-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat
                  label="Approved"
                  value={formatCurrency(employee.approvedSpend)}
                  valueClassName="financial-amount"
                />
                <Stat label="Pending" value={employee.pendingCount.toString()} />
                <Stat
                  label="Average"
                  value={formatCurrency(employee.avgExpense)}
                  valueClassName="financial-amount"
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <div className="min-w-0">
                  <p className="employee-email truncate text-xs text-muted-foreground">
                    {employee.email}
                  </p>
                  <p className="sensitive-data mt-1 text-xs text-muted-foreground">
                    {employee.lastExpenseDate
                      ? `Last spend ${formatDate(employee.lastExpenseDate, 'MMM d')}`
                      : 'No spend yet'}
                  </p>
                </div>
                <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </CardPanel>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function EmployeesTable({ employees }: { employees: EmployeeSpendSummary[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="hidden lg:table-cell">Role</TableHead>
            <TableHead className="text-right">Approved</TableHead>
            <TableHead className="text-right">Pending</TableHead>
            <TableHead className="hidden md:table-cell text-right">Average</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <div className="flex min-w-0 items-center gap-2">
                  <BoringAvatar
                    size={28}
                    name={employee.name}
                    variant="beam"
                    colors={AVATAR_COLORS}
                  />
                  <div className="min-w-0">
                    <p className="employee-name truncate font-medium">{employee.name}</p>
                    <p className="employee-email truncate text-xs text-muted-foreground">
                      {employee.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" size="sm">
                  {employee.department}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {employee.position}
              </TableCell>
              <TableCell className="expense-amount text-right font-medium">
                {formatCurrency(employee.approvedSpend)}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={employee.pendingCount > 0 ? 'warning' : 'secondary'}
                  size="sm"
                  className={cn(employee.pendingCount === 0 && 'text-muted-foreground')}
                >
                  {employee.pendingCount}
                </Badge>
              </TableCell>
              <TableCell className="financial-amount hidden md:table-cell text-right text-muted-foreground">
                {formatCurrency(employee.avgExpense)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`View ${employee.name} expenses`}
                  render={<Link href={`/expenses?employeeId=${employee.id}`} />}
                >
                  <ArrowUpRightIcon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className={cn('mt-1 truncate text-sm font-semibold tabular-nums', valueClassName)}>
        {value}
      </p>
    </div>
  );
}
