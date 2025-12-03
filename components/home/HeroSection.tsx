import Image from "next/image";
import { Button } from "~/components/ui/button";

interface HeroSectionProps {
  hero: {
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
  };
  formatDate: (timestamp: number) => string;
}

export function HeroSection({ hero, formatDate }: HeroSectionProps) {
  // Use artist name if available, otherwise use event title without " in [City]"
  const displayTitle = hero.artist?.name || hero.title.replace(/ (Live )?in .+$/, '');
  const imageUrl = hero.images[0] || hero.artist?.image;

  return (
    <section className="relative overflow-hidden text-white min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
      {/* Background Image */}
      {imageUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={imageUrl}
            alt={displayTitle}
            fill
            className="object-cover object-top"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-transparent" />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 px-6 py-12 md:py-16 lg:py-20 flex items-center min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4">
            {displayTitle}
          </h1>
          <p className="text-lg md:text-xl mb-2">{hero.venue.name}</p>
          <p className="text-base md:text-lg mb-4 md:mb-6">
            {formatDate(hero.startTime)} • {hero.venue.city}
          </p>
          <Button
            size="lg"
            className="bg-[#0A23F0] hover:bg-[#0819c7] text-white w-full md:w-auto transition-colors shadow-lg hover:shadow-xl font-semibold"
          >
            Find Tickets
          </Button>
        </div>
      </div>
    </section>
  );
}
