import Logo from '@workspace/ui/components/logo';
import { ArrowLeftRight } from 'lucide-react';
import Image from 'next/image';

import { mediaClient } from '@/lib/media';

/**
 * Header component showing the Userplane logo connected to Intercom logo.
 * Used in both the OAuth callback flow and the invite page.
 */
export function IntercomInviteHeader() {
  return (
    <div className="flex items-center gap-4">
      <Logo variant="tiled" size="md" showText={false} />
      <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
      <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
        <Image
          src={mediaClient.integrations.get('intercom')}
          alt="Intercom"
          width={32}
          height={32}
          unoptimized
          className="object-contain"
        />
      </div>
    </div>
  );
}
