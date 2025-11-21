"use client";

import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Header } from "~/components/home/Header";
import { HeroSection } from "~/components/home/HeroSection";
import { FeaturedEvents } from "~/components/home/FeaturedEvents";
import { PresalesSection } from "~/components/home/PresalesSection";
import { PopularNearYou } from "~/components/home/PopularNearYou";
import { EditorsPicksSection } from "~/components/home/EditorsPicksSection";
import { Sidebar } from "~/components/home/Sidebar";
import { Footer } from "~/components/home/Footer";
import { EventCardSkeleton } from "~/components/home/EventCardSkeleton";
import { Skeleton } from "~/components/ui/skeleton";

export default function HomePage() {
  const data = useQuery(api.events.homepageHighlights, { city: null });
  const isLoading = data === undefined;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {isLoading ? (
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
      ) : (
        data?.hero && <HeroSection hero={data.hero} formatDate={formatDate} />
      )}

      <div className="px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8 md:space-y-12">
            {isLoading ? (
              <>
                <section>
                  <Skeleton className="h-7 w-32 mb-4 md:mb-6" />
                  <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide">
                    {[...Array(4)].map((_, i) => (
                      <EventCardSkeleton key={i} variant="featured" />
                    ))}
                  </div>
                </section>
                <section>
                  <Skeleton className="h-7 w-64 mb-4 md:mb-6" />
                  <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide">
                    {[...Array(6)].map((_, i) => (
                      <EventCardSkeleton key={i} variant="presale" />
                    ))}
                  </div>
                </section>
                <section>
                  <Skeleton className="h-7 w-48 mb-4 md:mb-6" />
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="mb-6 md:mb-8">
                      <Skeleton className="h-6 w-24 mb-3 md:mb-4" />
                      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide">
                        {[...Array(4)].map((_, j) => (
                          <EventCardSkeleton key={j} variant="city" />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
                <section>
                  <Skeleton className="h-7 w-32 mb-4 md:mb-6" />
                  <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide">
                    {[...Array(6)].map((_, i) => (
                      <EventCardSkeleton key={i} variant="editors" />
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <>
                <FeaturedEvents 
                  events={data?.featured ? data.featured.filter((e): e is NonNullable<typeof e> => e !== null) : []} 
                  formatDate={formatDate} 
                />
                
                <PresalesSection
                  events={data?.presales ? data.presales.filter((e): e is NonNullable<typeof e> => e !== null) : []}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
                
                <PopularNearYou
                  cityGroups={data?.cityGroups ? data.cityGroups.map(g => ({ 
                    ...g, 
                    events: g.events.filter((e): e is NonNullable<typeof e> => e !== null) 
                  })) : []}
                  formatDate={formatDate}
                />
                
                <EditorsPicksSection
                  events={data?.editorsPicks ? data.editorsPicks.filter((e): e is NonNullable<typeof e> => e !== null) : []}
                  formatDate={formatDate}
                />
              </>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>

      <Footer />
    </div>
  );
}
