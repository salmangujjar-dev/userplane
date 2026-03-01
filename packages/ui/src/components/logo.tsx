import { cn } from '@userplane/ui/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  showText?: boolean;
  theme?: 'dark' | 'light';
  variant?: 'default' | 'tiled';
}

const sizeVariants = {
  sm: { text: 'text-lg', icon: 'h-5 w-5' },
  md: { text: 'text-2xl', icon: 'h-7 w-7' },
  lg: { text: 'text-3xl', icon: 'h-9 w-9' },
};

const tiledSizes = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export default function Logo({
  className,
  size = 'md',
  href,
  showText = true,
  theme = 'dark',
  variant = 'default',
}: LogoProps) {
  const logoContent =
    variant === 'tiled' ? (
      <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-white shadow-sm p-3">
        <img
          src={`/logo-${theme}.svg`}
          alt="Userplane"
          className={cn(tiledSizes[size], 'object-contain')}
        />
      </div>
    ) : (
      <div className={cn('flex items-center gap-2', className)}>
        <img
          src={`/logo-${theme}.svg`}
          alt="Userplane"
          className={cn(sizeVariants[size].icon, 'shrink-0')}
        />
        {showText && (
          <span className={cn('font-semibold tracking-tight', sizeVariants[size].text)}>
            Userplane
          </span>
        )}
      </div>
    );

  if (href) {
    return (
      <a href={href} aria-label="Go to Userplane homepage">
        {logoContent}
      </a>
    );
  }

  return logoContent;
}
