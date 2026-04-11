import { cn } from '../utils';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-lime-500',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function Avatar({
  name,
  size = 'sm',
  className,
}: {
  name: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const colorClass = AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClass =
    size === 'xs' ? 'size-5 text-[10px]' : size === 'sm' ? 'size-6 text-xs' : 'size-8 text-sm';

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium text-white shrink-0',
        colorClass,
        sizeClass,
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
