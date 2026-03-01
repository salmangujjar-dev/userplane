'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import Logo from '@userplane/ui/components/logo';
import { ArrowLeftRight, CheckCircle2, Loader2 } from 'lucide-react';
import Image from 'next/image';

import { getIntegrationConfig } from '@/constants/integration-permissions';
import { useCanEditWorkspace } from '@/features/workspace';

interface IntegrationPostConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationName: string;
  integrationImage: string;
  onDisconnect?: () => void;
  isDisconnecting?: boolean;
}

export function IntegrationPostConnectModal({
  open,
  onOpenChange,
  integrationName,
  integrationImage,
  onDisconnect,
  isDisconnecting = false,
}: IntegrationPostConnectModalProps) {
  const config = getIntegrationConfig(integrationName);
  const { canEdit } = useCanEditWorkspace();

  const capabilities = [
    'Request screen recordings directly from Intercom conversations',
    'Create recording links and view recordings from the inbox sidebar',
    'Use Cmd+K shortcut to create links without leaving the conversation',
    'Insert reusable recording links into Intercom macros',
    'Recordings are automatically linked to conversations for easy access',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
                <Image
                  src={integrationImage}
                  alt={integrationName}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            </div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-xl font-semibold">
                Connected to {config.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {config.description}
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">You can now</p>
            <div className="space-y-3">
              {capabilities.map((capability) => (
                <div key={capability} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{capability}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div className="flex w-full justify-between items-center">
            {onDisconnect && canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={onDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6 ml-auto"
              onClick={() => onOpenChange(false)}
              disabled={isDisconnecting}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
