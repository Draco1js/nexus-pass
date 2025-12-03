"use client";

import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Calendar, Clock, MapPin, Heart, Share2 } from "lucide-react";
import { Button } from "~/components/ui/button";

interface EventHeaderProps {
	event: {
		title: string;
		startTime: number;
		doorTime?: number;
		minPrice: number;
		maxPrice: number;
		currency: string;
		venue: {
			name: string;
			city: string;
			state?: string;
			address?: string;
		} | null;
		artist: {
			name: string;
			slug: string;
			image?: string;
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
	const formatDate = (timestamp: number) => format(new Date(timestamp), "EEE, MMM dd, yyyy");
	const formatPrice = (amount: number) => {
		return new Intl.NumberFormat("en-PK", {
			style: "currency",
			currency: event.currency || "PKR",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	// Use event banner image or fallback to artist image
	const bannerImage = event.images[0] || event.artist?.image;

	return (
		<div className="relative">
			{/* Hero Background with Blur */}
			<div className="absolute inset-0 overflow-hidden">
				{bannerImage ? (
					<>
						<Image
							src={bannerImage}
							alt=""
							fill
							className="object-cover scale-110 blur-xl opacity-40"
							priority
						/>
						<div className="absolute inset-0 bg-linear-to-b from-tm-navy/80 via-tm-navy/90 to-tm-navy" />
					</>
				) : (
					<div className="absolute inset-0 bg-linear-to-b from-tm-blue to-tm-navy" />
				)}
			</div>

			{/* Content */}
			<div className="relative z-10">
				{/* Breadcrumbs */}
				<div className="max-w-[1920px] mx-auto px-6 pt-4">
					<nav className="flex items-center gap-2 text-sm text-white/70 flex-wrap">
						<Link href="/" className="hover:text-white transition-colors">
							Home
						</Link>
						<ChevronRight className="size-4" />
						<Link href={`/${event.category?.slug || "concerts"}`} className="hover:text-white transition-colors">
							{event.category?.name || "Concert"} Tickets
						</Link>
						<ChevronRight className="size-4" />
						{event.artist && (
							<>
								<Link href={`/artist/${event.artist.slug}`} className="hover:text-white transition-colors">
									{event.artist.name}
								</Link>
								<ChevronRight className="size-4" />
							</>
						)}
						<span className="text-white">{event.title}</span>
					</nav>
				</div>

				{/* Event Info */}
				<div className="max-w-[1920px] mx-auto px-6 py-8">
					<div className="flex flex-col lg:flex-row gap-8">
						{/* Event Image */}
						{bannerImage && (
							<div className="relative w-full lg:w-72 h-72 shrink-0 rounded-lg overflow-hidden shadow-2xl">
								<Image
									src={bannerImage}
									alt={event.title}
									fill
									className="object-cover"
									sizes="288px"
									priority
								/>
							</div>
						)}

						{/* Event Details */}
						<div className="flex-1 text-white">
							<div className="flex items-start justify-between gap-4 mb-6">
								<div className="flex-1">
									<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
										{event.title}
									</h1>
									
									{/* Date & Time */}
									<div className="flex flex-wrap items-center gap-4 mb-4 text-lg">
										<span className="flex items-center gap-2">
											<Calendar className="size-5 text-tm-blue" />
											{formatDate(event.startTime)}
										</span>
										<span className="flex items-center gap-2">
											<Clock className="size-5 text-tm-blue" />
											{formatTime(event.startTime)}
											{event.doorTime && (
												<span className="text-white/70 text-base ml-1">
													(Doors {formatTime(event.doorTime)})
												</span>
											)}
										</span>
									</div>

									{/* Venue */}
									{event.venue && (
										<div className="flex items-start gap-2 mb-6">
											<MapPin className="size-5 text-tm-blue mt-0.5 shrink-0" />
											<div>
												<p className="font-semibold">{event.venue.name}</p>
												<p className="text-white/70">
													{event.venue.address && `${event.venue.address}, `}
													{event.venue.city}
													{event.venue.state && `, ${event.venue.state}`}
												</p>
											</div>
										</div>
									)}

									{/* Price Range */}
									<div className="flex items-center gap-4">
										<div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
											<p className="text-sm text-white/70">Starting from</p>
											<p className="text-2xl font-bold text-tm-blue">
												{formatPrice(event.minPrice)}
											</p>
										</div>
										{event.maxPrice > event.minPrice && (
											<div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
												<p className="text-sm text-white/70">Up to</p>
												<p className="text-2xl font-bold">
													{formatPrice(event.maxPrice)}
												</p>
											</div>
										)}
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex flex-col gap-2 shrink-0">
									<Button 
										variant="outline" 
										size="icon"
										className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
									>
										<Heart className="size-5" />
									</Button>
									<Button 
										variant="outline" 
										size="icon"
										className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
									>
										<Share2 className="size-5" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

