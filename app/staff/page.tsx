import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { StaffDashboardContent } from "~/components/staff/StaffDashboardContent";
import { getToken } from "~/lib/auth-server";

export default async function StaffDashboardPage() {
  const token = await getToken();
  const preloadedStats = await preloadQuery(
    api.staff.getDashboardStats,
    {},
    { token }
  );

  return <StaffDashboardContent preloadedStats={preloadedStats} />;
}
