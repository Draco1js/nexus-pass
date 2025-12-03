"use client";

import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { ArtistAnalyticsContent } from "~/components/artist-dashboard/ArtistAnalyticsContent";

export default function ArtistAnalyticsPage() {
  const analytics = useQuery(api.artists.getArtistAnalytics);

  return <ArtistAnalyticsContent analytics={analytics} />;
}

