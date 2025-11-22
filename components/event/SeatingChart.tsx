"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "~/components/ui/button";

interface SeatingChartProps {
	event: {
		_id: string;
		venue: {
			name: string;
		} | null;
		ticketTypes: Array<{
			_id: string;
			section?: string;
			price: number;
			availableQuantity: number;
		}>;
	};
}

export function SeatingChart({ event }: SeatingChartProps) {
	const [zoom, setZoom] = useState(1);
	const [selectedSection, setSelectedSection] = useState<string | null>(null);

	// Generate sections based on ticket types or use default arena layout
	const sections = event.ticketTypes.length > 0
		? event.ticketTypes.map((tt) => ({
				id: tt.section || "General",
				price: tt.price,
				available: tt.availableQuantity > 0,
			}))
		: [
				// Default sections for arena
				{ id: "1", price: 1500, available: true },
				{ id: "2", price: 1500, available: true },
				{ id: "3", price: 1200, available: true },
				{ id: "101", price: 800, available: true },
				{ id: "102", price: 800, available: true },
				{ id: "201", price: 500, available: true },
				{ id: "202", price: 500, available: true },
			];

	const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
	const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));

	return (
		<div className="bg-white rounded-none border border-gray-200 p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold">Select Your Seats</h2>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={handleZoomOut}
						disabled={zoom <= 0.5}
						className="rounded-none"
					>
						<ZoomOut className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={handleZoomIn}
						disabled={zoom >= 2}
						className="rounded-none"
					>
						<ZoomIn className="size-4" />
					</Button>
				</div>
			</div>

			{/* Seating Chart Visualization */}
			<div className="relative bg-gray-100 rounded-none overflow-hidden" style={{ minHeight: "600px" }}>
				<div
					className="relative w-full h-full"
					style={{
						transform: `scale(${zoom})`,
						transformOrigin: "center",
					}}
				>
					{/* Simplified Arena Layout */}
					<svg viewBox="0 0 800 600" className="w-full h-full">
						{/* Stage */}
						<rect
							x="300"
							y="550"
							width="200"
							height="40"
							fill="#1a1a1a"
							className="cursor-pointer"
						/>
						<text x="400" y="575" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
							STAGE
						</text>

						{/* Lower Bowl Sections */}
						{sections.slice(0, 8).map((section, idx) => {
							const angle = (idx * Math.PI * 2) / 8;
							const radius = 150;
							const x = 400 + radius * Math.cos(angle - Math.PI / 2);
							const y = 300 + radius * Math.sin(angle - Math.PI / 2);
							const isSelected = selectedSection === section.id;

							return (
								<g key={section.id}>
									<circle
										cx={x}
										cy={y}
										r="40"
										fill={isSelected ? "#0A23F0" : section.available ? "#e0e7ff" : "#d1d5db"}
										stroke={isSelected ? "#0A23F0" : "#9ca3af"}
										strokeWidth="2"
										className="cursor-pointer hover:opacity-80"
										onClick={() => section.available && setSelectedSection(section.id)}
									/>
									<text
										x={x}
										cy={y}
										textAnchor="middle"
										fill={isSelected ? "white" : "#1f2937"}
										fontSize="12"
										fontWeight="bold"
									>
										{section.id}
									</text>
								</g>
							);
						})}

						{/* Upper Bowl Sections */}
						{sections.slice(8).map((section, idx) => {
							const angle = (idx * Math.PI * 2) / (sections.length - 8);
							const radius = 220;
							const x = 400 + radius * Math.cos(angle - Math.PI / 2);
							const y = 300 + radius * Math.sin(angle - Math.PI / 2);
							const isSelected = selectedSection === section.id;

							return (
								<g key={section.id}>
									<circle
										cx={x}
										cy={y}
										r="30"
										fill={isSelected ? "#0A23F0" : section.available ? "#e0e7ff" : "#d1d5db"}
										stroke={isSelected ? "#0A23F0" : "#9ca3af"}
										strokeWidth="2"
										className="cursor-pointer hover:opacity-80"
										onClick={() => section.available && setSelectedSection(section.id)}
									/>
									<text
										x={x}
										cy={y}
										textAnchor="middle"
										fill={isSelected ? "white" : "#1f2937"}
										fontSize="10"
										fontWeight="bold"
									>
										{section.id}
									</text>
								</g>
							);
						})}
					</svg>
				</div>
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

