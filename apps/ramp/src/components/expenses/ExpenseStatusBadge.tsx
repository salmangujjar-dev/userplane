import { Badge } from '@/components/ui/badge';
import type { ExpenseStatus } from '@/lib/data/types';

const statusConfig: Record<
  ExpenseStatus,
  { label: string; variant: 'success' | 'warning' | 'error' }
> = {
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'error' },
};

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
