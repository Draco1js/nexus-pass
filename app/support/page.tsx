"use client";

import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { SupportPageContent } from "~/components/support/SupportPageContent";
import { Suspense } from "react";

export default function SupportPage() {
  // For authenticated pages, use client-side queries
  // The AuthGuard ensures user is authenticated before reaching here
  const tickets = useQuery(api.support.getUserTickets);

  return (
    <Suspense fallback={null}>
      <SupportPageContent tickets={tickets} />
    </Suspense>
  );
}
