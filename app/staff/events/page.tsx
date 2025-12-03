import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { StaffEventsPageContent } from "~/components/staff/StaffEventsPageContent";
import { getToken } from "~/lib/auth-server";

export default async function StaffEventsPage() {
  const token = await getToken();
  const preloadedEvents = await preloadQuery(
    api.staff.getEvents,
    {},
    { token }
  );

  return <StaffEventsPageContent preloadedEvents={preloadedEvents} />;
}

