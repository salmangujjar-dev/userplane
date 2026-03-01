'use client';

import type { FeatureGate } from '@userplane/pricing';
import { Button } from '@userplane/ui/components/button';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { env } from '@/env';
import { useFeatureUpsell } from '@/hooks/use-feature-upsell';
import { useWorkspaceId } from '@/stores/workspace';

interface CaptureGateOverlayProps {
  title: string;
  subtitle: string;
  reason: 'feature-gated' | 'preference-disabled';
  featureGateKey?: FeatureGate;
  children: React.ReactNode;
}

const DOMAIN_PREFS_HELP_PATH = '/recording-links/domain-recording-preferences/';

function OverlayAction({
  reason,
  featureGateKey,
}: {
  reason: 'feature-gated' | 'preference-disabled';
  featureGateKey?: FeatureGate;
}) {
  const workspaceId = useWorkspaceId();
  const { triggerUpsell } = useFeatureUpsell();

  // On shared page (no workspace context), always show helpdesk link
  if (!workspaceId || reason === 'preference-disabled') {
    return (
      <Button variant="secondary" size="default" className="mt-2 rounded-full" asChild>
        <a
          href={`${env.support.docsUrl}${DOMAIN_PREFS_HELP_PATH}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
          Learn more
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="default"
      className="mt-2 rounded-full"
      onClick={() => triggerUpsell(featureGateKey!)}
    >
      <ArrowUpRight className="h-4 w-4" />
      Upgrade plan
    </Button>
  );
}

export function CaptureGateOverlay({
  title,
  subtitle,
  reason,
  featureGateKey,
  children,
}: CaptureGateOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background content - blurs on hover */}
      <div
        className={`
          h-full w-full pointer-events-none select-none
          transition-all duration-300 ease-out
          ${isHovered ? 'blur-[6px] opacity-50' : 'blur-none opacity-100'}
        `}
      >
        {children}
      </div>

      {/* Overlay - only visible on hover */}
      <div
        className={`
          absolute inset-0 flex flex-col items-center justify-center
          transition-all duration-300 ease-out
          ${isHovered ? 'bg-background/70 opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div
          className={`
            flex flex-col items-center gap-4 px-6 text-center
            transition-all duration-300 ease-out
            ${isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
          `}
        >
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">{subtitle}</p>
          <OverlayAction reason={reason} featureGateKey={featureGateKey} />
        </div>
      </div>
    </div>
  );
}
