'use client';

import { COMPANY_NAME } from '@userplane/shared';
import { Button } from '@userplane/ui/components/button';
import Image from 'next/image';

import { mediaClient } from '@/lib/media';

interface ErrorViewAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface ErrorViewProps {
  title?: string;
  description?: string;
  primaryAction?: ErrorViewAction;
  secondaryAction?: ErrorViewAction;
}

export function ErrorView({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  primaryAction,
  secondaryAction,
}: ErrorViewProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 overflow-hidden bg-background">
      {/* Decorative icons - Desktop Left Side */}
      <div className="absolute left-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src={mediaClient.getTileMediaUrl('tiles/bubble.webp')}
          alt=""
          width={80}
          height={80}
          className="absolute top-[18%] -left-6 rotate-[-15deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/fin.webp')}
          alt=""
          width={90}
          height={90}
          className="absolute top-[38%] -left-8 rotate-12 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/letterbox.webp')}
          alt=""
          width={85}
          height={85}
          className="absolute top-[58%] -left-7 rotate-[-8deg] transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/paperplane.webp')}
          alt=""
          width={75}
          height={75}
          className="absolute top-[78%] -left-5 rotate-18 transition-transform duration-300 hover:-translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      {/* Decorative icons - Desktop Right Side */}
      <div className="absolute right-0 top-0 h-full w-32 hidden lg:block">
        <Image
          src={mediaClient.getTileMediaUrl('tiles/intercom.webp')}
          alt=""
          width={85}
          height={85}
          className="absolute top-[17%] -right-7 rotate-10 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/browsercursor.webp')}
          alt=""
          width={75}
          height={75}
          className="absolute top-[38%] -right-5 rotate-[-14deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/magf.webp')}
          alt=""
          width={80}
          height={80}
          className="absolute top-[59%] -right-6 rotate-[-10deg] transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/documentation.webp')}
          alt=""
          width={85}
          height={85}
          className="absolute top-[80%] -right-7 rotate-13 transition-transform duration-300 hover:translate-x-2 hover:scale-110 cursor-pointer"
        />
      </div>

      {/* Decorative icons - Mobile Bottom */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-32 block lg:hidden">
        <Image
          src={mediaClient.getTileMediaUrl('tiles/bubble.webp')}
          alt=""
          width={70}
          height={70}
          className="absolute bottom-[-20px] left-[10%] rotate-[-15deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/intercom.webp')}
          alt=""
          width={75}
          height={75}
          className="absolute bottom-[-25px] left-[32%] rotate-12 transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/fin.webp')}
          alt=""
          width={70}
          height={70}
          className="absolute bottom-[-22px] left-[54%] rotate-[-8deg] transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
        <Image
          src={mediaClient.getTileMediaUrl('tiles/pointer.webp')}
          alt=""
          width={65}
          height={65}
          className="absolute bottom-[-20px] left-[76%] -rotate-12 transition-transform duration-300 hover:translate-y-2 hover:scale-110 cursor-pointer"
        />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md space-y-8 relative z-10 flex flex-col items-center min-h-[60vh] justify-between">
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Image
            src={mediaClient.getIconMediaUrl('icons/dino.svg')}
            alt="Error"
            width={120}
            height={120}
            className="mb-2"
          />
          <h1 className="text-xl font-medium text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm">{description}</p>
          {(primaryAction || secondaryAction) && (
            <div className="flex gap-3 mt-5">
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  size="lg"
                  variant="outline"
                  className="px-7"
                >
                  {secondaryAction.icon && (
                    <span className="mr-2 h-4 w-4">{secondaryAction.icon}</span>
                  )}
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button onClick={primaryAction.onClick} size="lg" className="px-7">
                  {primaryAction.icon && <span className="mr-2 h-4 w-4">{primaryAction.icon}</span>}
                  {primaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 pb-4">
          <Image
            src={mediaClient.getBrandMediaUrl('brand/logo-dark.svg')}
            alt={COMPANY_NAME}
            width={24}
            height={24}
            className="h-6 w-auto"
          />
          <span className="text-sm font-medium text-foreground">{COMPANY_NAME}</span>
        </div>
      </div>
    </div>
  );
}
