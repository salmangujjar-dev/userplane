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
import { ArrowLeftRight, Globe, ChevronDown, HelpCircle, Copy, Check } from 'lucide-react';

interface DomainVerificationPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainUrl: string;
  workspaceId: string;
  onReverify?: () => void;
  verified?: boolean;
}

export function DomainVerificationPostModal({
  open,
  onOpenChange,
  domainUrl,
  workspaceId,
  onReverify,
  verified = true,
}: DomainVerificationPostModalProps) {
  const [openSection, setOpenSection] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const toggleSection = (index: number) => {
    setOpenSection((prev) => (prev === index ? null : index));
  };

  const codeSnippet = `<!-- Lets users record their screen from your site -->
<meta name="userplane:workspace" content="${workspaceId}" />
<script type="module" src="https://cdn.userplane.io/recorder.js"></script>

<!-- Captures user events and developer logs -->
<script type="module" src="https://cdn.userplane.io/capture.js"></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderSyntaxHighlightedCode = () => {
    return (
      <div className="whitespace-pre-wrap break-all">
        <div className="text-muted-foreground">
          &lt;!-- Lets users record their screen from your site --&gt;
        </div>
        <div>
          <span className="text-blue-600">&lt;meta</span>{' '}
          <span className="text-purple-600">name</span>=
          <span className="text-green-600">&quot;userplane:workspace&quot;</span>{' '}
          <span className="text-purple-600">content</span>=
          <span className="text-green-600">&quot;{workspaceId}&quot;</span>{' '}
          <span className="text-blue-600">/&gt;</span>
        </div>
        <div>
          <span className="text-blue-600">&lt;script</span>{' '}
          <span className="text-purple-600">type</span>=
          <span className="text-green-600">&quot;module&quot;</span>{' '}
          <span className="text-purple-600">src</span>=
          <span className="text-green-600">&quot;https://cdn.userplane.io/recorder.js&quot;</span>
          <span className="text-blue-600">&gt;&lt;/script&gt;</span>
        </div>
        <div className="h-3" />
        <div className="text-muted-foreground">
          &lt;!-- Captures user events and developer logs --&gt;
        </div>
        <div>
          <span className="text-blue-600">&lt;script</span>{' '}
          <span className="text-purple-600">type</span>=
          <span className="text-green-600">&quot;module&quot;</span>{' '}
          <span className="text-purple-600">src</span>=
          <span className="text-green-600">&quot;https://cdn.userplane.io/capture.js&quot;</span>
          <span className="text-blue-600">&gt;&lt;/script&gt;</span>
        </div>
      </div>
    );
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
        'Open your browser developer tools and check the Network tab. You should see requests to userplane.io confirming the scripts are loaded correctly.',
    },
    {
      title: 'Test log capture',
      content:
        'Generate some console logs or network activity on your site. Visit your Userplane dashboard to see captured logs in real-time.',
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
                <Globe className="h-8 w-8" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <DialogTitle className="text-xl font-semibold">
                {verified ? 'Your domain verified' : "Let's try again"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {verified ? 'Console and network logs capture enabled' : ''}
              </DialogDescription>
            </div>
          </div>

          {verified && (
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
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.content}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}

          {!verified && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Paste scripts into the{' '}
                  <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
                    &lt;head&gt;
                  </code>{' '}
                  tag of <span className="font-semibold text-foreground">{domainUrl}</span>
                </p>
              </div>

              <div className="relative">
                <div className="p-4 pr-12 rounded-lg bg-muted overflow-hidden text-xs font-mono leading-relaxed">
                  {renderSyntaxHighlightedCode()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={handleCopy}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-8">
          {verified && (
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
          )}
          <div className="flex gap-2 ml-auto">
            {verified && (
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
            )}
            {!verified && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-6"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            )}
            {!verified && (
              <Button
                type="button"
                className="rounded-full px-6"
                onClick={() => {
                  if (onReverify) {
                    onReverify();
                  }
                }}
              >
                Try Again
              </Button>
            )}
            {verified && (
              <Button
                type="button"
                className="rounded-full px-6"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
