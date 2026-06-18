import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UsersPaginationProps {
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  onPageChange: (next: number) => void;
}

const MAX_VISIBLE = 5;

function getPageWindow(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= MAX_VISIBLE) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const items: (number | 'ellipsis')[] = [1];
  const inner = [page - 1, page, page + 1].filter(
    (n) => n > 1 && n < totalPages,
  );
  if (inner[0] !== undefined && inner[0] > 2) items.push('ellipsis');
  for (const n of inner) items.push(n);
  if (
    inner[inner.length - 1] !== undefined &&
    (inner[inner.length - 1] as number) < totalPages - 1
  ) {
    items.push('ellipsis');
  }
  items.push(totalPages);
  return items;
}

export function UsersPagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  total,
  onPageChange,
}: UsersPaginationProps) {
  const window = getPageWindow(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {rangeStart}-{rangeEnd} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {window.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-sm text-muted-foreground"
              aria-hidden
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(item)}
              className={cn(
                'text-sm',
                item === page &&
                  'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
              )}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
