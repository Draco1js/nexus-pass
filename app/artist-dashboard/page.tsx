"use client";

import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { ArtistDashboardContent } from "~/components/artist-dashboard/ArtistDashboardContent";
import { Suspense } from "react";

export default function ArtistDashboardPage() {
  // For authenticated pages, use client-side queries
  // The AuthGuard ensures user is authenticated before reaching here
  const artistData = useQuery(api.artists.getArtistDashboardData);

  return (
    <Suspense fallback={null}>
      <ArtistDashboardContent artistData={artistData} />
    </Suspense>
  );
}
