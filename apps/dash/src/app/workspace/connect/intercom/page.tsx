'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@workspace/ui/components/button';
import { ArrowLeftRight } from 'lucide-react';
import { AuthIcons } from '@/components/auth/auth-icons';
import { useWorkspaceStore } from '@/stores/workspace';

export default function ConnectIntercomPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const setWorkspaceStore = useWorkspaceStore((state) => state.setWorkspace);

  const handleConnect = async () => {
    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsConnecting(false);
    // In a real application, this would connect to Intercom and return a workspaceId
    const mockWorkspaceId = 'workspace-123';
    setWorkspaceStore(mockWorkspaceId);
    router.push(`/${mockWorkspaceId}`);
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-dark.svg"
              alt="Userplane"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0"
            />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">
              Let&apos;s create your workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Connect your intercom workspace to get started
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            {isConnecting ? 'Connecting...' : 'Connect to Intercom'}
          </Button>

          <button
            type="button"
            onClick={() => router.push('/workspace/create')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
          >
            Configure userplane manually
          </button>
        </div>
      </div>
    </div>
  );
}
