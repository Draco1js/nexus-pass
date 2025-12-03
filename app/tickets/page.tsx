"use client";

import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { TicketsPageContent } from "~/components/tickets/TicketsPageContent";
import { Suspense } from "react";

export default function TicketsPage() {
  // For authenticated pages, use client-side queries
  // The AuthGuard ensures user is authenticated before reaching here
  const tickets = useQuery(api.tickets.getUserTickets);

  return (
    <Suspense fallback={null}>
      <TicketsPageContent tickets={tickets} />
    </Suspense>
  );
}