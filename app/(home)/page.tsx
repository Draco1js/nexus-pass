import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { HomePageContent } from "~/components/home/HomePageContent";
import { Suspense } from "react";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { Skeleton } from "~/components/ui/skeleton";
import { EventCardSkeleton } from "~/components/home/EventCardSkeleton";

function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
        <section className="relative overflow-hidden min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
          <Skeleton className="absolute inset-0 w-full h-full" />
          <div className="relative z-10 px-6 py-12 md:py-16 lg:py-20 flex items-center min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
            <div className="max-w-4xl space-y-4">
              <Skeleton className="h-12 md:h-16 lg:h-20 w-3/4" />
              <Skeleton className="h-6 md:h-7 w-1/2" />
              <Skeleton className="h-5 md:h-6 w-1/3" />
              <Skeleton className="h-12 w-32 md:w-40" />
            </div>
          </div>
        </section>
      <div className="px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="lg:col-span-3 space-y-8 md:space-y-12">
                <section>
                  <Skeleton className="h-7 w-32 mb-4 md:mb-6" />
                  <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide">
                    {[...Array(4)].map((_, i) => (
                      <EventCardSkeleton key={i} variant="featured" />
                    ))}
                  </div>
                </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default async function HomePage() {
  // Preload data on the server for instant rendering
  const preloaded = await preloadQuery(api.events.homepageHighlights, { city: null });

  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent preloaded={preloaded} />
    </Suspense>
  );
}
