import { Button } from '@userplane/ui/components/button';

import { mediaClient } from '@/lib/media';

interface DinoErrorAction {
  label: string;
  onClick: () => void;
}

interface DinoErrorProps {
  title?: string;
  description?: string;
  primaryAction?: DinoErrorAction;
  secondaryAction?: DinoErrorAction;
}

export function DinoError({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  primaryAction,
  secondaryAction,
}: DinoErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-3 max-w-md">
        <img
          src={mediaClient.getIconMediaUrl('icons/dino.svg')}
          alt="Error"
          width={120}
          height={120}
          className="mb-2"
        />
        <h1 className="text-xl font-medium text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground text-center">{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex gap-3 mt-8">
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} size="lg" variant="outline" className="px-7">
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button onClick={primaryAction.onClick} size="lg" className="px-7">
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
