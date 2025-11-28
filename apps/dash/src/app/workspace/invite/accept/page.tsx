'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { AuthIcons } from '@/components/auth/auth-icons';

export default function WorkspaceInviteAcceptPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoinWorkspace = async () => {
    setIsLoading(true);
    // Handle workspace join logic here
    // For now, redirect to home
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo showText={false} />
          <h1 className="text-xl font-medium text-foreground">Join Lary&apos;s Workspace</h1>
          <p className="text-sm text-muted-foreground text-center">
            Sarah Jonas has invited you to join Userplane
          </p>
        </div>

        <div className="space-y-6">
          <Button
            onClick={handleJoinWorkspace}
            disabled={isLoading}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {isLoading ? 'Joining...' : 'Join Workspace'}
          </Button>
        </div>
      </div>
    </div>
  );
}
