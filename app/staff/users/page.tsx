import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { StaffUsersPageContent } from "~/components/staff/StaffUsersPageContent";
import { getToken } from "~/lib/auth-server";

export default async function StaffUsersPage() {
  const token = await getToken();
  const preloadedUsers = await preloadQuery(
    api.staff.getUsers,
    {},
    { token }
  );

  return <StaffUsersPageContent preloadedUsers={preloadedUsers} />;
}

