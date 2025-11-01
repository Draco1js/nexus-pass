import { ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { EventCard } from "./EventCard";

interface Event {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  startTime: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
  venue: {
    name: string;
    city: string;
  };
  artist?: {
    name: string;
    image?: string;
  } | null;
  isPresale?: boolean;
}

interface CityGroup {
  city: string;
  events: Event[];
}

interface PopularNearYouProps {
  cityGroups: CityGroup[];
  formatDate: (timestamp: number) => string;
}

export function PopularNearYou({ cityGroups, formatDate }: PopularNearYouProps) {
  if (!cityGroups || cityGroups.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
        POPULAR NEAR YOU
      </h2>
      {cityGroups.map((group) => (
        <div key={group.city} className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-lg md:text-xl font-semibold">{group.city}</h3>
            <Button variant="ghost" size="sm" className="hidden md:flex">
              See All <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide">
            {group.events
              .filter((e): e is NonNullable<typeof e> => e !== null)
              .map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  variant="city"
                  formatDate={formatDate}
                />
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}
