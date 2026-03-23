import { Skeleton } from '@/components/ui/skeleton';

const PropertyDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Breadcrumb skeleton */}
    <div className="container mx-auto px-4 py-2">
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Gallery skeleton */}
    <Skeleton className="w-full h-[250px] sm:h-[300px] md:h-[450px] rounded-none" />

    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title card */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-9 w-36 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-6 pt-4 border-t border-border">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-5 w-24" />
              ))}
            </div>
          </div>

          {/* Overview */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-32 w-32 rounded-lg" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
            <div className="flex gap-0 border-t border-border pt-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="flex-1 h-10 rounded-lg mx-1" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PropertyDetailSkeleton;
