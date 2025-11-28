'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { AuthIcons } from '@/components/auth/auth-icons';

export default function WorkspaceInviteExpiredPage() {
  const router = useRouter();

  const handleRequestInvite = () => {
    // Handle request new invite logic
    router.push('/');
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo showText={false} />
          <h1 className="text-xl font-medium text-foreground">Invite Expired</h1>
          <p className="text-sm text-muted-foreground text-center">
            Looks like this link is no longer active. Try requesting a new one
          </p>
        </div>

        <div className="space-y-6">
          <Button onClick={handleRequestInvite} size="lg" className="w-full rounded-full px-7 py-6">
            Request Invite
          </Button>
        </div>
      </div>
    </div>
  );
}
