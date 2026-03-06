import { Button } from '@userplane/ui/components/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface DomainCodeSnippetProps {
  workspaceId: string;
  domainUrl: string;
}

export function DomainCodeSnippet({ workspaceId, domainUrl }: DomainCodeSnippetProps) {
  const [isCopied, setIsCopied] = useState(false);

  const codeSnippet = `<!-- Sets workspace ID for screen recording -->
<meta name="userplane:workspace" content="${workspaceId}" />

<!-- Loads Userplane screen recording script -->
<script type="module" src="https://cdn.userplane.io/embed/script.js"></script>

<!-- If your site does not set CSP directives, you can skip this -->
<meta
  http-equiv="Content-Security-Policy"
  content="frame-src 'self' *.userplane.io; script-src 'self' *.userplane.io;"
/>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Paste scripts into the{' '}
          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
            &lt;head&gt;
          </code>{' '}
          tag of <span className="font-semibold text-foreground">{domainUrl}</span>
        </p>
      </div>

      <div className="relative">
        <div className="p-4 pr-12 rounded-lg bg-muted overflow-hidden text-xs font-mono leading-relaxed">
          <div className="whitespace-pre-wrap break-all">
            <div className="text-muted-foreground">
              &lt;!-- Sets workspace ID for screen recording --&gt;
            </div>
            <div>
              <span className="text-blue-600">&lt;meta</span>{' '}
              <span className="text-purple-600">name</span>=
              <span className="text-green-600">&quot;userplane:workspace&quot;</span>{' '}
              <span className="text-purple-600">content</span>=
              <span className="text-green-600">&quot;{workspaceId}&quot;</span>{' '}
              <span className="text-blue-600">/&gt;</span>
            </div>
            <div className="h-3" />
            <div className="text-muted-foreground">
              &lt;!-- Loads Userplane screen recording script --&gt;
            </div>
            <div>
              <span className="text-blue-600">&lt;script</span>{' '}
              <span className="text-purple-600">src</span>=
              <span className="text-green-600">
                &quot;https://cdn.userplane.io/embed/script.js&quot;
              </span>
              <span className="text-blue-600">&gt;&lt;/script&gt;</span>
            </div>
            <div className="h-3" />
            <div className="text-muted-foreground">
              &lt;!-- If your site does not set CSP directives, you can skip this --&gt;
            </div>
            <div>
              <span className="text-blue-600">&lt;meta</span>
            </div>
            <div className="pl-4">
              <span className="text-purple-600">http-equiv</span>=
              <span className="text-green-600">&quot;Content-Security-Policy&quot;</span>
            </div>
            <div className="pl-4">
              <span className="text-purple-600">content</span>=
              <span className="text-green-600">
                &quot;frame-src &apos;self&apos; *.userplane.io; script-src &apos;self&apos;
                *.userplane.io;&quot;
              </span>
            </div>
            <div>
              <span className="text-blue-600">/&gt;</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0"
          onClick={handleCopy}
        >
          {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
