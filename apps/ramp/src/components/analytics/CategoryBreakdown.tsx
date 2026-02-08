'use client';

import { useMemo } from 'react';
import { Cell, Label, Pie, PieChart } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { ExpenseWithRelations } from '@/lib/data/types';
import { formatCurrency } from '@/lib/utils';

const CATEGORY_COLORS = [
  '#1F1F1F',
  '#E4F222',
  '#4B9CD3',
  '#F97316',
  '#10B981',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#06B6D4',
  '#6B7280',
];

interface CategoryBreakdownProps {
  expenses: ExpenseWithRelations[];
}

export function CategoryBreakdown({ expenses }: CategoryBreakdownProps) {
  const { data, total, chartConfig } = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    expenses
      .filter((e) => e.status === 'approved')
      .forEach((e) => {
        const catName = e.category?.name ?? 'Unknown';
        const existing = map.get(catName) ?? { name: catName, value: 0 };
        existing.value += e.amount;
        map.set(catName, existing);
      });

    const sorted = Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .map((d, i) => ({
        ...d,
        value: Math.round(d.value * 100) / 100,
        fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));

    const total = sorted.reduce((sum, d) => sum + d.value, 0);

    const config: ChartConfig = {};
    sorted.forEach((d, i) => {
      config[d.name] = {
        label: d.name,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      };
    });

    return { data: sorted, total, chartConfig: config };
  }, [expenses]);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
      {/* Donut chart */}
      <div className="shrink-0">
        <ChartContainer config={chartConfig} className="min-h-[300px] w-[300px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex min-w-[140px] items-center gap-2 text-xs">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: chartConfig[name as string]?.color }}
                      />
                      <span className="text-muted-foreground">{name}</span>
                      <span className="ml-auto font-mono font-medium tabular-nums">
                        {formatCurrency(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={130}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) - 10}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {formatCurrency(total)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 16}
                          className="fill-muted-foreground text-sm"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>

      {/* Legend list */}
      <div className="flex-1 space-y-3 w-full min-w-0">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2 text-sm min-w-0">
            <div
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
            />
            <span className="flex-1 truncate min-w-0">{item.name}</span>
            <span className="text-muted-foreground text-xs tabular-nums shrink-0">
              {total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0%'}
            </span>
            <span className="font-medium tabular-nums shrink-0 text-right min-w-20">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
