import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

import { Card, CardPanel } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  valueClassName?: string;
  trendClassName?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  icon,
  valueClassName,
  trendClassName,
}: MetricCardProps) {
  return (
    <Card className="gap-0 rounded-lg py-0">
      <CardPanel className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon && (
            <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        <p className={cn('mt-1 text-2xl font-bold tracking-tight', valueClassName)}>{value}</p>
        {trend && (
          <p
            className={cn(
              'mt-2 flex items-center gap-1 text-xs',
              trend.positive ? 'text-success-foreground' : 'text-destructive-foreground',
              trendClassName
            )}
          >
            {trend.positive ? (
              <TrendingUpIcon className="size-3" />
            ) : (
              <TrendingDownIcon className="size-3" />
            )}
            {trend.value}
          </p>
        )}
      </CardPanel>
    </Card>
  );
}
