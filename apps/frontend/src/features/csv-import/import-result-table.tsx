import { useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImportResult } from '@shared/types';
import { cn } from '@/lib/utils';
import { translateErrorCode } from './error-code-map';

const ERR_PAGE_SIZE = 10;

interface ImportResultTableProps {
  result: ImportResult;
}

export function ImportResultTable({ result }: ImportResultTableProps) {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [errPage, setErrPage] = useState(1);
  const [gotoValue, setGotoValue] = useState('');

  const codeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of result.errors) {
      map.set(e.code, (map.get(e.code) ?? 0) + 1);
    }
    return map;
  }, [result.errors]);

  const filteredErrors = useMemo(
    () =>
      activeCode === null
        ? result.errors
        : result.errors.filter((e) => e.code === activeCode),
    [result.errors, activeCode],
  );

  const totalErrPages = Math.max(1, Math.ceil(filteredErrors.length / ERR_PAGE_SIZE));
  const clampedPage = Math.min(errPage, totalErrPages);
  const visibleErrors = filteredErrors.slice(
    (clampedPage - 1) * ERR_PAGE_SIZE,
    clampedPage * ERR_PAGE_SIZE,
  );

  function handleFilterChange(code: string | null) {
    setActiveCode(code);
    setErrPage(1);
    setGotoValue('');
  }

  function goErrPage(p: number) {
    setErrPage(Math.max(1, Math.min(totalErrPages, p)));
  }

  function handleGotoChange(e: ChangeEvent<HTMLInputElement>) {
    setGotoValue(e.target.value);
  }

  function handleGotoSubmit() {
    const parsed = parseInt(gotoValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalErrPages) {
      goErrPage(parsed);
      setGotoValue('');
    }
  }

  function handleGotoKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleGotoSubmit();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-[10px] border border-emerald-200 bg-emerald-50 py-2.5 text-center">
          <div className="font-syne text-xl font-bold leading-none text-emerald-600">
            {result.inserted.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-emerald-700">
            Zapisane
          </div>
        </div>
        <div className="flex-1 rounded-[10px] border border-amber-200 bg-amber-50 py-2.5 text-center">
          <div className="font-syne text-xl font-bold leading-none text-amber-600">
            {result.skipped.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-amber-700">
            Pominięte
          </div>
        </div>
        <div className="flex-1 rounded-[10px] border border-border bg-background py-2.5 text-center">
          <div className="font-syne text-xl font-bold leading-none text-foreground">
            {result.total.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            Razem
          </div>
        </div>
      </div>

      {result.errors.length > 0 && (
        <>
          {/* Filter chips — show per-code chips only when multiple error types exist */}
          {codeCounts.size > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <ErrorChip
                label="Wszystkie"
                count={result.errors.length}
                active={activeCode === null}
                onClick={() => handleFilterChange(null)}
              />
              {Array.from(codeCounts).map(([code, count]) => (
                <ErrorChip
                  key={code}
                  label={translateErrorCode(code)}
                  count={count}
                  active={activeCode === code}
                  onClick={() =>
                    handleFilterChange(activeCode === code ? null : code)
                  }
                />
              ))}
            </div>
          )}

          <p className="sr-only">Błędy wierszy ({result.errors.length})</p>

          {/* Error table */}
          <div className="flex flex-col overflow-hidden rounded-[10px] border border-border">
            <div className="overflow-hidden">
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '50px' }} />
                  <col style={{ width: '50%' }} />
                  <col style={{ width: '50%' }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="h-[34px] px-3 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-subtle">
                      Wiersz
                    </th>
                    <th className="h-[34px] px-3 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-subtle">
                      Pole
                    </th>
                    <th className="h-[34px] px-3 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-subtle">
                      Błąd
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleErrors.map((err, i) => (
                    <tr
                      key={i}
                      className="h-[36px] border-b border-border last:border-b-0"
                    >
                      <td className="px-3 font-mono text-xs text-subtle">
                        {err.row}
                      </td>
                      <td className="px-3 font-mono text-xs text-muted-foreground">
                        {err.field}
                      </td>
                      <td className="overflow-hidden text-ellipsis whitespace-nowrap px-3 text-xs text-foreground">
                        {translateErrorCode(err.code)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Error table pagination */}
            {totalErrPages > 1 && (
              <div className="flex h-10 flex-shrink-0 items-center justify-between border-t border-border bg-background px-3">
                <span className="font-mono text-[11px] text-subtle">
                  {filteredErrors.length > 0
                    ? `${(clampedPage - 1) * ERR_PAGE_SIZE + 1}–${Math.min(clampedPage * ERR_PAGE_SIZE, filteredErrors.length)} z ${filteredErrors.length.toLocaleString()}`
                    : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={clampedPage <= 1}
                    onClick={() => goErrPage(clampedPage - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[52px] text-center font-mono text-xs text-foreground">
                    {clampedPage} / {totalErrPages}
                  </span>
                  <button
                    type="button"
                    disabled={clampedPage >= totalErrPages}
                    onClick={() => goErrPage(clampedPage + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <div className="mx-1.5 h-4 w-px bg-border" />
                  <div className="flex h-7">
                    <input
                      type="number"
                      min={1}
                      max={totalErrPages}
                      value={gotoValue}
                      onChange={handleGotoChange}
                      onKeyDown={handleGotoKeyDown}
                      onFocus={(e) => e.target.select()}
                      placeholder="—"
                      aria-label={`Idź do strony, od 1 do ${totalErrPages}`}
                      className="w-10 rounded-l-[6px] border border-border border-r-0 bg-white px-1.5 text-center font-mono text-xs text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.12)]"
                    />
                    <button
                      type="button"
                      onClick={handleGotoSubmit}
                      className="rounded-r-[6px] bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                    >
                      Idź
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ErrorChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary-mid hover:text-primary',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-1 text-[10px] font-bold',
          active ? 'bg-white/20 text-white' : 'bg-border text-subtle',
        )}
      >
        {count}
      </span>
    </button>
  );
}
