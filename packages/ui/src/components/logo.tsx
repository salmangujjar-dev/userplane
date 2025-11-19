import { cn } from '@workspace/ui/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

const sizeVariants = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export default function Logo({ className, size = 'md', href }: LogoProps) {
  const logoText = (
    <span
      className={cn('font-dm-sans font-semibold tracking-tight', sizeVariants[size], className)}
    >
      Subsignal
    </span>
  );

  if (href) {
    return (
      <a href={href} aria-label="Go to Subsignal homepage">
        {logoText}
      </a>
    );
  }

  return logoText;
}
