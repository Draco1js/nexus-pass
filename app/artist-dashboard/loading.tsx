import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent } from "~/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="bg-linear-to-r from-tm-blue to-purple-600 rounded-2xl p-6 lg:p-8 text-white">
        <Skeleton className="h-8 w-64 mb-2 bg-white/20" />
        <Skeleton className="h-4 w-96 bg-white/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

