import { Button } from '@workspace/ui/components/button';
import Image from 'next/image';
import Link from 'next/link';

import { mediaClient } from '@/lib/media';

export default function WorkspaceNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <Image
          src={mediaClient.getIconMediaUrl('icons/dino.svg')}
          alt="Not Found"
          width={120}
          height={120}
          className="mb-2"
        />
        <h1 className="text-2xl font-semibold text-foreground">Not found</h1>
        <p className="text-sm text-muted-foreground">
          The resource you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/" className="mt-4">
          <Button size="lg" className="rounded-full px-8">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
