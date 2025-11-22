"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import { Button } from "~/components/ui/button";

interface EventHeaderProps {
	event: {
		title: string;
		startTime: number;
		doorTime?: number;
		venue: {
			name: string;
			city: string;
			state?: string;
		} | null;
		artist: {
			name: string;
			slug: string;
		} | null;
		category: {
			name: string;
			slug: string;
		} | null;
		images: string[];
	};
}

export function EventHeader({ event }: EventHeaderProps) {
	const formatTime = (timestamp: number) => format(new Date(timestamp), "h:mm a");
	const formatDate = (timestamp: number) => format(new Date(timestamp), "EEE • MMM dd, yyyy");

	return (
		<div className="bg-white border-b border-gray-200">
			<div className="max-w-[1920px] mx-auto px-6 py-4">
				{/* Breadcrumbs */}
				<nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
					<Link href="/" className="hover:text-[#0A23F0]">
						Home
					</Link>
					<ChevronRight className="size-4" />
					<Link href={`/${event.category?.slug || "concerts"}`} className="hover:text-[#0A23F0]">
						{event.category?.name || "Concert"} Tickets
					</Link>
					<ChevronRight className="size-4" />
					{event.artist && (
						<>
							<Link href={`/artist/${event.artist.slug}`} className="hover:text-[#0A23F0]">
								{event.artist.name}
							</Link>
							<ChevronRight className="size-4" />
						</>
					)}
					<span className="text-gray-900">{event.title}</span>
				</nav>

				{/* Event Info */}
				<div className="flex flex-col md:flex-row gap-6">
					{/* Event Image */}
					{event.images[0] && (
						<div className="relative w-full md:w-48 h-48 shrink-0 rounded-none overflow-hidden bg-gray-200">
							<Image
								src={event.images[0]}
								alt={event.title}
								fill
								className="object-cover"
								sizes="192px"
							/>
						</div>
					)}

					{/* Event Details */}
					<div className="flex-1">
						<div className="flex items-start justify-between gap-4 mb-4">
							<div className="flex-1">
								<h1 className="text-2xl md:text-3xl font-bold mb-2">{event.title}</h1>
								<div className="flex items-center gap-2 text-gray-600 mb-2">
									<span>{formatDate(event.startTime)}</span>
									<span>•</span>
									<span>{formatTime(event.startTime)}</span>
									{event.doorTime && (
										<>
											<span>•</span>
											<span>Doors {formatTime(event.doorTime)}</span>
										</>
									)}
								</div>
								{event.venue && (
									<p className="text-gray-600">
										{event.venue.name}, {event.venue.city}
										{event.venue.state && `, ${event.venue.state}`}
									</p>
								)}
							</div>
							<Button variant="outline" className="shrink-0">
								More Info
								<Info className="size-4 ml-2" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

