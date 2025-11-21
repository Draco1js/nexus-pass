import Image from "next/image";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

interface EventCardProps {
  event: {
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
  };
  variant?: "featured" | "presale" | "city" | "editors";
  formatDate: (timestamp: number) => string;
  formatTime?: (timestamp: number) => string;
}

export function EventCard({
  event,
  variant = "featured",
  formatDate,
  formatTime,
}: EventCardProps) {
  const isPresale = variant === "presale" || event.isPresale;
  const isCity = variant === "city";
  const isEditors = variant === "editors";
  
  // Use artist name if available, otherwise use event title without " in [City]"
  const displayTitle = event.artist?.name || event.title.replace(/ (Live )?in .+$/, '');
  
  // Get the first image or use artist image as fallback
  const imageUrl = event.images[0] || event.artist?.image;

  return (
    <Card
      className={`overflow-hidden p-0 ${isPresale ? "relative" : ""} hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer ${isCity ? "min-w-[240px]" : isEditors ? "min-w-[280px] max-w-[280px] md:max-w-none" : "min-w-[280px]"} md:min-w-0 shrink-0 md:shrink bg-white`}
    >
      {isPresale && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded font-semibold z-10">
          PRE-SALE
        </div>
      )}
      <div
        className="aspect-video relative w-full overflow-hidden bg-gray-200"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayTitle}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{displayTitle.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="p-3 md:p-4">
        <h3
          className={`font-bold ${isCity ? "text-sm md:text-base" : "text-base md:text-lg"} ${isCity ? "mb-1" : "mb-2"} hover:text-[#0A23F0] transition-colors line-clamp-2`}
        >
          {displayTitle}
        </h3>
        {isEditors && event.description && (
          <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2 wrap-break-word">
            {event.description}
          </p>
        )}
        {!isEditors && (
          <p className="text-xs md:text-sm text-gray-600 mb-2">
            {formatDate(event.startTime)}
            {isPresale && formatTime && ` • ${formatTime(event.startTime)}`}
          </p>
        )}
        {!isCity && !isPresale && !isEditors && (
          <p className="text-xs md:text-sm text-gray-600 mb-2">
            {event.venue.name} • {event.venue.city}
          </p>
        )}
        {isCity && (
          <p className="text-xs md:text-sm text-gray-600 mb-2">
            {event.venue.name}
          </p>
        )}
        {isPresale && (
          <p className="text-xs md:text-sm text-gray-600 mb-2">
            {event.venue.name}, {event.venue.city}
          </p>
        )}
        {!isCity && (
          <Button
            variant={isPresale || isEditors ? "outline" : "default"}
            className={`w-full text-sm ${
              isPresale || isEditors
                ? "hover:bg-[#0A23F0] hover:text-white hover:border-[#0A23F0]"
                : "bg-[#0A23F0] hover:bg-[#0819c7] text-white"
            } transition-colors`}
          >
            {isPresale
              ? "Set Reminder"
              : isEditors
                ? "Discover More"
                : "View Tickets"}
          </Button>
        )}
      </div>
    </Card>
  );
}
