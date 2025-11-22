"use client";

import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import Link from "next/link";

interface ArtistHeroProps {
	artist: {
		_id: string;
		name: string;
		slug: string;
		image?: string;
		category: string;
	};
}

export function ArtistHero({ artist }: ArtistHeroProps) {
	const imageUrl = artist.image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop";

	return (
		<div className="relative overflow-hidden">
			{/* Background Image */}
			<div className="relative h-[300px] md:h-[400px] lg:h-[500px]">
				<Image
					src={imageUrl}
					alt={artist.name}
					fill
					className="object-cover object-center"
					priority
					sizes="100vw"
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
			</div>

			{/* Content Overlay */}
			<div className="absolute inset-0 flex items-end">
				<div className="w-full px-6 pb-6 md:pb-8">
					<div className="max-w-7xl mx-auto">
						{/* Breadcrumb */}
						<nav aria-label="Breadcrumb" className="mb-4">
							<ol className="flex items-center gap-2 text-sm text-white/80">
								<li>
									<Link href="/" className="hover:text-white transition-colors">
										Home
									</Link>
								</li>
								<li>/</li>
								<li>
									<Link href={`/discover/${artist.category.toLowerCase()}`} className="hover:text-white transition-colors">
										{artist.category}
									</Link>
								</li>
								<li>/</li>
								<li className="text-white font-semibold">{artist.name} Tickets</li>
							</ol>
						</nav>

						{/* Artist Info */}
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<p className="text-white/90 text-sm md:text-base mb-2 uppercase tracking-wide">
									{artist.category}
								</p>
								<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
									{artist.name} Tickets
								</h1>
								<div className="flex items-center gap-4">
									<Button
										variant="ghost"
										size="sm"
										className="text-white hover:bg-white/10 rounded-full p-2 h-auto"
										aria-label="Save to favorites"
									>
										<Heart className="size-5" />
									</Button>
									<Link href="#reviews" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
										<div className="flex items-center gap-1">
											<Star className="size-4 fill-yellow-400 text-yellow-400" />
											<span className="text-sm font-semibold">4.9</span>
										</div>
										<span className="text-sm text-white/80">(10000 reviews)</span>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

