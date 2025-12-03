import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { EditEventPageContent } from "~/components/artist-dashboard/EditEventPageContent";
import { getToken } from "~/lib/auth-server";
import { Id } from "~/convex/_generated/dataModel";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getToken();
  
  const preloadedEvent = await preloadQuery(
    api.artists.getEventForEdit,
    { eventId: id as Id<"events"> },
    { token }
  );
  
  const preloadedCategories = await preloadQuery(
    api.artists.getCategories,
    {},
    { token }
  );
  
  const preloadedVenues = await preloadQuery(
    api.artists.getVenues,
    {},
    { token }
  );

  return (
    <EditEventPageContent
      eventId={id as Id<"events">}
      preloadedEvent={preloadedEvent}
      preloadedCategories={preloadedCategories}
      preloadedVenues={preloadedVenues}
    />
  );
}

