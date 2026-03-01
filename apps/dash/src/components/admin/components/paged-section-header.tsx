import { Button } from '@userplane/ui/components/button';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';

interface PagedSectionHeaderProps {
  title: string;
  icon: LucideIcon;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function PagedSectionHeader({
  title,
  icon: Icon,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading,
}: PagedSectionHeaderProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex items-center justify-between mb-3">
      <h5 className="text-sm font-medium flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title} ({total})
      </h5>
      {total > 0 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0 || isLoading}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-12 text-center">
            {page + 1} / {Math.max(1, totalPages)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1 || isLoading}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
