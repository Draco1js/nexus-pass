"use client";

import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { EventHeader } from "~/components/event/EventHeader";
import { SeatingChart } from "~/components/event/SeatingChart";
import { TicketSelectionPanel } from "~/components/event/TicketSelectionPanel";
import { useParams } from "next/navigation";
import { Skeleton } from "~/components/ui/skeleton";

export default function EventPage() {
	const params = useParams();
	const slug = params.slug as string;
	const event = useQuery(api.events.getEventBySlug, { slug });
	const isLoading = event === undefined;

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="min-h-[400px] bg-gray-200">
					<Skeleton className="w-full h-full" />
				</div>
				<Footer />
			</div>
		);
	}

	if (!event) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="px-6 py-12 text-center">
					<h1 className="text-2xl font-bold mb-4">Event not found</h1>
					<p className="text-gray-600">The event you&apos;re looking for doesn&apos;t exist.</p>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<EventHeader event={event} />
			<div className="bg-white">
				<div className="max-w-[1920px] mx-auto px-6 py-8">
					<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
						{/* Seating Chart */}
						<div className="order-2 lg:order-1">
							<SeatingChart event={event} />
						</div>
						{/* Ticket Selection Panel */}
						<div className="order-1 lg:order-2">
							<TicketSelectionPanel event={event} />
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
}

