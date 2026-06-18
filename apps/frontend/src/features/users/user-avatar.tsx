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
        'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] font-syne text-[11px] font-bold tracking-[0.03em]',
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
