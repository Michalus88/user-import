import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  total: number;
  totalPages: number;
}

export function StatsCard({ total, totalPages }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-3 p-3">
        <div className="rounded-lg bg-primary-soft p-3">
          <div className="text-xs font-medium text-primary-soft-foreground">
            Users
          </div>
          <div className="text-2xl font-semibold text-primary-soft-foreground">
            {total}
          </div>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <div className="text-xs font-medium text-gray-600">Pages</div>
          <div className="text-2xl font-semibold text-foreground">
            {totalPages}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
