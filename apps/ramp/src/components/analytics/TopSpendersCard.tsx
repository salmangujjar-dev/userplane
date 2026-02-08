'use client';

import BoringAvatar from 'boring-avatars';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { ExpenseWithRelations } from '@/lib/data/types';
import { formatCurrency } from '@/lib/utils';

const AVATAR_COLORS = ['#1F1F1F', '#E4F222', '#737373', '#A3A3A3', '#D4D4D4'];
const ITEMS_PER_PAGE = 5;

interface TopSpendersCardProps {
  expenses: ExpenseWithRelations[];
}

export function TopSpendersCard({ expenses }: TopSpendersCardProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const allSpenders = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>();
    expenses
      .filter((e) => e.status === 'approved')
      .forEach((e) => {
        const name = e.employee?.name ?? 'Unknown';
        const existing = map.get(e.employeeId) ?? { name, total: 0 };
        existing.total += e.amount;
        map.set(e.employeeId, existing);
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const totalPages = Math.ceil(allSpenders.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSpenders = allSpenders.slice(startIndex, endIndex);
  const maxSpend = allSpenders[0]?.total ?? 1;

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  if (allSpenders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No spenders data available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        {currentSpenders.map((s, i) => {
          const globalIndex = startIndex + i;
          return (
            <div key={s.name} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-5 text-right">
                {globalIndex + 1}
              </span>
              <BoringAvatar size={32} name={s.name} variant="beam" colors={AVATAR_COLORS} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{s.name}</span>
                  <span className="text-sm text-muted-foreground shrink-0 ml-2">
                    {formatCurrency(s.total)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(s.total / maxSpend) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="h-8 w-8"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
