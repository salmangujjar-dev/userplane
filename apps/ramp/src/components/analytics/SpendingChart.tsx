'use client';

import { format, isAfter, startOfDay, subDays } from 'date-fns';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ExpenseWithRelations } from '@/lib/data/types';

const chartConfig = {
  total: {
    label: 'Spending',
    color: '#4B6BFB',
  },
} satisfies ChartConfig;

interface SpendingChartProps {
  expenses: ExpenseWithRelations[];
  days: number;
}

export function SpendingChart({ expenses, days }: SpendingChartProps) {
  const data = useMemo(() => {
    const now = new Date();
    const start = startOfDay(subDays(now, days));
    const buckets: Record<string, number> = {};

    for (let i = 0; i <= days; i++) {
      const d = subDays(now, days - i);
      const key = format(d, days > 90 ? 'MMM yyyy' : 'MMM d');
      buckets[key] = 0;
    }

    expenses
      .filter((e) => e.status === 'approved' && isAfter(new Date(e.date), start))
      .forEach((e) => {
        const key = format(new Date(e.date), days > 90 ? 'MMM yyyy' : 'MMM d');
        if (key in buckets && buckets[key] !== undefined) {
          buckets[key] += e.amount;
        }
      });

    if (days > 90) {
      const seen = new Set<string>();
      return Object.entries(buckets)
        .filter(([key]) => {
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }));
    }

    return Object.entries(buckets).map(([name, total]) => ({
      name,
      total: Math.round(total * 100) / 100,
    }));
  }, [expenses, days]);

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <AreaChart data={data} accessibilityLayer>
        <defs>
          <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-total)" stopOpacity={0.24} />
            <stop offset="100%" stopColor="var(--color-total)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => label}
              formatter={(value) => (
                <div className="flex min-w-[120px] items-center gap-2 text-xs">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: 'var(--color-total)' }}
                  />
                  <span className="text-muted-foreground">{chartConfig.total.label}</span>
                  <span className="ml-auto font-mono font-medium tabular-nums">
                    ${Number(value).toLocaleString()}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--color-total)"
          fill="url(#fillTotal)"
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 5,
            fill: 'var(--color-total)',
            stroke: 'white',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
