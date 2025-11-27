"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { ZoomIn, ZoomOut, Home, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { RMap, RLayerVector, RFeature, RStyle, ROverlay } from "rlayers";
import { Polygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import "ol/ol.css";
import { generateSections } from "./seating-charts/generators";
import type { SeatingSection } from "./seating-charts/types";

interface SeatingChartProps {
	event: {
		_id: string;
		venue: {
			name: string;
			capacity: number;
			venueType?: "theatre" | "fan" | "stadium";
		} | null;
		ticketTypes: Array<{
			_id: string;
			section?: string;
			price: number;
			availableQuantity: number;
		}>;
	};
	selectedSection: string | null;
	onSelectSection: (sectionId: string | null) => void;
}

// Separate component for section features to manage hover state
function SectionFeature({
	section,
	isSelected,
	fillColor,
	strokeColor,
	availableSeats,
	totalSeats,
	onClick,
}: {
	section: SeatingSection;
	isSelected: boolean;
	fillColor: string;
	strokeColor: string;
	availableSeats: number;
	totalSeats: number;
	onClick: () => void;
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<RFeature
			geometry={section.polygon}
			properties={{
				sectionId: section.id,
				price: section.price,
				available: section.available,
				seats: section.seats,
				availableSeats: section.availableSeats,
				row: section.row,
			}}
			onClick={(e) => {
				if (section.available) {
					onClick();
				}
			}}
			onPointerEnter={(e) => {
				e.map.getTargetElement().style.cursor = section.available ? "pointer" : "not-allowed";
				setIsHovered(true);
			}}
			onPointerLeave={(e) => {
				e.map.getTargetElement().style.cursor = "";
				setIsHovered(false);
			}}
		>
			<RStyle.RStyle>
				<RStyle.RStroke color={strokeColor} width={2} />
				<RStyle.RFill color={fillColor} />
			</RStyle.RStyle>
			<ROverlay
				positioning="center-center"
				className="section-label"
			>
				<div
					className={`text-xs font-semibold text-center px-1 py-0.5 ${
						isSelected
							? "text-white"
							: section.available
								? "text-gray-900"
								: "text-gray-500"
					}`}
				>
					{section.displayId}
				</div>
			</ROverlay>
			{isHovered && (
				<ROverlay
					positioning="top-center"
					className="section-tooltip"
					offset={[0, -10]}
				>
					<div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 relative opacity-100 border border-gray-700 font-medium">
						{availableSeats} of {totalSeats} seats available
					</div>
				</ROverlay>
			)}
		</RFeature>
	);
}

export function SeatingChart({ event, selectedSection, onSelectSection }: SeatingChartProps) {
	// const [selectedSection, setSelectedSection] = useState<string | null>(null); // Lifted up
	const [sections, setSections] = useState<SeatingSection[]>([]);
	const [isPending, startTransition] = useTransition();
	// Center at Karachi coordinates
	const baseLon = 67.0011;
	const baseLat = 24.8607;
	const [view, setView] = useState({ center: fromLonLat([baseLon, baseLat]), zoom: 16 });

	const capacity = event.venue?.capacity || 1000;
	const venueType = event.venue?.venueType || "theatre";

	// Generate sections in a transition to avoid blocking the UI
	useEffect(() => {
		// Use setTimeout to allow the initial render (with loading state) to commit before heavy calculation
		const timer = setTimeout(() => {
		startTransition(() => {
			// Common coordinate constants
			const baseLon = 67.0011; // Karachi longitude
			const baseLat = 24.8607; // Karachi latitude
			const centerX = 0; // meters offset from base
			const centerY = 0; // meters offset from base
			const stageY = -400; // Stage at bottom (meters)
			
			const generatedSections = generateSections(venueType, {
				capacity,
				ticketTypes: event.ticketTypes,
				baseLon,
				baseLat,
				centerX,
				centerY,
				stageY,
			});
			setSections(generatedSections);
		});
		}, 0);
		return () => clearTimeout(timer);
	}, [capacity, venueType, event.ticketTypes]);

	// Calculate view bounds based on sections to ensure proper zoom
	const calculateViewBounds = useCallback(() => {
		if (sections.length === 0) return null;
		
		// Find min/max coordinates from all sections (in Meters/EPSG:3857)
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		
		sections.forEach(section => {
			const extent = section.polygon.getExtent();
			minX = Math.min(minX, extent[0]);
			maxX = Math.max(maxX, extent[2]);
			minY = Math.min(minY, extent[1]);
			maxY = Math.max(maxY, extent[3]);
		});
		
		// Add padding (in meters)
		const padding = 50; 
		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		const width = maxX - minX + padding * 2;
		const height = maxY - minY + padding * 2;
		
		// Calculate appropriate zoom level for Web Mercator
		// Resolution at zoom 0 is ~156543 meters/pixel
		// We assume a map container width of roughly 800px
		const mapWidthPx = 800;
		const resolution = Math.max(width / mapWidthPx, height / 600);
		const zoom = Math.log2(156543 / resolution);
		
		return {
			center: [centerX, centerY], // Already in EPSG:3857 (Meters)
			zoom: Math.max(14, Math.min(22, zoom - 0.5)) // Adjust zoom slightly out to ensure full visibility
		};
	}, [sections]);

	// Update view when sections change to fit the venue
	useEffect(() => {
		if (sections.length > 0) {
			const newView = calculateViewBounds();
			if (newView) {
				setView(newView);
			}
		}
	}, [sections.length, calculateViewBounds]);

	const handleSectionClick = useCallback((sectionId: string) => {
		// Find the display ID of the clicked section
		const section = sections.find(s => s.id === sectionId);
		if (section) {
			// Toggle selection: if already selected (by display ID), deselect
			onSelectSection(selectedSection === section.displayId ? null : section.displayId);
		}
	}, [sections, selectedSection, onSelectSection]);

	const handleZoomIn = useCallback(() => {
		setView((v) => {
			const newZoom = Math.min(v.zoom * 1.5, 20);
			return { ...v, zoom: newZoom };
		});
	}, []);

	const handleZoomOut = useCallback(() => {
		setView((v) => {
			const newZoom = Math.max(v.zoom / 1.5, 10);
			return { ...v, zoom: newZoom };
		});
	}, []);

	const handleHome = useCallback(() => {
		setView({ center: fromLonLat([baseLon, baseLat]), zoom: 16 });
	}, []);

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("en-PK", {
			style: "currency",
			currency: "PKR",
			minimumFractionDigits: 0,
		}).format(price);
	};

	const stageY = -400;
	const baseLonStage = 67.0011;
	const baseLatStage = 24.8607;

	return (
		<div className="bg-white rounded-none border border-gray-200 p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold">Select Your Seats</h2>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={handleHome}
						className="rounded-none"
						aria-label="Reset view"
					>
						<Home className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={handleZoomOut}
						disabled={view.zoom <= 10}
						className="rounded-none"
						aria-label="Zoom out"
					>
						<ZoomOut className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={handleZoomIn}
						disabled={view.zoom >= 20}
						className="rounded-none"
						aria-label="Zoom in"
					>
						<ZoomIn className="size-4" />
					</Button>
				</div>
			</div>

			{/* Seating Chart Map */}
			<div className="relative bg-gray-100 rounded-none overflow-hidden border border-gray-200" style={{ minHeight: "600px", height: "600px" }}>
				{(isPending || sections.length === 0) && (
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-50 animate-pulse">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="size-10 animate-spin text-[#0A23F0]" />
							<p className="text-sm font-medium text-gray-500">Generating interactive map...</p>
						</div>
					</div>
				)}
				{sections.length > 0 && (
					<RMap
						width="100%"
						height="600px"
						initial={view}
						view={[view, setView]}
						projection="EPSG:3857"
						noDefaultControls={true}
					>
						{/* Base background layer - covers entire viewport */}
						<RLayerVector zIndex={0}>
							<RFeature
								geometry={new Polygon([
									[
										fromLonLat([baseLon - 0.1, baseLat - 0.1]),
										fromLonLat([baseLon + 0.1, baseLat - 0.1]),
										fromLonLat([baseLon + 0.1, baseLat + 0.1]),
										fromLonLat([baseLon - 0.1, baseLat + 0.1]),
										fromLonLat([baseLon - 0.1, baseLat - 0.1]),
									],
								])}
							>
								<RStyle.RStyle>
									<RStyle.RFill color="rgba(243, 244, 246, 1)" />
									<RStyle.RStroke color="rgba(243, 244, 246, 1)" width={0} />
								</RStyle.RStyle>
							</RFeature>
						</RLayerVector>
						<RLayerVector zIndex={10}>
						{sections.map((section) => {
							const isSelected = section.displayId === selectedSection;
							
							// Calculate occupancy percentage
							const totalSeats = section.seats;
							const availableSeats = section.availableSeats;
							const occupiedSeats = totalSeats - availableSeats;
							const occupancyPercent = totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0;
							
							// Determine color based on occupancy
							let fillColor: string;
							if (!section.available || availableSeats === 0) {
								fillColor = "rgba(209, 213, 219, 0.5)"; // Unavailable
							} else if (isSelected) {
								fillColor = "rgba(10, 35, 240, 0.8)"; // Selected
							} else if (occupancyPercent >= 90) {
								fillColor = "rgba(239, 68, 68, 0.7)"; // Red - 90%+ occupied
							} else if (occupancyPercent >= 75) {
								fillColor = "rgba(249, 115, 22, 0.7)"; // Orange - 75%+ occupied
							} else if (occupancyPercent >= 60) {
								fillColor = "rgba(234, 179, 8, 0.7)"; // Yellow - 60%+ occupied
							} else {
								fillColor = "rgba(224, 231, 255, 0.7)"; // Light blue - <60% occupied
							}
							
							const strokeColor = isSelected ? "#0A23F0" : "#9ca3af";
							
							return (
								<SectionFeature
									key={section.id}
									section={section}
									isSelected={isSelected}
									fillColor={fillColor}
									strokeColor={strokeColor}
									availableSeats={availableSeats}
									totalSeats={totalSeats}
									onClick={() => {
										if (section.available) {
											handleSectionClick(section.id);
										}
									}}
								/>
							);
						})}

							{/* Stage */}
							<RFeature
								geometry={new Polygon([
									[
										fromLonLat([baseLonStage + (-150 / 111320), baseLatStage + (stageY / 111320)]),
										fromLonLat([baseLonStage + (150 / 111320), baseLatStage + (stageY / 111320)]),
										fromLonLat([baseLonStage + (150 / 111320), baseLatStage + ((stageY + 50) / 111320)]),
										fromLonLat([baseLonStage + (-150 / 111320), baseLatStage + ((stageY + 50) / 111320)]),
										fromLonLat([baseLonStage + (-150 / 111320), baseLatStage + (stageY / 111320)]),
									],
								])}
							>
								<RStyle.RStyle>
									<RStyle.RFill color="rgba(26, 26, 26, 0.9)" />
									<RStyle.RStroke color="#000" width={2} />
								</RStyle.RStyle>
								<ROverlay positioning="center-center" className="stage-label">
									<div className="text-white font-bold text-sm">STAGE</div>
								</ROverlay>
						</RFeature>
					</RLayerVector>
				</RMap>
				)}

				{/* Price Tooltip */}
				{selectedSection && (
					<div className="absolute top-4 left-4 bg-white border border-gray-300 rounded-none p-3 shadow-lg z-50">
						<div className="font-bold text-sm mb-1">
							Section {sections.find((s) => s.displayId === selectedSection)?.displayId}
						</div>
						<div className="text-xs text-gray-600">
							{formatPrice(sections.find((s) => s.displayId === selectedSection)?.price || 0)} per ticket
						</div>
						{sections.find((s) => s.displayId === selectedSection)?.row && (
							<div className="text-xs text-gray-600 mt-1">
								{sections.find((s) => s.displayId === selectedSection)?.row}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Legend */}
			<div className="mt-4 flex items-center gap-6 text-sm">
				<div className="flex items-center gap-2">
					<div className="size-4 bg-[#e0e7ff] border border-gray-300 rounded-none" />
					<span>Available</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="size-4 bg-[#0A23F0] border border-[#0A23F0] rounded-none" />
					<span>Selected</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="size-4 bg-gray-300 border border-gray-400 rounded-none" />
					<span>Unavailable</span>
				</div>
			</div>
		</div>
	);
}
