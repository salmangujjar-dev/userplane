import { Button } from '@workspace/ui/components/button';

interface ListViewEmptyStateProps {
  subtitle: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

export function ListViewEmptyState({
  subtitle,
  buttonLabel,
  onButtonClick,
}: ListViewEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <p className="text-sm text-muted-foreground mb-2">{subtitle}</p>
      {buttonLabel && onButtonClick && (
        <Button
          onClick={onButtonClick}
          size="default"
          variant="ghost"
          className="border border-input"
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
