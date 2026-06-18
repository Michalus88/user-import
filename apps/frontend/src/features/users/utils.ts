const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-100', text: 'text-rose-900' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
] as const;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getInitials(username: string): string {
  const cleaned = username.trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/);
  const letters =
    parts.length === 1
      ? cleaned.slice(0, 2)
      : `${parts[0][0]}${parts[1][0]}`;
  return letters.toUpperCase();
}

export function getAvatarColor(email: string): (typeof AVATAR_COLORS)[number] {
  const seed = email ? email.charCodeAt(0) : 0;
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

const DATE_FORMATTER = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return DATE_FORMATTER.format(date).replace(/\./g, '');
}

export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}
