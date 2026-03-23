import { Skeleton } from '@/components/ui/skeleton';

const PropertyCardSkeleton = () => (
  <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-7 w-14 rounded" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3.5 w-1/2" />
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  </div>
);

export default PropertyCardSkeleton;
