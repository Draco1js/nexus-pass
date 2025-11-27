"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Filter, MapPin } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { useAction } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";

interface TicketType {
	_id: string;
	name: string;
	price: number;
	fees: number;
	currency: string;
	availableQuantity: number;
	section?: string;
	tier: string;
}

interface TicketSelectionPanelProps {
	event: {
		_id: string;
		title: string;
		minPrice: number;
		maxPrice: number;
		currency: string;
		ticketTypes: TicketType[];
	};
	selectedSection: string | null;
	onSelectSection: (sectionId: string | null) => void;
}

export function TicketSelectionPanel({ event, selectedSection, onSelectSection }: TicketSelectionPanelProps) {
	const [ticketQuantity, setTicketQuantity] = useState(2);
	const minPrice = event.minPrice || 0;
	const maxPrice = event.maxPrice || 10000;
	const [priceRange, setPriceRange] = useState<[number, number]>([
		minPrice,
		maxPrice,
	]);
	const [sortBy, setSortBy] = useState<"lowest" | "best">("lowest");
	const [filtersOpen, setFiltersOpen] = useState(false);
	
	const createCheckout = useAction(api.polar.createCheckout);

	// Generate sample tickets with sections and rows
	const availableTickets = useMemo(() => {
		const tickets: Array<{
			id: string;
			ticketTypeId: string;
			section: string;
			row: string;
			type: string;
			price: number;
			fees: number;
			isFeatured?: boolean;
		}> = [];

		event.ticketTypes.forEach((tt, idx) => {
			// Generate multiple tickets per type
			const numTickets = Math.min(tt.availableQuantity, 5);
			for (let i = 0; i < numTickets; i++) {
				tickets.push({
					id: `${tt._id}-${i}`,
					ticketTypeId: tt._id,
					section: tt.section || `Sec ${idx + 1}`,
					row: `Row ${Math.floor(Math.random() * 30) + 1}`,
					type: tt.tier === "vip" ? "Official Platinum" : tt.tier === "premium" ? "Verified Resale Ticket" : "Standard Ticket",
					price: tt.price,
					fees: tt.fees,
					isFeatured: idx < 3 && i === 0,
				});
			}
		});

		// Filter by selected section
		let filteredTickets = tickets;
		if (selectedSection) {
			filteredTickets = tickets.filter(t => t.section === selectedSection);
		}

		// Sort tickets
		if (sortBy === "lowest") {
			filteredTickets.sort((a, b) => (a.price + a.fees) - (b.price + b.fees));
		} else {
			// Best seats - prioritize lower sections
			filteredTickets.sort((a, b) => {
				const aNum = parseInt(a.section.replace(/\D/g, "")) || 999;
				const bNum = parseInt(b.section.replace(/\D/g, "")) || 999;
				return aNum - bNum;
			});
		}

		// Filter by price range
		return filteredTickets.filter(
			(t) =>
				t.price + t.fees >= priceRange[0] && t.price + t.fees <= priceRange[1]
		);
	}, [event.ticketTypes, sortBy, priceRange, selectedSection]);

	const handleBuy = async (ticket: typeof availableTickets[0]) => {
		try {
			const link = await createCheckout({
				ticketTypeId: ticket.ticketTypeId as Id<"ticketTypes">,
				price: ticket.price + ticket.fees, // pass total or just price
			});
			
			if (link) {
				window.location.href = link;
			} else {
				console.log("Simulated checkout initiated for", ticket);
				alert("Checkout initiated! (Requires Polar configuration)");
			}
		} catch (error) {
			console.error("Checkout error:", error);
			alert("Failed to initiate checkout. Please try again.");
		}
	};

	const formatPrice = (amount: number) => {
		return new Intl.NumberFormat("en-PK", {
			style: "currency",
			currency: event.currency,
			minimumFractionDigits: 2,
		}).format(amount);
	};

	return (
		<div className="bg-white rounded-none border border-gray-200 p-6 sticky top-4">
			{/* Header Controls */}
			<div className="mb-6 space-y-4">
				<div className="flex items-center justify-between">
					<Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
						<PopoverTrigger asChild>
							<Button variant="outline" className="rounded-none">
								{ticketQuantity} Ticket{ticketQuantity !== 1 ? "s" : ""}
								<ChevronDown className="size-4 ml-2" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-64 p-4 rounded-none" align="start">
							<div className="space-y-2">
								<label className="text-sm font-medium">Number of Tickets</label>
								<select
									value={ticketQuantity}
									onChange={(e) => setTicketQuantity(Number(e.target.value))}
									className="w-full border border-gray-300 rounded-none px-3 py-2"
								>
									{Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
										<option key={num} value={num}>
											{num} Ticket{num !== 1 ? "s" : ""}
										</option>
									))}
								</select>
							</div>
						</PopoverContent>
					</Popover>

					<Button
						variant="outline"
						onClick={() => setFiltersOpen(!filtersOpen)}
						className="rounded-none"
					>
						<Filter className="size-4 mr-2" />
						Filters
					</Button>
				</div>

				{/* Price Range Slider */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-gray-600">
							{formatPrice(priceRange[0])}
						</span>
						<span className="text-gray-600">
							{formatPrice(priceRange[1])}+
						</span>
					</div>
					<Slider
						value={priceRange}
						onValueChange={(value) => setPriceRange(value as [number, number])}
						min={minPrice}
						max={maxPrice}
						step={100}
						className="w-full"
					/>
				</div>

				{/* Sort Tabs */}
				<div className="flex gap-1 bg-gray-100 p-1 rounded-none">
					<button
						onClick={() => setSortBy("lowest")}
						className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors rounded-none ${
							sortBy === "lowest"
								? "bg-white text-gray-900 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						LOWEST PRICE
					</button>
					<button
						onClick={() => setSortBy("best")}
						className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors rounded-none ${
							sortBy === "best"
								? "bg-white text-gray-900 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						BEST SEATS
					</button>
				</div>

				<p className="text-xs text-gray-600">
					We&apos;re All In: Prices include fees (before taxes).
				</p>
			</div>

			{/* Ticket List */}
			<div className="space-y-3 max-h-[600px] overflow-y-auto">
				{availableTickets.map((ticket) => (
					<div
						key={ticket.id}
						className={`border rounded-none p-4 transition-colors ${
							ticket.isFeatured ? "border-[#0A23F0] bg-[#0A23F0]/5" : "border-gray-200"
						}`}
						onMouseEnter={() => onSelectSection(ticket.section)}
						onMouseLeave={() => onSelectSection(null)}
					>
						<div className="flex items-start justify-between">
							<div className="flex-1">
								{ticket.isFeatured && (
									<span className="text-xs font-bold text-[#0A23F0] mb-1 block">
										FEATURED
									</span>
								)}
								<div className="flex items-center gap-2 mb-1">
									<MapPin className="size-4 text-gray-400" />
									<span className="font-semibold text-gray-900">
										{ticket.section} • {ticket.row}
									</span>
								</div>
								<p className="text-sm text-gray-600">{ticket.type}</p>
							</div>
							<div className="text-right flex flex-col items-end gap-2">
								<div>
									<p className="font-bold text-lg text-gray-900">
										{formatPrice(ticket.price + ticket.fees)}
									</p>
									<p className="text-xs text-gray-500">per ticket</p>
								</div>
								<Button 
									size="sm" 
									className="bg-[#0A23F0] hover:bg-[#0A23F0]/90 text-white rounded-none"
									onClick={() => handleBuy(ticket)}
								>
									Buy
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>

			{availableTickets.length === 0 && (
				<div className="text-center py-8">
					<p className="text-gray-600">No tickets available in this price range.</p>
				</div>
			)}
		</div>
	);
}

