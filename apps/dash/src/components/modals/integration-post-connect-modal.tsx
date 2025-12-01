'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { getIntegrationConfig } from '@/constants/integration-permissions';

interface IntegrationPostConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationName: string;
  integrationImage: string;
}

export function IntegrationPostConnectModal({
  open,
  onOpenChange,
  integrationName,
  integrationImage,
}: IntegrationPostConnectModalProps) {
  const [openSection, setOpenSection] = useState<number | null>(null);
  const config = getIntegrationConfig(integrationName);

  const toggleSection = (index: number) => {
    setOpenSection((prev) => (prev === index ? null : index));
  };

  const guideSteps = [
    {
      title: 'Install the Chrome extension',
      content:
        'Add the Userplane Chrome extension from the Chrome Web Store. Click "Add to Chrome" and pin it to your toolbar for easy access.',
    },
    {
      title: 'Configure your workspace settings',
      content:
        'Navigate to your workspace settings and copy your API key. Paste it into the extension settings to link your recordings.',
    },
    {
      title: 'Watch setup tutorial',
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
      </DialogContent>
    </Dialog>
  );
}
