import { useNavigate } from '@tanstack/react-router';
import { Button } from '@userplane/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';
import { Copy, HelpCircle, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SUPPORT_LINKS } from '@/constants';

function ShareIllustration() {
  return (
    <div className="w-56 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-teal-200 via-emerald-200 to-green-200 p-3">
      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
        </div>
        <div className="flex items-center justify-center pt-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2">
          <div className="h-1.5 bg-gray-200 rounded flex-1" />
          <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center shrink-0">
            <svg
              className="w-3 h-3 text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShareLinkViewProps {
  linkUrl: string;
}

export function ShareLinkView({ linkUrl }: ShareLinkViewProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    navigator.clipboard.writeText(linkUrl).catch(() => {});
  }, [linkUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-lg font-semibold">Share Link</h1>
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-muted-foreground">Share the link to capture their screen</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={SUPPORT_LINKS.sharingLinks}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Learn more about sharing links</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center px-4">
          <div className="mb-5">
            <ShareIllustration />
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full max-w-[280px] mb-5 flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <span className="flex-1 truncate text-left">{linkUrl}</span>
            <Copy className="h-3.5 w-3.5 shrink-0" />
          </button>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-2" onClick={handleCopy}>
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => navigate({ to: '/create' })}
            >
              <Plus className="w-4 h-4" />
              Create Another
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
