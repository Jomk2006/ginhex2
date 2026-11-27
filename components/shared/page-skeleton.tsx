import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Route-level loading placeholder: header, optional KPI row, card grid or table.
 * Matches the real layout's block sizes so content swaps in without layout shift.
 */
export function PageSkeleton({
  stats = 0,
  cards = 0,
  rows = 0,
}: {
  stats?: number;
  cards?: number;
  rows?: number;
}) {
  const t = useTranslations("common");
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-8">
      <span className="sr-only">{t("loading")}</span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <Skeleton className="h-0.5 w-10" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {stats > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => (
            <Card key={i} variant="flat" className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-10 rounded-[0.875rem]" />
              </div>
              <Skeleton className="h-10 w-16" />
            </Card>
          ))}
        </div>
      )}

      {cards > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }, (_, i) => (
            <Card key={i} variant="flat" className="overflow-hidden">
              <Skeleton className="h-24 w-full rounded-none" />
              <div className="flex flex-col gap-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {rows > 0 && (
        <div className="gx-table-wrap">
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="ms-auto h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
