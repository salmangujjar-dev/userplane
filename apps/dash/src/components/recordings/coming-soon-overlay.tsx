'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { toast } from '@workspace/ui/components/sonner';
import { Bell, Check } from 'lucide-react';

interface ComingSoonOverlayProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function ComingSoonOverlay({ title, subtitle, children }: ComingSoonOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isNotified, setIsNotified] = useState(false);

  const handleNotifyClick = () => {
    if (isNotified) return;
    setIsNotified(true);
    toast.success(`We'll notify you when ${title} is ready`);
  };

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
          {/* Title */}
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>

          {/* Subtitle */}
          <p className="text-sm text-muted-foreground max-w-xs">{subtitle}</p>

          {/* Get Notified Button */}
          <Button
            variant={isNotified ? 'ghost' : 'secondary'}
            size="default"
            onClick={handleNotifyClick}
            disabled={isNotified}
            className="mt-2 rounded-full"
          >
            {isNotified ? (
              <>
                <Check className="h-4 w-4" />
                You&apos;re in
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Get Notified
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
