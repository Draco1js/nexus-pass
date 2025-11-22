"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";

interface AboutSectionProps {
	artist: {
		name: string;
		bio?: string;
		events: Array<{
			title: string;
			startTime: number;
			venue: {
				name: string;
				city: string;
				state?: string;
			};
		}>;
	};
}

export function AboutSection({ artist }: AboutSectionProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const bio = artist.bio || `Experience ${artist.name} live in concert! Don't miss this incredible performance.`;

	return (
		<div className="bg-white py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-6">
				<div className="max-w-4xl">
					<h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">About</h2>

					<div className="prose prose-gray max-w-none">
						<div className={`${isExpanded ? "" : "line-clamp-6"} text-gray-700`}>
							<p className="mb-4">{bio}</p>
						</div>

						{bio.length > 300 && (
							<Button
								variant="ghost"
								onClick={() => setIsExpanded(!isExpanded)}
								className="mt-2 mb-6 text-[#0A23F0] hover:text-[#0819c7] font-semibold p-0 h-auto"
							>
								{isExpanded ? "Show less" : "Show more"}
								<ChevronDown
									className={`size-5 ml-2 transition-transform ${isExpanded ? "rotate-180" : ""}`}
								/>
							</Button>
						)}

						{artist.events.length > 0 && (
							<div className="mt-8">
								<p className="font-bold mb-4">{artist.name} 2025 Tour Dates:</p>
								<ul className="space-y-2 list-disc list-inside">
									{artist.events.slice(0, isExpanded ? artist.events.length : 10).map((event, index) => (
										<li key={index} className="text-gray-700">
											{format(new Date(event.startTime), "MM/dd/yy")} - {event.venue.city}
											{event.venue.state && `, ${event.venue.state}`} @ {event.venue.name}
										</li>
									))}
									{!isExpanded && artist.events.length > 10 && (
										<li className="text-gray-500 italic">...and more</li>
									)}
								</ul>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

