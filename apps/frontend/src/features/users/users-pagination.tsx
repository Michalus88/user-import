import { useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsersPaginationProps {
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  onPageChange: (next: number) => void;
}

const WINDOW_SIZE = 3;

function getPageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= WINDOW_SIZE) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (page <= 1) return [1, 2, 3];
  if (page >= totalPages) return [totalPages - 2, totalPages - 1, totalPages];
  return [page - 1, page, page + 1];
}

export function UsersPagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  total,
  onPageChange,
}: UsersPaginationProps) {
  const [goToValue, setGoToValue] = useState('');

  const pageWindow = getPageWindow(page, totalPages);

  function handleGoToChange(e: ChangeEvent<HTMLInputElement>) {
    setGoToValue(e.target.value);
  }

  function handleGoToSubmit() {
    const parsed = parseInt(goToValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
      setGoToValue('');
    }
  }

  function handleGoToKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleGoToSubmit();
  }

  return (
    <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-background px-5 py-[11px]">
      <span className="font-mono text-[11px] text-subtle">
        {total > 0
          ? `Pokazano ${rangeStart}–${rangeEnd} z ${total.toLocaleString()}`
          : ''}
      </span>

      <div className="flex items-center gap-1.5">
        {/* Page buttons */}
        <div className="flex items-center gap-0.5">
          <PageBtn
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label="Pierwsza strona"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </PageBtn>
          <PageBtn
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Poprzednia strona"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </PageBtn>

          {pageWindow.map((item) => (
            <PageBtn
              key={item}
              active={item === page}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </PageBtn>
          ))}

          <PageBtn
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Następna strona"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </PageBtn>
          <PageBtn
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Ostatnia strona"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </PageBtn>
        </div>

        {/* Separator */}
        <div className="mx-2 h-5 w-px bg-border" />

        {/* Go to */}
        <span className="mr-1.5 text-xs text-muted-foreground">Idź do</span>
        <div className="flex h-8">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={goToValue}
            onChange={handleGoToChange}
            onKeyDown={handleGoToKeyDown}
            onFocus={(e) => e.target.select()}
            placeholder="—"
            aria-label={`Idź do strony, od 1 do ${totalPages}`}
            className="w-[52px] rounded-l-lg border border-border border-r-0 bg-white px-2 text-center font-mono text-sm text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
          />
          <button
            type="button"
            onClick={handleGoToSubmit}
            className="rounded-r-lg bg-primary px-3 font-sans text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Idź
          </button>
        </div>
      </div>
    </div>
  );
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
  'aria-current'?: 'page' | undefined;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={cn(
        'flex h-8 min-w-8 items-center justify-center rounded-lg border border-transparent px-1.5 font-mono text-[13px] font-medium transition-all',
        active
          ? 'cursor-default bg-primary text-primary-foreground'
          : 'text-foreground hover:border-primary-mid hover:bg-primary-soft hover:text-primary',
        disabled && 'cursor-not-allowed opacity-30',
      )}
    >
      {children}
    </button>
  );
}
