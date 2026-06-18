interface StatsCardProps {
  total: number;
  pageSize: number;
}

export function StatsCard({ total, pageSize }: StatsCardProps) {
  return (
    <div className="shrink-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-subtle">
        Overview
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-primary-soft p-3.5">
          <div className="font-syne text-[26px] font-bold leading-none text-primary">
            {total.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] font-medium text-primary-soft-foreground">
            Total users
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-3.5">
          <div className="font-syne text-[26px] font-bold leading-none text-foreground">
            {pageSize > 0 ? Math.ceil(total / pageSize) : 0}
          </div>
          <div className="mt-1 text-[11px] font-medium text-muted-foreground">
            Pages ({pageSize}/pg)
          </div>
        </div>
      </div>
    </div>
  );
}
