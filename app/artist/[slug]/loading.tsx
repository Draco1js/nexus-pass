import { Skeleton } from "~/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        <Skeleton className="aspect-[21/9] w-full" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

