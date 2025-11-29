'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import { AuthIcons } from '@/components/auth/auth-icons';

export default function CreateWorkspacePage() {
  const [workspace, setWorkspace] = useState('');
  const router = useRouter();

  const handleCreateWorkspace = () => {
    router.push('/');
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-xl font-medium text-foreground">Let&apos;s create your workspace</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <p className="text-xs text-muted-foreground">Enter your company domain</p>
            <Input
              id="workspace"
              type="text"
              placeholder="https://ramp.com"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCreateWorkspace}
            disabled={!workspace.trim()}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            Create Workspace
          </Button>
        </div>
      </div>

      <footer className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
        <button
          type="button"
          onClick={() => router.push('/workspace/connect/intercom')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Connect using Intercom
        </button>
      </footer>
    </div>
  );
}
