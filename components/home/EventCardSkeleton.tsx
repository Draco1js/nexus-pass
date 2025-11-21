import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

interface EventCardSkeletonProps {
  variant?: "featured" | "presale" | "city" | "editors";
}

export function EventCardSkeleton({ variant = "featured" }: EventCardSkeletonProps) {
  const isCity = variant === "city";
  
  return (
    <Card
      className={`overflow-hidden p-0 ${isCity ? "min-w-[240px]" : "min-w-[280px]"} md:min-w-0 shrink-0 md:shrink bg-white`}
    >
      <div className="aspect-video relative w-full overflow-hidden bg-gray-200">
        <Skeleton className="absolute inset-0 w-full h-full" />
      </div>
      <div className="p-3 md:p-4">
        <Skeleton className={`h-4 ${isCity ? "w-3/4" : "w-full"} mb-2`} />
        <Skeleton className={`h-3 ${isCity ? "w-1/2" : "w-2/3"} mb-2`} />
        {!isCity && variant !== "editors" && (
          <Skeleton className="h-3 w-1/2 mb-3 md:mb-4" />
        )}
        {variant === "editors" && (
          <>
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-5/6 mb-3 md:mb-4" />
          </>
        )}
        {variant !== "city" && (
          <Skeleton className="h-9 w-full rounded-md" />
        )}
      </div>
    </Card>
  );
}

