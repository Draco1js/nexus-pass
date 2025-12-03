import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { EventPageContent } from "~/components/event/EventPageContent";
import { Suspense } from "react";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { Skeleton } from "~/components/ui/skeleton";

function EventPageSkeleton() {
		return (
			<div className="min-h-screen bg-tm-navy">
				<Header />
				<div className="min-h-[400px]">
					<div className="max-w-[1920px] mx-auto px-6 py-8">
						<div className="flex flex-col lg:flex-row gap-8">
							<Skeleton className="w-full lg:w-72 h-72 rounded-lg" />
							<div className="flex-1 space-y-4">
								<Skeleton className="h-12 w-3/4" />
								<Skeleton className="h-6 w-1/2" />
								<Skeleton className="h-6 w-1/3" />
							</div>
						</div>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Preload event data on the server
  const preloaded = await preloadQuery(api.events.getEventBySlug, { slug });
  
  // Preload tickets using slug (returns empty array if event doesn't exist)
  const preloadedTickets = await preloadQuery(api.events.getAvailableTicketsBySlug, { slug });

	return (
    <Suspense fallback={<EventPageSkeleton />}>
      <EventPageContent preloaded={preloaded} preloadedTickets={preloadedTickets} />
    </Suspense>
	);
}

