'use client';

import { CreditCardIcon, LockIcon, SearchIcon, Settings2Icon, ShieldCheckIcon } from 'lucide-react';
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
import { toastManager } from '@/components/ui/toast';
import { useCards } from '@/hooks/useCards';
import { useExpenses } from '@/hooks/useExpenses';
import { deriveCardSummaries } from '@/lib/data/mock-finance';
import type { CardStatus } from '@/lib/data/types';
import { isFailureActive } from '@/lib/feature-flags';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  all: 'All Statuses',
  active: 'Active',
  locked: 'Locked',
  review: 'Review',
};

export default function CardsPage() {
  const { cards: persistedCards, isLoading: cardsLoading } = useCards();
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const isLoading = cardsLoading || expensesLoading;

  const cards = useMemo(
    () => deriveCardSummaries(persistedCards, expenses),
    [expenses, persistedCards]
  );
  const departments = useMemo(() => {
    return Array.from(new Set(cards.map((card) => card.employee.department))).sort();
  }, [cards]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cards.filter((card) => {
      const searchMatches =
        !query ||
        card.employee.name.toLowerCase().includes(query) ||
        card.employee.email.toLowerCase().includes(query) ||
        card.lastMerchant.toLowerCase().includes(query) ||
        card.controlsLabel.toLowerCase().includes(query);
      const statusMatches = status === 'all' || card.status === status;
      const departmentMatches = department === 'all' || card.employee.department === department;

      return searchMatches && statusMatches && departmentMatches;
    });
  }, [cards, department, search, status]);

  const activeCount = cards.filter((card) => card.status === 'active').length;
  const lockedCount = cards.filter((card) => card.status === 'locked').length;
  const reviewCount = cards.filter((card) => card.status === 'review').length;
  const availableCredit = filtered.reduce((sum, card) => sum + card.available, 0);

  const handleCardControl = (control: 'lock' | 'settings') => {
    if (isFailureActive('cardControls')) {
      console.error(`[Cards] ${control} control is temporarily unavailable`);
      toastManager.add({
        title: 'Card control unavailable',
        description: 'Issuer controls are temporarily unavailable. Please retry later.',
        type: 'error',
      });
    }
  };

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
        <SummaryTile label="Issued cards" value={cards.length.toString()} />
        <SummaryTile label="Active" value={activeCount.toString()} />
        <SummaryTile label="Needs review" value={(lockedCount + reviewCount).toString()} />
        <SummaryTile
          label="Available credit"
          value={formatCurrency(availableCredit)}
          valueClassName="financial-amount"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={search}
              onChange={(event) => setSearch((event.target as HTMLInputElement).value)}
              className="sensitive-form-field pl-9"
            />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as string)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue>{() => statusLabels[status] ?? 'All Statuses'}</SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="review">Review</SelectItem>
            </SelectPopup>
          </Select>
          <Select value={department} onValueChange={(value) => setDepartment(value as string)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue>
                {() => (department === 'all' ? 'All Departments' : department)}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">Showing {filtered.length} cards</p>
      </div>

      {isFailureActive('cardsTableRender') ? (
        <ErrorBoundary>
          <CardsChaosFailure />
        </ErrorBoundary>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <CreditCardIcon />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No cards found</EmptyTitle>
            <EmptyDescription>Try adjusting your card filters.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cardholder</TableHead>
                <TableHead>Card</TableHead>
                <TableHead className="hidden lg:table-cell">Controls</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="hidden md:table-cell">Last activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="employee-name truncate font-medium">{card.employee.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {card.employee.department} ·{' '}
                        <span className="employee-email">{card.employee.email}</span>
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <CreditCardIcon className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{card.type}</span>
                          <CardStatusBadge status={card.status} />
                        </div>
                        <p className="card-data text-xs text-muted-foreground">
                          **** {card.lastFour} · Limit {formatCurrency(card.monthlyLimit)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary" size="sm">
                      <ShieldCheckIcon /> {card.controlsLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-36 space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="financial-amount">
                          {formatCurrency(card.spentThisMonth + card.pendingAmount)}
                        </span>
                        <span className="text-muted-foreground">{card.utilization}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, card.utilization)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="min-w-0">
                      <p className="merchant-name truncate text-sm">{card.lastMerchant}</p>
                      <p className="sensitive-data text-xs text-muted-foreground">
                        {card.lastActivityDate ? formatDate(card.lastActivityDate) : 'No activity'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        aria-label="Lock card"
                        onClick={() => handleCardControl('lock')}
                      >
                        <LockIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Card settings"
                        onClick={() => handleCardControl('settings')}
                      >
                        <Settings2Icon />
                      </Button>
                    </div>
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

function CardsChaosFailure(): never {
  throw new Error('Cards table failed to reconcile issuer controls.');
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

function CardStatusBadge({ status }: { status: CardStatus }) {
  const variant = status === 'active' ? 'success' : status === 'locked' ? 'secondary' : 'warning';
  const label = status === 'review' ? 'Review' : status === 'locked' ? 'Locked' : 'Active';

  return (
    <Badge variant={variant} size="sm">
      {label}
    </Badge>
  );
}
