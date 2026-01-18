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
        colors={['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']}
      />
    </div>
  );
}
