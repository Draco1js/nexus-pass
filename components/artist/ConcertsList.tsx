"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MapPin, Calendar, ChevronRight, Info } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { Calendar as ShadcnCalendar } from "~/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { cn } from "~/lib/utils";
import Link from "next/link";

interface Event {
	_id: string;
	title: string;
	slug: string;
	startTime: number;
	endTime?: number;
	doorTime?: number;
	minPrice: number;
	maxPrice: number;
	currency: string;
	status: string;
	isPresale: boolean;
	venue: {
		_id: string;
		name: string;
		city: string;
		state?: string;
		address: string;
		country: string;
	};
	category: {
		_id: string;
		name: string;
	} | null;
}

interface ConcertsListProps {
	events: Event[];
}

export function ConcertsList({ events }: ConcertsListProps) {
	const [selectedCity, setSelectedCity] = useState<string | null>(null);
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
	const [cityOpen, setCityOpen] = useState(false);
	const [dateOpen, setDateOpen] = useState(false);
	const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

	const cities = useQuery(api.events.getCities, {}) || [];

	// Filter events
	let filteredEvents = events;
	if (selectedCity) {
		filteredEvents = filteredEvents.filter(
			(e) => e.venue.city.toLowerCase() === selectedCity.toLowerCase(),
		);
	}
	if (dateRange?.from) {
		const fromTime = dateRange.from.getTime();
		const toTime = dateRange.to?.getTime() || Infinity;
		filteredEvents = filteredEvents.filter((e) => {
			return e.startTime >= fromTime && e.startTime <= toTime;
		});
	}

	// All events are from Pakistan
	const pkEvents = filteredEvents;

	const formatTime = (timestamp: number) => {
		return format(new Date(timestamp), "h:mm a");
	};

	const formatShortDate = (timestamp: number) => {
		return format(new Date(timestamp), "MMM dd").toUpperCase();
	};

	const formatDay = (timestamp: number) => {
		return format(new Date(timestamp), "EEE");
	};

	const formatDate = (timestamp: number) => {
		return format(new Date(timestamp), "MMM dd, yyyy");
	};

	return (
		<div className="bg-white py-6 md:py-8">
			<div className="max-w-7xl mx-auto px-6">
				{/* Header */}
				<div className="mb-4 md:mb-6">
					<div className="flex items-center justify-between mb-3 md:mb-4">
						<h2 className="text-2xl md:text-3xl font-bold">
							Concerts
							<span className="ml-2 text-lg md:text-xl font-normal text-gray-600">
								{filteredEvents.length} {filteredEvents.length === 1 ? "Result" : "Results"}
							</span>
						</h2>
						<div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-full">
							<button
								type="button"
								onClick={() => setViewMode("list")}
								aria-pressed={viewMode === "list"}
								className={cn(
									"p-2 transition-colors rounded-full",
									viewMode === "list"
										? "bg-white text-gray-900 shadow-sm"
										: "text-gray-400 hover:text-gray-600"
								)}
							>
								<span className="sr-only">List view</span>
								<svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
									<path d="M23 1H1v22h17.31L23 18.31zM2.5 21.5v-19h19v15.19l-3.81 3.81zm5.32-13H5.5V7h2.32zm10.68 0H9.71V7h8.79zm-13 4.25h2.32v-1.5H5.5zm13 0H9.71v-1.5h8.79zM5.5 17h2.32v-1.5H5.5zm13 0H9.71v-1.5h8.79z" />
								</svg>
							</button>
							<button
								type="button"
								onClick={() => setViewMode("calendar")}
								aria-pressed={viewMode === "calendar"}
								className={cn(
									"p-2 transition-colors rounded-full",
									viewMode === "calendar"
										? "bg-white text-gray-900 shadow-sm"
										: "text-gray-400 hover:text-gray-600"
								)}
							>
								<span className="sr-only">Calendar view</span>
								<svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
									<path d="M8.75 3V1h-1.5v2H1v20h17.03L23 18.1V3h-6.25V1h-1.5v2zm6.5 3.5h1.5v-2h4.75v3.25h-19V4.5h4.75v2h1.5v-2h6.5zm6.25 2.75v7.59h-4.66v4.66h.57H2.5V9.25zm-.7 8.91-2.64 2.6v-2.6zm-16.55-6.9h5.5v5.5h-5.5zm1.5 1.5v2.5h2.5v-2.5z" />
								</svg>
							</button>
						</div>
					</div>

					{/* Filters */}
					<div className="flex flex-col md:flex-row gap-3">
						<Popover open={cityOpen} onOpenChange={setCityOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="justify-start text-left font-normal md:min-w-[200px] rounded-none"
								>
									<MapPin className="size-4 mr-2 text-[#0A23F0]" />
									<span className={cn("flex-1", !selectedCity && "text-gray-400")}>
										{selectedCity || "City or Zip Code"}
									</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[300px] p-0 rounded-none" align="start">
								<Command>
									<CommandInput placeholder="Search city..." />
									<CommandList>
										<CommandEmpty>No city found.</CommandEmpty>
										<CommandGroup>
											{cities.map((city) => (
												<CommandItem
													key={city}
													value={city}
													onSelect={() => {
														setSelectedCity(city);
														setCityOpen(false);
													}}
												>
													{city}
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>

						<Popover open={dateOpen} onOpenChange={setDateOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="justify-start text-left font-normal md:min-w-[180px] rounded-none"
								>
									<Calendar className="size-4 mr-2 text-[#0A23F0]" />
									<span className={cn("flex-1", !dateRange && "text-gray-400")}>
										{dateRange?.from
											? dateRange.to
												? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
												: format(dateRange.from, "MMM dd")
											: "All Dates"}
									</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0 rounded-none" align="start">
								<ShadcnCalendar
									initialFocus
									mode="range"
									defaultMonth={dateRange?.from}
									selected={dateRange}
									onSelect={setDateRange}
									numberOfMonths={2}
									classNames={{
										months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
										month: "space-y-4",
										caption: "flex justify-center pt-1 relative items-center",
										caption_label: "text-sm font-medium",
										nav: "space-x-1 flex items-center",
										nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
										nav_button_previous: "absolute left-1",
										nav_button_next: "absolute right-1",
										table: "w-full border-collapse space-y-1",
										head_row: "flex",
										head_cell: "text-muted-foreground rounded-none w-9 font-normal text-[0.8rem]",
										row: "flex w-full mt-2",
										cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-none [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-none last:[&:has([aria-selected])]:rounded-none focus-within:relative focus-within:z-20",
										day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#0A23F0]/10 rounded-none",
										day_range_start: "day-range-start bg-[#0A23F0] text-white hover:bg-[#0A23F0] hover:text-white",
										day_range_end: "day-range-end bg-[#0A23F0] text-white hover:bg-[#0A23F0] hover:text-white",
										day_selected: "bg-[#0A23F0] text-white hover:bg-[#0A23F0] hover:text-white focus:bg-[#0A23F0] focus:text-white",
										day_today: "bg-accent text-accent-foreground",
										day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
										day_disabled: "text-muted-foreground opacity-50",
										day_range_middle: "aria-selected:bg-[#0A23F0]/20 aria-selected:text-accent-foreground",
										day_hidden: "invisible",
									}}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				{/* Events List or Calendar View */}
				{viewMode === "list" ? (
					<div className="space-y-6">
					{pkEvents.length > 0 && (
						<ul className="space-y-3">
								{pkEvents.map((event) => (
									<li
										key={event._id}
										className="border border-gray-200 rounded-none overflow-hidden hover:shadow-lg transition-shadow bg-white"
									>
										<div className="flex flex-col md:flex-row">
											{/* Date Box */}
											<div className="flex items-center justify-center p-3 md:p-4 bg-gray-50 md:bg-white border-b md:border-b-0 md:border-r border-gray-200 md:min-w-[100px]">
												<div className="text-center">
													<div className="text-xs font-semibold text-gray-600 uppercase mb-0.5">
														{formatShortDate(event.startTime)}
													</div>
													<div className="text-2xl md:text-3xl font-bold text-gray-900">
														{format(new Date(event.startTime), "dd")}
													</div>
												</div>
											</div>

											{/* Event Details */}
											<div className="flex-1 p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
												<div className="flex-1 min-w-0">
													<div className="text-sm font-semibold text-gray-900 mb-0.5">
														{formatDay(event.startTime)} • {formatTime(event.startTime)}
														<button
															className="ml-2 text-gray-400 hover:text-gray-600 inline-flex"
															aria-label="More information"
														>
															<Info className="size-4" />
														</button>
													</div>
													<div className="text-sm text-gray-600 mb-0.5 font-semibold">
														{event.venue.city}
														{event.venue.state && `, ${event.venue.state}`} • {event.venue.name}
													</div>
													<div className="flex items-center gap-2 mt-1">
														<h4 className="text-base md:text-lg font-bold text-gray-900">
														{event.title}
													</h4>
														{event.status && event.status !== "on_sale" && (
															<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
																event.status === "sold_out" ? "bg-purple-100 text-purple-700" :
																event.status === "cancelled" ? "bg-red-100 text-red-700" :
																event.status === "postponed" ? "bg-yellow-100 text-yellow-700" :
																event.status === "rescheduled" ? "bg-blue-100 text-blue-700" :
																"bg-gray-100 text-gray-700"
															}`}>
																{event.status === "sold_out" ? "Sold Out" :
																 event.status === "cancelled" ? "Cancelled" :
																 event.status === "postponed" ? "Postponed" :
																 event.status === "rescheduled" ? "Rescheduled" :
																 event.status === "off_sale" ? "Off Sale" :
																 event.status.replace("_", " ")}
															</span>
														)}
													</div>
												</div>
												<div className="md:ml-4 shrink-0">
													<Link href={`/event/${event.slug}`}>
														<Button className="w-full md:w-auto bg-[#0A23F0] hover:bg-[#0819c7] text-white rounded-none">
															Find Tickets
															<ChevronRight className="size-4 ml-2" />
														</Button>
													</Link>
												</div>
											</div>
										</div>
									</li>
								))}
							</ul>
					)}

					{filteredEvents.length === 0 && (
						<div className="text-center py-12">
							<p className="text-gray-600 text-lg">No events found matching your criteria.</p>
						</div>
					)}
					</div>
				) : (
					<div className="mt-6">
						<ShadcnCalendar
							initialFocus
							mode="single"
							className="rounded-none"
							classNames={{
								months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
								month: "space-y-4",
								caption: "flex justify-center pt-1 relative items-center",
								caption_label: "text-sm font-medium",
								nav: "space-x-1 flex items-center",
								nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-none",
								nav_button_previous: "absolute left-1",
								nav_button_next: "absolute right-1",
								table: "w-full border-collapse space-y-1",
								head_row: "flex",
								head_cell: "text-muted-foreground rounded-none w-9 font-normal text-[0.8rem]",
								row: "flex w-full mt-2",
								cell: "h-9 w-9 text-center text-sm p-0 relative rounded-none focus-within:relative focus-within:z-20",
								day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#0A23F0]/10 rounded-none",
								day_selected: "bg-[#0A23F0] text-white hover:bg-[#0A23F0] hover:text-white focus:bg-[#0A23F0] focus:text-white",
								day_today: "bg-accent text-accent-foreground",
								day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
								day_disabled: "text-muted-foreground opacity-50",
								day_hidden: "invisible",
							}}
							modifiers={{
								hasEvents: filteredEvents.map((e) => new Date(e.startTime)),
							}}
							modifiersClassNames={{
								hasEvents: "bg-[#0A23F0]/20 font-semibold",
							}}
						/>
						<div className="mt-6 space-y-4">
							{filteredEvents.map((event) => (
								<div
									key={event._id}
									className="border border-gray-200 rounded-none p-4 hover:shadow-lg transition-shadow bg-white"
								>
									<div className="flex items-center justify-between">
										<div>
											<div className="text-sm font-semibold text-gray-900 mb-1">
												{formatDay(event.startTime)} • {formatTime(event.startTime)}
											</div>
											<div className="text-sm text-gray-600 mb-1 font-semibold">
												{event.venue.city}
												{event.venue.state && `, ${event.venue.state}`} • {event.venue.name}
											</div>
											<h4 className="text-base md:text-lg font-bold text-gray-900 mt-1">
												{event.title}
											</h4>
										</div>
										<Link href={`/event/${event.slug}`}>
											<Button className="bg-[#0A23F0] hover:bg-[#0819c7] text-white rounded-none">
												Find Tickets
												<ChevronRight className="size-4 ml-2" />
											</Button>
										</Link>
									</div>
								</div>
							))}
						</div>
						{filteredEvents.length === 0 && (
							<div className="text-center py-12 mt-6">
								<p className="text-gray-600 text-lg">No events found matching your criteria.</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
