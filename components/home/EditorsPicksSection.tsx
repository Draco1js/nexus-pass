import { EventCard } from "./EventCard";

interface Event {
  _id: string;
  title: string;
  slug: string;
  description?: string;
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

interface EditorsPicksSectionProps {
  events: Event[];
  formatDate: (timestamp: number) => string;
}

export function EditorsPicksSection({
  events,
  formatDate,
}: EditorsPicksSectionProps) {
  if (!events || events.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
        WHAT TO SEE
      </h2>
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide">
        {events
          .filter((e): e is NonNullable<typeof e> => e !== null)
          .map((event) => (
            <EventCard
              key={event._id}
              event={event}
              variant="editors"
              formatDate={formatDate}
            />
          ))}
      </div>
    </section>
  );
}
