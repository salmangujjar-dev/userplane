import { Button } from '@userplane/ui/components/button';
import Logo from '@userplane/ui/components/logo';

import { AuthIcons } from '@/components/auth/auth-icons';
import { WorkspaceCard } from '@/components/workspace/workspace-card';

interface WorkspaceCreatedSuccessProps {
  workspaceName: string;
  title?: string;
  description?: string;
  primaryText?: string;
  secondaryText?: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
}

export function WorkspaceCreatedSuccess({
  workspaceName,
  title = 'Workspace created successfully',
  description = "You're all set! Start capturing user feedback",
  primaryText = 'Go to Workspace',
  secondaryText,
  onPrimaryAction,
  onSecondaryAction,
}: WorkspaceCreatedSuccessProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <AuthIcons />

      <div className="flex flex-col items-center gap-6 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground text-center">{description}</p>
        </div>

        <WorkspaceCard workspaceName={workspaceName} />

        <div className="w-full space-y-3">
          <Button onClick={onPrimaryAction} size="lg" className="w-full px-7 py-6">
            {primaryText}
          </Button>

          {secondaryText && onSecondaryAction && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onSecondaryAction}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {secondaryText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
