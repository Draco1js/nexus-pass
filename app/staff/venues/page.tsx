import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { StaffVenuesPageContent } from "~/components/staff/StaffVenuesPageContent";
import { getToken } from "~/lib/auth-server";
import { Suspense } from "react";

export default async function StaffVenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const token = await getToken();
  const params = await searchParams;

  const preloadedVenues = await preloadQuery(
    api.staff.getVenues,
    {},
    { token }
  );
  
  const preloadedCities = await preloadQuery(
    api.events.getCities,
    {},
    { token }
  );

  return (
    <Suspense fallback={null}>
      <StaffVenuesPageContent 
        preloadedVenues={preloadedVenues} 
        preloadedCities={preloadedCities}
        initialVenueId={params.id}
      />
    </Suspense>
  );
}

