import type { AdminPlanProduct } from '@workspace/contract';
import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';

import {
  PLAN_AVATAR_SIZES,
  PlanAvatar,
  type PlanAvatarSize,
} from '@/components/shared/plan-avatar';

type PlanDisplayData = Pick<
  AdminPlanProduct,
  'productId' | 'name' | 'price' | 'isRecurring' | 'hasMetadata'
>;

export function formatAdminPlanPrice(price: { price: number; currency: string } | null): string {
  if (!price) return '-';
  const amount = price.price / 100;
  const symbol = price.currency === 'USD' ? '$' : price.currency;
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatAdminPlanInterval(
  count?: number,
  interval?: 'Day' | 'Week' | 'Month' | 'Year'
): string {
  if (!count || !interval) return '';
  return `${count} ${interval}${count > 1 ? 's' : ''}`;
}

export function AdminPlanSummaryRow({
  plan,
  avatarSize = PLAN_AVATAR_SIZES.USER,
  rightSlot,
  className,
}: {
  plan: PlanDisplayData;
  avatarSize?: PlanAvatarSize;
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <PlanAvatar productId={plan.productId} planName={plan.name} size={avatarSize} />
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium truncate">{plan.name || 'Unnamed Product'}</span>
        {rightSlot}
      </div>
    </div>
  );
}

export function AdminPlanMetadataLine({
  plan,
  showMetadataBadge = true,
  className,
}: {
  plan: PlanDisplayData;
  showMetadataBadge?: boolean;
  className?: string;
}) {
  const interval =
    plan.price?.type === 'recurring_price'
      ? formatAdminPlanInterval(
          plan.price.paymentFrequencyCount,
          plan.price.paymentFrequencyInterval
        )
      : '';

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground flex-wrap min-w-0',
        className
      )}
    >
      <span className="font-mono truncate max-w-[220px]">{plan.productId}</span>
      <span>{formatAdminPlanPrice(plan.price)}</span>
      {interval && <span>/ {interval}</span>}
      {showMetadataBadge && (
        <Badge variant={plan.hasMetadata ? 'outline' : 'secondary'} className="text-[10px] h-5">
          {plan.hasMetadata ? 'Metadata' : 'No metadata'}
        </Badge>
      )}
    </div>
  );
}
