"use client";

import { usePreloadedQuery } from "convex/react";
import { Preloaded } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Header } from "~/components/home/Header";
import { HeroSection } from "~/components/home/HeroSection";
import { FeaturedEvents } from "~/components/home/FeaturedEvents";
import { PresalesSection } from "~/components/home/PresalesSection";
import { PopularNearYou } from "~/components/home/PopularNearYou";
import { EditorsPicksSection } from "~/components/home/EditorsPicksSection";
import { Sidebar } from "~/components/home/Sidebar";
import { Footer } from "~/components/home/Footer";

interface HomePageContentProps {
  preloaded: Preloaded<typeof api.events.homepageHighlights>;
}

export function HomePageContent({ preloaded }: HomePageContentProps) {
  // Use preloaded data, then subscribe to real-time updates
  const data = usePreloadedQuery(preloaded);

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

      {data?.hero && <HeroSection hero={data.hero} formatDate={formatDate} />}

      <div className="px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8 md:space-y-12">
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
          </div>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>

      <Footer />
    </div>
  );
}

