import { Button } from '@userplane/ui/components/button';
import Logo from '@userplane/ui/components/logo';

import { mediaClient } from '@/lib/media';

interface LoginPromptProps {
  onRefresh: () => void;
  onSignIn: () => void;
}

export function DecorativeIcons() {
  const topIcons = [
    { name: 'paperplane', size: 55, left: '5%', rotate: '15deg' },
    { name: 'letterbox', size: 55, left: '30%', rotate: '-10deg' },
    { name: 'magf', size: 50, left: '54%', rotate: '8deg' },
    { name: 'documentation', size: 55, left: '76%', rotate: '-12deg' },
  ] as const;

  const bottomIcons = [
    { name: 'bubble', size: 60, left: '8%', rotate: '-15deg' },
    { name: 'intercom', size: 65, left: '30%', rotate: '12deg' },
    { name: 'fin', size: 60, left: '54%', rotate: '-8deg' },
    { name: 'browsercursor', size: 55, left: '76%', rotate: '-12deg' },
  ] as const;

  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden">
        {topIcons.map((icon) => (
          <img
            key={icon.name}
            src={mediaClient.getTileMediaUrl(`tiles/${icon.name}.webp`)}
            alt=""
            width={icon.size}
            height={icon.size}
            className="absolute top-[-16px] transition-transform duration-300 hover:-translate-y-1 hover:scale-110 cursor-pointer"
            style={{ left: icon.left, transform: `rotate(${icon.rotate})` }}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
        {bottomIcons.map((icon) => (
          <img
            key={icon.name}
            src={mediaClient.getTileMediaUrl(`tiles/${icon.name}.webp`)}
            alt=""
            width={icon.size}
            height={icon.size}
            className="absolute bottom-[-16px] transition-transform duration-300 hover:translate-y-1 hover:scale-110 cursor-pointer"
            style={{ left: icon.left, transform: `rotate(${icon.rotate})` }}
          />
        ))}
      </div>
    </>
  );
}

export function LoginPrompt({ onRefresh, onSignIn }: LoginPromptProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-background overflow-hidden">
      <div className="flex flex-col items-center gap-8 px-8 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <p className="text-sm text-muted-foreground text-center">Quick auth and you&apos;re in</p>
        </div>

        <Button
          onClick={onSignIn}
          variant="secondary"
          size="lg"
          className="w-full max-w-[280px] px-7 py-6"
        >
          Sign in to continue
        </Button>

        <button
          type="button"
          onClick={onRefresh}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Already signed in? Refresh
        </button>
      </div>

      <DecorativeIcons />
    </div>
  );
}
