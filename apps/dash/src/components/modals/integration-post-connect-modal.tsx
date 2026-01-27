'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import Logo from '@workspace/ui/components/logo';
import { ArrowLeftRight, ChevronDown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { getIntegrationConfig } from '@/constants/integration-permissions';
import { useCanEditWorkspace } from '@/hooks/use-workspace-role';

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
  const [openSection, setOpenSection] = useState<number | null>(null);
  const config = getIntegrationConfig(integrationName);
  const { canEdit } = useCanEditWorkspace();

  const toggleSection = (index: number) => {
    setOpenSection((prev) => (prev === index ? null : index));
  };

  const guideSteps = [
    {
      title: 'Step 1',
      content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      isVideo: true,
    },
    {
      title: 'Step 2',
      content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      isVideo: true,
    },
    {
      title: 'Step 3',
      content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      isVideo: true,
    },
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

          <div className="space-y-3 w-full">
            {guideSteps.map((step, index) => (
              <Collapsible
                key={index}
                open={openSection === index}
                onOpenChange={() => toggleSection(index)}
                className="w-full"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-4 py-3 text-left hover:bg-muted transition-colors">
                  <span className="text-sm font-medium">{step.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      openSection === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="rounded-lg border bg-background p-4">
                    {step.isVideo ? (
                      <div className="aspect-video w-full overflow-hidden rounded-md">
                        <iframe
                          width="100%"
                          height="100%"
                          src={step.content}
                          title={step.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="border-0"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.content}
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
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
