'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { ArrowLeftRight, CheckCircle2, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { getIntegrationConfig } from '@/constants/integration-permissions';

interface IntegrationPreConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationName: string;
  integrationImage: string;
  onConnect?: () => void;
}

export function IntegrationPreConnectModal({
  open,
  onOpenChange,
  integrationName,
  integrationImage,
  onConnect,
}: IntegrationPreConnectModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const config = getIntegrationConfig(integrationName);

  const handleConnect = async () => {
    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsConnecting(false);
    if (onConnect) {
      onConnect();
    }
    onOpenChange(false);
  };

  const handleHowItWorks = () => {
    window.open('https://docs.userplane.com/integrations', '_blank');
  };

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
              <DialogTitle className="text-xl font-semibold">Connect to {config.name}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {config.description}
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Userplane would like to</p>
            <div className="space-y-3">
              {config.permissions.map((permission, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{permission.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <button
            type="button"
            onClick={handleHowItWorks}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
          >
            <HelpCircle className="h-4 w-4" />
            How it works
          </button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={() => onOpenChange(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
