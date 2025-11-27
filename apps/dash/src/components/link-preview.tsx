'use client';

import { useRouter } from 'next/navigation';

interface LinkPreviewProps {
  linkId?: string;
  onClick?: () => void;
}

export function LinkPreview({ linkId, onClick }: LinkPreviewProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/recordings');
    }
  };

  return (
    <div
      className="h-20 rounded-xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={handleClick}
    />
  );
}
