"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, MapPin, Ticket, Star, Shield, Zap, Users } from "lucide-react";
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
import { toast } from "sonner";

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

interface Ticket {
	id: string;
	ticketTypeId: string;
	section: string;
	row: string;
	type: string;
	price: number;
	fees: number;
	tier: string;
	isBestValue?: boolean;
	isLimited?: boolean;
}

interface TicketSelectionPanelProps {
	event: {
		_id: string;
		title: string;
		minPrice: number;
		maxPrice: number;
		currency: string;
		ticketTypes: TicketType[];
		status?: "on_sale" | "off_sale" | "sold_out" | "cancelled" | "postponed" | "rescheduled";
	};
	tickets: Ticket[];
	selectedSection: string | null;
	onSelectSection: (sectionId: string | null) => void;
}

export function TicketSelectionPanel({ event, tickets: serverTickets, selectedSection, onSelectSection }: TicketSelectionPanelProps) {
	const [ticketQuantity, setTicketQuantity] = useState(2);
	const minPrice = event.minPrice || 0;
	const maxPrice = event.maxPrice || 10000;
	const [priceRange, setPriceRange] = useState<[number, number]>([
		minPrice,
		maxPrice,
	]);
	const [sortBy, setSortBy] = useState<"lowest" | "best">("lowest");
	const [quantityOpen, setQuantityOpen] = useState(false);
	const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
	const ticketRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	
	const createCheckout = useAction(api.polar.createCheckout);

	// Use server-rendered tickets, filter and sort client-side
	// Always show ALL tickets (not filtered by section)
	const availableTickets = useMemo(() => {
		// Start with ALL tickets from server (don't filter by section)
		let filteredTickets = [...serverTickets];

		// Sort tickets
		if (sortBy === "lowest") {
			filteredTickets.sort((a, b) => (a.price + a.fees) - (b.price + b.fees));
		} else {
			// Best seats - prioritize VIP, then premium, then standard
			const tierOrder = { vip: 0, premium: 1, standard: 2 };
			filteredTickets.sort((a, b) => {
				const aTier = tierOrder[a.tier as keyof typeof tierOrder] ?? 2;
				const bTier = tierOrder[b.tier as keyof typeof tierOrder] ?? 2;
				return aTier - bTier;
			});
		}

		// Filter by price range
		return filteredTickets.filter(
			(t) =>
				t.price + t.fees >= priceRange[0] && t.price + t.fees <= priceRange[1]
		);
	}, [serverTickets, sortBy, priceRange]);

	// Scroll to ticket when section is selected from map
	useEffect(() => {
		if (selectedSection && serverTickets.length > 0) {
			// Find first ticket with matching section in ALL tickets
			const firstTicket = serverTickets.find(t => t.section === selectedSection);
			if (firstTicket) {
				// Wait a bit for DOM to update
				setTimeout(() => {
					const ticketElement = ticketRefs.current.get(firstTicket.id);
					if (ticketElement) {
						ticketElement.scrollIntoView({ behavior: "smooth", block: "center" });
					}
				}, 100);
			}
		}
	}, [selectedSection, serverTickets]);

	const handleBuy = async (ticket: typeof availableTickets[0]) => {
		// Check if event is available for purchase
		const isEventOnSale = event.status === "on_sale" || !event.status;
		if (!isEventOnSale) {
			toast.error(
				event.status === "sold_out" 
					? "This event is sold out"
					: event.status === "off_sale"
					? "Tickets are not currently available for sale"
					: "Tickets cannot be purchased at this time"
			);
			setIsCheckingOut(null);
			return;
		}

		setIsCheckingOut(ticket.id);
		try {
			const link = await createCheckout({
				ticketTypeId: ticket.ticketTypeId as Id<"ticketTypes">,
				price: ticket.price + ticket.fees,
				quantity: ticketQuantity,
			});
			
			if (link) {
				window.location.href = link;
			} else {
				console.log("Simulated checkout initiated for", ticket);
				toast("Something went horribly wrong, please contact an administrator.");
			}
		} catch (error) {
			console.error("Checkout error:", error);
			toast("Failed to initiate checkout. Please try again.");
		} finally {
			setIsCheckingOut(null);
		}
	};

	const formatPrice = (amount: number) => {
		return new Intl.NumberFormat("en-PK", {
			style: "currency",
			currency: event.currency,
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getTierIcon = (tier: string) => {
		switch (tier) {
			case "vip":
				return <Star className="size-4 text-amber-500" />;
			case "premium":
				return <Shield className="size-4 text-tm-blue" />;
			default:
				return <Ticket className="size-4 text-gray-500" />;
		}
	};

	const getTierBadge = (tier: string) => {
		switch (tier) {
			case "vip":
				return (
					<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded">
						<Star className="size-3" /> VIP
					</span>
				);
			case "premium":
				return (
					<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tm-blue/10 text-tm-blue text-xs font-semibold rounded">
						<Shield className="size-3" /> PREMIUM
					</span>
				);
			default:
				return null;
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
			{/* Header */}
			<div className="bg-tm-navy text-white p-4">
				<h3 className="font-bold text-lg flex items-center gap-2">
					<Ticket className="size-5" />
					Select Tickets
				</h3>
				<p className="text-white/70 text-sm mt-1">
					{selectedSection ? `${availableTickets.length} options in ${selectedSection}` : `${serverTickets.length} total options available`}
				</p>
			</div>

			{/* Controls */}
			<div className="p-4 border-b border-gray-200 space-y-4">
				{/* Quantity Selector */}
				<div className="flex items-center justify-between">
					<Popover open={quantityOpen} onOpenChange={setQuantityOpen}>
						<PopoverTrigger asChild>
							<Button variant="outline" className="gap-2">
								<Users className="size-4" />
								{ticketQuantity} Ticket{ticketQuantity !== 1 ? "s" : ""}
								<ChevronDown className="size-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-48 p-2" align="start">
							<div className="space-y-1">
								{Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
									<button
										key={num}
										onClick={() => {
											setTicketQuantity(num);
											setQuantityOpen(false);
										}}
										className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
											ticketQuantity === num
												? "bg-tm-blue text-white"
												: "hover:bg-gray-100"
										}`}
									>
										{num} Ticket{num !== 1 ? "s" : ""}
									</button>
								))}
							</div>
						</PopoverContent>
					</Popover>
				</div>

				{/* Price Range Slider */}
				<div className="space-y-3">
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium text-gray-700">Price Range</span>
						<span className="text-gray-500">
							{formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
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
				<div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
					<button
						onClick={() => setSortBy("lowest")}
						className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-all rounded-md ${
							sortBy === "lowest"
								? "bg-white text-tm-blue shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						Lowest Price
					</button>
					<button
						onClick={() => setSortBy("best")}
						className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-all rounded-md ${
							sortBy === "best"
								? "bg-white text-tm-blue shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						Best Seats
					</button>
				</div>
			</div>

			{/* Ticket List */}
			<div className="max-h-[500px] overflow-y-auto">
				{availableTickets.length === 0 ? (
					<div className="text-center py-12 px-4">
						<Ticket className="size-12 text-gray-300 mx-auto mb-3" />
						<p className="text-gray-600 font-medium">No tickets in this price range</p>
						<p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
					</div>
				) : (
					<div className="divide-y divide-gray-100">
						{availableTickets.map((ticket) => (
							<div
								key={ticket.id}
								ref={(el) => {
									if (el) ticketRefs.current.set(ticket.id, el);
									else ticketRefs.current.delete(ticket.id);
								}}
								className={`p-4 transition-colors hover:bg-gray-50 cursor-pointer ${
									ticket.isBestValue ? "bg-green-50/50" : ""
								} ${selectedSection === ticket.section ? "ring-2 ring-tm-blue ring-offset-2" : ""}`}
								onMouseEnter={() => onSelectSection(ticket.section)}
								onMouseLeave={() => onSelectSection(null)}
							>
								{/* Best Value Badge */}
								{ticket.isBestValue && (
									<div className="flex items-center gap-1.5 mb-2">
										<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
											<Zap className="size-3" /> BEST VALUE
										</span>
									</div>
								)}

								{/* Limited Availability Warning */}
								{ticket.isLimited && !ticket.isBestValue && (
									<div className="flex items-center gap-1.5 mb-2">
										<span className="text-xs text-orange-600 font-medium">
											Only a few left!
										</span>
									</div>
								)}

								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										{/* Section & Row */}
										<div className="flex items-center gap-2 mb-1">
											{getTierIcon(ticket.tier)}
											<span className="font-semibold text-gray-900 truncate">
												{ticket.section}
											</span>
											<span className="text-gray-400">•</span>
											<span className="text-gray-600 text-sm">{ticket.row}</span>
										</div>

										{/* Ticket Type & Badges */}
										<div className="flex items-center gap-2 flex-wrap">
											<p className="text-sm text-gray-600">{ticket.type}</p>
											{getTierBadge(ticket.tier)}
										</div>
									</div>

									{/* Price & Buy Button */}
									<div className="text-right shrink-0">
										<p className="text-xl font-bold text-gray-900">
											{formatPrice(ticket.price + ticket.fees)}
										</p>
										<p className="text-xs text-gray-500 mb-2">each</p>
										<Button 
											size="sm" 
											className="bg-tm-blue hover:bg-tm-blue-dark text-white min-w-[80px]"
											onClick={() => handleBuy(ticket)}
											disabled={isCheckingOut === ticket.id}
										>
											{isCheckingOut === ticket.id ? (
												<span className="flex items-center gap-1">
													<span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
												</span>
											) : (
												"Buy"
											)}
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="p-4 bg-gray-50 border-t border-gray-200">
				<p className="text-xs text-gray-500 text-center">
					<Shield className="size-3 inline mr-1" />
					All purchases are 100% guaranteed. Prices include fees.
				</p>
			</div>
		</div>
	);
}

