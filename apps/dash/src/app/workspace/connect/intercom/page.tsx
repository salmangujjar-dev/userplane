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
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <svg
                viewBox="0 0 512 512"
                className="h-8 w-8 flex-shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M210.09,0c10.56,0,19.12,8.56,19.12,19.12v63.74c0,10.56-8.56,19.12-19.12,19.12s-19.12-8.56-19.12-19.12V19.12C190.97,8.56,199.53,0,210.09,0z M88.22,50.22c7.47-7.47,19.57-7.47,27.04,0l44.62,44.61c7.47,7.47,7.47,19.57,0,27.04c-7.47,7.47-19.57,7.47-27.04,0L88.22,77.26C80.75,69.8,80.75,57.69,88.22,50.22z M331.97,50.22c7.47,7.47,7.47,19.57,0,27.04l-44.62,44.62c-7.47,7.47-19.57,7.47-27.04,0c-7.47-7.47-7.47-19.57,0-27.04l44.62-44.62C312.39,42.75,324.5,42.75,331.97,50.22z M38,172.09c0-10.56,8.56-19.12,19.12-19.12h63.74c10.56,0,19.12,8.56,19.12,19.12c0,10.56-8.56,19.12-19.12,19.12H57.12C46.56,191.21,38,182.65,38,172.09z M190.97,190.88c0-28.73,33.7-44.23,55.51-25.53l215.71,184.9c23.2,19.89,9.99,57.91-20.54,59.13l-97.9,3.92c-10.52,0.42-20.42,5.09-27.44,12.93l-66.66,74.5c-20.58,23-58.69,8.44-58.69-22.42V190.88z" />
              </svg>
            </div>
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
