import { Button } from '@userplane/ui/components/button';

interface LoginPromptProps {
  onSignIn: () => void;
}

export function LoginPrompt({ onSignIn }: LoginPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-lg font-semibold">Userplane</h1>
        <p className="text-sm text-muted-foreground text-center">
          Sign in to your account to get started.
        </p>
      </div>
      <Button onClick={onSignIn} className="w-full">
        Sign in
      </Button>
    </div>
  );
}
