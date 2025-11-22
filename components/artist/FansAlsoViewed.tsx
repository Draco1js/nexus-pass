"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import { Card } from "~/components/ui/card";

interface FansAlsoViewedProps {
  currentArtistId: Id<"artists">;
}

export function FansAlsoViewed({ currentArtistId }: FansAlsoViewedProps) {
  // Get 6 random artists (excluding current) - 2 rows of 3
  const artists = useQuery(api.events.getRelatedArtists, {
    excludeId: currentArtistId,
    limit: 6,
  });

  if (!artists || artists.length === 0) {
    return null;
  }

  return (
    <div className="bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
          Fans Also Viewed
        </h2>
        <ul className="grid grid-cols-3 gap-6">
          {artists.map((artist) => (
            <li key={artist._id} className="w-full">
              <Link href={`/artist/${artist.slug}`}>
                <Card className="overflow-hidden p-0 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer bg-white group rounded-none h-full flex flex-col">
                  <div className="aspect-[4/3] relative w-full overflow-hidden bg-gray-200">
                    {artist.image ? (
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {artist.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex items-center justify-center">
                    <p className="text-sm font-semibold text-center text-gray-900 group-hover:text-[#0A23F0] transition-colors line-clamp-2">
                      {artist.name}
                    </p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
