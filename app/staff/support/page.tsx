import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { StaffSupportPageContent } from "~/components/staff/StaffSupportPageContent";
import { getToken } from "~/lib/auth-server";

export default async function StaffSupportPage() {
  const token = await getToken();
  const preloadedTickets = await preloadQuery(
    api.staff.getSupportTickets,
    {},
    { token }
  );

  return <StaffSupportPageContent preloadedTickets={preloadedTickets} />;
}

