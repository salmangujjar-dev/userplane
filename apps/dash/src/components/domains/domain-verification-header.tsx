import Logo from '@workspace/ui/components/logo';
import { ArrowLeftRight, Globe } from 'lucide-react';

export function DomainVerificationHeader() {
  return (
    <div className="flex items-center gap-4">
      <Logo variant="tiled" size="md" showText={false} />
      <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
      <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
        <Globe className="h-8 w-8" />
      </div>
    </div>
  );
}
