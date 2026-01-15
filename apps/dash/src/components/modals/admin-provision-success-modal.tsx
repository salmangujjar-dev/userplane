'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import { Copy, Check } from 'lucide-react';

export interface ProvisionResult {
  workspaceId: string;
  workspaceName: string;
  owner: {
    userId: string;
    email: string;
    name: string;
    isNew: boolean;
  };
  members: Array<{
    userId: string;
    email: string;
    name: string;
    role: 'admin' | 'member';
    isNew: boolean;
  }>;
}

interface AdminProvisionSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ProvisionResult | null;
}

/**
 * Success modal shown after workspace is provisioned.
 * Displays workspace details and allows copying workspace ID.
 */
export function AdminProvisionSuccessModal({
  open,
  onOpenChange,
  result,
}: AdminProvisionSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  if (!result) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.workspaceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Workspace Provisioned</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Successfully created workspace <strong>{result.workspaceName}</strong> for{' '}
                <strong>{result.owner.email}</strong>.
              </DialogDescription>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Workspace ID */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Workspace ID</p>
                <p className="font-mono text-sm">{result.workspaceId}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Owner Info */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Owner</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{result.owner.name}</span>
                <span className="text-sm text-muted-foreground">({result.owner.email})</span>
                {result.owner.isNew && (
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                    New
                  </span>
                )}
              </div>
            </div>

            {/* Members */}
            {result.members.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Members ({result.members.length})</p>
                <div className="space-y-1">
                  {result.members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-2 text-sm">
                      <span>{member.name}</span>
                      <span className="text-muted-foreground">({member.email})</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {member.role}
                      </span>
                      {member.isNew && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                          New
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" className="rounded-full px-6" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
