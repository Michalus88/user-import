import type { IUser } from '@shared/types';
import { USERS_PAGE_SIZE } from '@shared/constants';
import { UsersPagination } from './users-pagination';
import { UserAvatar } from './user-avatar';
import { formatDate } from './utils';

interface UsersListProps {
  users: IUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  isLoading: boolean;
  isError: boolean;
}

export function UsersList({
  users,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  isLoading,
  isError,
}: UsersListProps) {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const phantomCount = Math.max(0, USERS_PAGE_SIZE - users.length);

  return (
    <>
      {/* Panel header */}
      <div className="flex-shrink-0 border-b border-border px-5 py-4">
        <div className="font-syne text-[15px] font-bold text-foreground">Użytkownicy</div>
        {!isLoading && !isError && (
          <div className="mt-0.5 font-mono text-[11px] text-subtle">
            {total.toLocaleString()} wyników · strona {page} z {totalPages}
          </div>
        )}
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-hidden">
        {isError ? (
          <EmptyRows message="Nie udało się załadować użytkowników. Spróbuj odświeżyć." />
        ) : isLoading && users.length === 0 ? (
          <EmptyRows message="Ładowanie użytkowników…" />
        ) : users.length === 0 ? (
          <EmptyRows message="Brak użytkowników" />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="h-[38px] px-5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-subtle">
                  Użytkownik
                </th>
                <th className="h-[38px] px-5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-subtle">
                  E-mail
                </th>
                <th className="h-[38px] px-5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-subtle">
                  Dodano
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="h-[52px] border-b border-border transition-colors hover:bg-primary-soft"
                >
                  <td className="px-5">
                    <div className="flex items-center gap-[11px]">
                      <UserAvatar username={user.username} email={user.email} />
                      <span className="text-sm font-medium text-foreground">
                        {user.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-5">
                    <span className="font-mono text-[13px] text-muted-foreground">
                      {user.email}
                    </span>
                  </td>
                  <td className="px-5">
                    <span className="font-mono text-[12px] text-subtle">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
              {Array.from({ length: phantomCount }).map((_, i) => (
                <tr
                  key={`ph-${i}`}
                  className="h-[52px] border-b border-border last:border-b-0"
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <UsersPagination
        page={page}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        total={total}
        onPageChange={onPageChange}
      />
    </>
  );
}

function EmptyRows({ message }: { message: string }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {Array.from({ length: USERS_PAGE_SIZE }).map((_, i) => (
          <tr
            key={i}
            className="h-[52px] border-b border-border last:border-b-0"
          >
            {i === 0 && (
              <td
                colSpan={3}
                className="px-5 text-sm text-subtle"
              >
                {message}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
