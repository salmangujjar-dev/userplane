import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

import { Card, CardPanel } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: { value: string; positive: boolean };
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, trend }: MetricCardProps) {
  return (
    <Card>
      <CardPanel>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        {trend && (
          <p
            className={cn(
              'mt-2 flex items-center gap-1 text-xs',
              trend.positive ? 'text-success-foreground' : 'text-destructive-foreground'
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
