'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { getSpendingTrendData, type SpendingTrendPoint } from '@/lib/data/mock-finance';
import type { ExpenseWithRelations } from '@/lib/data/types';
import { isFailureActive } from '@/lib/feature-flags';

const chartConfig = {
  total: {
    label: 'Spending',
    color: '#4B6BFB',
  },
} satisfies ChartConfig;

interface SpendingChartProps {
  expenses?: ExpenseWithRelations[];
  data?: SpendingTrendPoint[];
  days: number;
}

export function SpendingChart({ expenses = [], data: precomputedData, days }: SpendingChartProps) {
  if (isFailureActive('analyticsChartRender')) {
    throw new Error('SpendingChart: Recharts internal error — invalid data series configuration.');
  }

  const data = useMemo(() => {
    return precomputedData ?? getSpendingTrendData(expenses, days);
  }, [precomputedData, expenses, days]);

  return (
    <ChartContainer config={chartConfig} className="financial-amount min-h-[300px] w-full">
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
                <div className="financial-amount flex min-w-[120px] items-center gap-2 text-xs">
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
