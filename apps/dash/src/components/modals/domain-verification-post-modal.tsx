'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import Logo from '@workspace/ui/components/logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import { ArrowLeftRight, Globe, ChevronDown, HelpCircle } from 'lucide-react';

interface DomainVerificationPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainUrl: string;
  onReverify?: () => void;
}

export function DomainVerificationPostModal({
  open,
  onOpenChange,
  domainUrl,
  onReverify,
}: DomainVerificationPostModalProps) {
  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setOpenSection((prev) => (prev === index ? null : index));
  };

  const guideSteps = [
    {
      title: 'View installation instructions',
      content:
        'The scripts have been successfully added to your domain. Console and network logs are now being captured automatically.',
    },
    {
      title: 'Verify script installation',
      content:
        'Open your browser developer tools and check the Network tab. You should see requests to js.jam.dev confirming the scripts are loaded correctly.',
    },
    {
      title: 'Test log capture',
      content:
        'Generate some console logs or network activity on your site. Visit your Userplane dashboard to see captured logs in real-time.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
                <Globe className="h-8 w-8" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <DialogTitle className="text-xl font-semibold">Your domain verified</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Console and network logs capture enabled
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
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.content}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-8">
          <button
            type="button"
            onClick={() => {
              console.log('Remove domain:', domainUrl);
              onOpenChange(false);
            }}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-auto"
          >
            <HelpCircle className="h-4 w-4" />
            Remove domain
          </button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={() => {
                if (onReverify) {
                  onReverify();
                }
              }}
            >
              Reverify
            </Button>
            <Button type="button" className="rounded-full px-6" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
