import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';

/** Same footprint as the loaded balance, so nothing shifts when it arrives (UIR-HOME-02). */
export function BalanceSkeleton() {
  return (
    <SkeletonGroup className="flex flex-col gap-3">
      <Skeleton className="h-10 w-56 sm:h-12" />
      <Skeleton className="h-5 w-28" />
    </SkeletonGroup>
  );
}

export function ActivitySkeleton({ rows = 5 }: { readonly rows?: number }) {
  return (
    <SkeletonGroup className="flex flex-col">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-2 py-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </SkeletonGroup>
  );
}
