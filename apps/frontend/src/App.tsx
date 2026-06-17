import { useState } from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddUserForm } from '@/features/users/add-user-form';
import { StatsCard } from '@/features/users/stats-card';
import { UsersList } from '@/features/users/users-list';
import { useUsers } from '@/features/users/use-users';
import { getTotalPages } from '@/features/users/utils';

export function App() {
  const [page, setPage] = useState(1);

  const usersQuery = useUsers(page);
  const data = usersQuery.data;

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize;
  const totalPages = pageSize ? getTotalPages(total, pageSize) : 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              User Management
            </h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside
            aria-label="Add user and stats"
            className="flex w-full flex-col gap-4 lg:w-96"
          >
            <Card>
              <CardHeader>
                <CardTitle>Add user</CardTitle>
              </CardHeader>
              <CardContent>
                <AddUserForm onCreated={() => setPage(1)} />
              </CardContent>
            </Card>
            <StatsCard total={total} totalPages={totalPages} />
          </aside>

          <section aria-label="Users" className="flex-1">
            <UsersList
              users={users}
              total={total}
              page={page}
              pageSize={pageSize ?? 0}
              totalPages={totalPages}
              onPageChange={setPage}
              isLoading={usersQuery.isLoading}
              isError={usersQuery.isError}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
