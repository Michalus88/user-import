import { useState } from 'react';
import { Users, UserPlus, Upload } from 'lucide-react';
import { AddUserForm } from '@/features/users/add-user-form';
import { UsersList } from '@/features/users/users-list';
import { StatsCard } from '@/features/users/stats-card';
import { useUsers } from '@/features/users/use-users';
import { getTotalPages } from '@/features/users/utils';
import { CsvUploadPanel } from '@/features/csv-import/csv-upload-panel';
import { cn } from '@/lib/utils';

type ActiveTab = 'add-user' | 'import-csv';

const TABS: { id: ActiveTab; label: string; Icon: typeof UserPlus }[] = [
  { id: 'add-user', label: 'Add User', Icon: UserPlus },
  { id: 'import-csv', label: 'Import CSV', Icon: Upload },
];

export function App() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<ActiveTab>('add-user');

  const usersQuery = useUsers(page);
  const data = usersQuery.data;

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 10;
  const totalPages = pageSize ? getTotalPages(total, pageSize) : 1;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card px-8 py-[14px]">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
            <Users className="h-[18px] w-[18px]" aria-hidden />
          </div>
          <div>
            <div className="font-syne text-[15px] font-bold leading-none text-foreground">
              User Management
            </div>
            <div className="mt-0.5 text-[11px] text-subtle">Admin Panel</div>
          </div>
        </div>
      </header>

      {/* Main — scrollable on small screens, fixed-height on lg+ */}
      <main className="flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-7 py-7 lg:h-full lg:flex-row">

          {/* Left panel */}
          <aside className="flex w-full flex-col gap-4 lg:w-[400px] lg:shrink-0">
            {/* Form card */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex-1">
              {/* Tab switcher */}
              <div className="flex gap-1 border-b border-border bg-background p-1.5">
                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === id}
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center gap-[7px] rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',
                      activeTab === id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-primary-soft hover:text-primary',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex flex-col overflow-auto p-5">
                {activeTab === 'add-user' ? (
                  <AddUserForm onCreated={() => setPage(1)} />
                ) : (
                  <CsvUploadPanel onImported={() => setPage(1)} />
                )}
              </div>
            </div>

            {/* Stats card — visible only in add-user tab */}
            {activeTab === 'add-user' && (
              <StatsCard total={total} pageSize={pageSize} />
            )}
          </aside>

          {/* Right panel — users table */}
          <section
            aria-label="Users"
            className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex-1"
          >
            <UsersList
              users={users}
              total={total}
              page={page}
              pageSize={pageSize}
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
