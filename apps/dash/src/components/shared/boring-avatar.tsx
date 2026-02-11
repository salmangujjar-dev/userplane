import { cn } from '@workspace/ui/lib/utils';
import Avatar from 'boring-avatars';

interface BoringAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function BoringAvatar({ name, size = 40, className }: BoringAvatarProps) {
  return (
    <div
      className={cn('shrink-0 rounded-full overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        name={name}
        variant="beam"
        colors={['#0f0f0f', '#5597dd', '#2d7dd2', '#f5d547', '#f2f2f2']}
      />
    </div>
  );
}
