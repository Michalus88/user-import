import { Users } from 'lucide-react';
import type { IUser } from '@shared/types';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-base font-semibold text-foreground">Users</h2>
        <p className="text-xs text-muted-foreground">{total} results</p>
      </div>
      {isError ? (
        <EmptyState
          title="Could not load users"
          subtitle="Please try refreshing the page."
        />
      ) : isLoading && users.length === 0 ? (
        <EmptyState title="Loading users…" />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users yet"
          subtitle="Add your first user using the form on the left."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      username={user.username}
                      email={user.email}
                    />
                    <span className="font-medium text-foreground">
                      {user.username}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {totalPages > 1 && (
        <UsersPagination
          page={page}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </Card>
  );
}

function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-gray-400">
        <Users className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
