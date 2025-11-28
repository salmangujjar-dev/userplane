'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { AuthIcons } from '@/components/auth/auth-icons';

export default function WorkspaceInviteInvalidPage() {
  const router = useRouter();

  const handleCreateWorkspace = () => {
    router.push('/workspace/create');
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo showText={false} />
          <h1 className="text-xl font-medium text-foreground">Invite Invalid</h1>
          <p className="text-sm text-muted-foreground text-center">
            Try checking the link or requesting a new one
          </p>
        </div>

        <div className="space-y-6">
          <Button
            onClick={handleCreateWorkspace}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            Create New Workspace
          </Button>
        </div>
      </div>
    </div>
  );
}
