import { cn } from '@workspace/ui/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  showText?: boolean;
  theme?: 'dark' | 'light';
}

const sizeVariants = {
  sm: { text: 'text-lg', icon: 'h-5 w-5' },
  md: { text: 'text-2xl', icon: 'h-7 w-7' },
  lg: { text: 'text-3xl', icon: 'h-9 w-9' },
};

export default function Logo({
  className,
  size = 'md',
  href,
  showText = true,
  theme = 'dark',
}: LogoProps) {
  const logoContent = (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src={`/logo-${theme}.svg`}
        alt="Userplane"
        className={cn(sizeVariants[size].icon, 'shrink-0')}
      />
      {showText && (
        <span className={cn('font-dm-sans font-semibold tracking-tight', sizeVariants[size].text)}>
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
