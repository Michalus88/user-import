import { cn } from '@/lib/utils';
import { getAvatarColor, getInitials } from './utils';

interface UserAvatarProps {
  username: string;
  email: string;
  className?: string;
}

export function UserAvatar({ username, email, className }: UserAvatarProps) {
  const color = getAvatarColor(email);
  return (
    <div
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold',
        color.bg,
        color.text,
        className,
      )}
      aria-hidden
    >
      {getInitials(username)}
    </div>
  );
}
