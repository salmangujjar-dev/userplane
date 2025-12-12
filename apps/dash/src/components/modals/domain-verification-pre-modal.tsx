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
import { HelpCircle, Copy, Check, ArrowLeftRight, Globe } from 'lucide-react';

interface DomainVerificationPreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainUrl: string;
  onVerify?: () => void;
}

export function DomainVerificationPreModal({
  open,
  onOpenChange,
  domainUrl,
  onVerify,
}: DomainVerificationPreModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const codeSnippet = `<!-- Lets users record their screen from your site -->
<meta name="jam:team" content="d30c1818-9009-495e-a81b-10de2469a353" />
<script type="module" src="https://js.jam.dev/recorder.js"></script>

<!-- Captures user events and developer logs -->
<script type="module" src="https://js.jam.dev/capture.js"></script>`;

  const renderSyntaxHighlightedCode = () => {
    return (
      <div className="whitespace-pre-wrap break-all">
        <div className="text-muted-foreground">
          &lt;!-- Lets users record their screen from your site --&gt;
        </div>
        <div>
          <span className="text-blue-600">&lt;meta</span>{' '}
          <span className="text-purple-600">name</span>=
          <span className="text-green-600">&quot;jam:team&quot;</span>{' '}
          <span className="text-purple-600">content</span>=
          <span className="text-green-600">&quot;d30c1818-9009-495e-a81b-10de2469a353&quot;</span>{' '}
          <span className="text-blue-600">/&gt;</span>
        </div>
        <div>
          <span className="text-blue-600">&lt;script</span>{' '}
          <span className="text-purple-600">type</span>=
          <span className="text-green-600">&quot;module&quot;</span>{' '}
          <span className="text-purple-600">src</span>=
          <span className="text-green-600">&quot;https://js.jam.dev/recorder.js&quot;</span>
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
          <span className="text-green-600">&quot;https://js.jam.dev/capture.js&quot;</span>
          <span className="text-blue-600">&gt;&lt;/script&gt;</span>
        </div>
      </div>
    );
  };

  const handleHowItWorks = () => {
    window.open('https://docs.userplane.com/domains', '_blank');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
              <DialogTitle className="text-xl font-semibold">Verify your domain</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Add code snippet to capture logs
              </DialogDescription>
            </div>
          </div>

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
            >
              Cancel
            </Button>
            <Button type="button" className="rounded-full px-6" onClick={onVerify}>
              Verify
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
