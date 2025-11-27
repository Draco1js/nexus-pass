import { Polygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import type { SeatingSection, GenerateSectionsParams } from "../types";

export function generateFanSections({
	capacity,
	ticketTypes,
	baseLon,
	baseLat,
	centerX,
	centerY,
	stageY,
}: GenerateSectionsParams): SeatingSection[] {
	const sections: SeatingSection[] = [];
	const basePrice = 2000;
	
	// Fan / Amphitheatre Layout with Capacity-Based Scaling
	
	// Determine Tiers based on capacity
	let tierConfigs: Array<{ name: string; weight: number; radius: number; depth: number; startAngle: number; endAngle: number }>;
	
	if (capacity <= 2000) {
		// Small: 2 Tiers
		tierConfigs = [
			{ name: "100", weight: 0.4, radius: 150, depth: 120, startAngle: -Math.PI / 4, endAngle: Math.PI + Math.PI / 4 },
			{ name: "200", weight: 0.6, radius: 300, depth: 120, startAngle: -Math.PI / 3, endAngle: Math.PI + Math.PI / 3 },
		];
	} else if (capacity <= 5000) {
		// Medium: 3 Tiers
		tierConfigs = [
			{ name: "100", weight: 0.3, radius: 150, depth: 120, startAngle: -Math.PI / 4, endAngle: Math.PI + Math.PI / 4 },
			{ name: "200", weight: 0.35, radius: 300, depth: 120, startAngle: -Math.PI / 3, endAngle: Math.PI + Math.PI / 3 },
			{ name: "300", weight: 0.35, radius: 450, depth: 120, startAngle: -Math.PI / 2.5, endAngle: Math.PI + Math.PI / 2.5 },
		];
	} else {
		// Large: 4 Tiers
		tierConfigs = [
			{ name: "100", weight: 0.2, radius: 150, depth: 120, startAngle: -Math.PI / 4, endAngle: Math.PI + Math.PI / 4 },
			{ name: "200", weight: 0.25, radius: 300, depth: 120, startAngle: -Math.PI / 3, endAngle: Math.PI + Math.PI / 3 },
			{ name: "300", weight: 0.25, radius: 450, depth: 120, startAngle: -Math.PI / 2.5, endAngle: Math.PI + Math.PI / 2.5 },
			{ name: "400", weight: 0.3, radius: 600, depth: 120, startAngle: -Math.PI / 2.2, endAngle: Math.PI + Math.PI / 2.2 },
		];
	}

	// Calculate Max Seats Per Section based on capacity range (Theatre logic adapted)
	let maxSeatsPerSection: number;
	if (capacity <= 500) maxSeatsPerSection = 40;
	else if (capacity <= 2000) maxSeatsPerSection = 60;
	else if (capacity <= 5000) maxSeatsPerSection = 80;
	else maxSeatsPerSection = 100;

	// Distribute capacity to tiers
	const tiersWithSections = tierConfigs.map(tier => {
		const tierCapacity = Math.floor(capacity * tier.weight);
		const minSections = Math.ceil(tierCapacity / maxSeatsPerSection);
		// Ensure at least a minimum aesthetic number of sections
		const numSections = Math.max(minSections, 5); 
		return {
			...tier,
			numSections,
			seatsPerSection: Math.floor(tierCapacity / numSections),
			remainder: tierCapacity % numSections
		};
	});
	
	// Distribute any global remainder (from rounding down tier weights) to the last tier
	const assignedCapacity = tiersWithSections.reduce((sum, t) => sum + (t.seatsPerSection * t.numSections) + t.remainder, 0);
	const globalRemainder = capacity - assignedCapacity;
	if (globalRemainder > 0 && tiersWithSections.length > 0) {
		tiersWithSections[tiersWithSections.length - 1].remainder += globalRemainder;
	}
	
	let sectionCounter = 0;
	const curvatureCenterY = stageY + 200; 
	
	tiersWithSections.forEach((tierConfig, tierIndex) => {
		const { name, numSections, radius, depth, startAngle, endAngle, seatsPerSection, remainder } = tierConfig;
		let tierSeatCounter = 0;

		const totalAngle = endAngle - startAngle;
		const anglePerSection = totalAngle / numSections;
		const gapAngle = 0.05;
		
		for (let i = 0; i < numSections; i++) {
			const tierSpan = Math.PI * 0.8; // 144 degrees span
			const startRad = (Math.PI - tierSpan) / 2; 
			const sectionStep = tierSpan / numSections;
			
			const currentStartAngle = startRad + (i * sectionStep) + (gapAngle / 2);
			const currentEndAngle = currentStartAngle + sectionStep - gapAngle;
			
			// Generate arc points
			const points: number[][] = [];
			const steps = 10;
			
			const outerRadius = radius + depth;
			for (let j = 0; j <= steps; j++) {
				const angle = currentEndAngle - ((currentEndAngle - currentStartAngle) * j / steps);
				const x = centerX + outerRadius * Math.cos(angle);
				const y = curvatureCenterY + outerRadius * Math.sin(angle);
				points.push([baseLon + (x / 111320), baseLat + (y / 111320)]);
			}
			
			const innerRadius = radius;
			for (let j = 0; j <= steps; j++) {
				const angle = currentStartAngle + ((currentEndAngle - currentStartAngle) * j / steps);
				const x = centerX + innerRadius * Math.cos(angle);
				const y = curvatureCenterY + innerRadius * Math.sin(angle);
				points.push([baseLon + (x / 111320), baseLat + (y / 111320)]);
			}
			
			if (points.length > 0) {
				points.push([points[0][0], points[0][1]]);
			}

			// Display ID: Tier-Number (e.g. 101, 102)
			const displaySectionNumber = parseInt(name) + (numSections - i); 
			const displayId = `${displaySectionNumber}`;
			
			// Distribute seats exact match
			const seats = tierSeatCounter < remainder ? seatsPerSection + 1 : seatsPerSection;
			tierSeatCounter++;
			
			// Pricing & Availability
			const existingTicketType = ticketTypes.find(tt => tt.section === displayId);
			const priceMultiplier = 1 + ((tiersWithSections.length - 1 - tierIndex) * 0.4);
			const price = existingTicketType?.price || Math.round(basePrice * priceMultiplier);
			
			let availableSeats: number;
			if (existingTicketType) {
				availableSeats = existingTicketType.availableQuantity;
			} else {
				// Simulation logic
				let occupiedPercent: number;
				if (tierIndex === 0) {
					occupiedPercent = 60 + (i % 4) * 8; 
				} else {
					const baseOccupied = 85 - (tierIndex / (tiersWithSections.length - 1)) * 45;
					const sectionVariation = ((i % 4) - 1.5) * 3.3;
					occupiedPercent = Math.max(20, Math.min(95, baseOccupied + sectionVariation));
				}
				const occupiedSeats = Math.floor(seats * (occupiedPercent / 100));
				availableSeats = Math.max(0, seats - occupiedSeats);
				if (seats > 1 && availableSeats === seats) availableSeats = Math.max(1, seats - 1);
				else if (seats > 1 && availableSeats === 0) availableSeats = 1;
			}

				try {
					const coordinates = points.map(([lon, lat]) => fromLonLat([lon, lat]));
					const polygon = new Polygon([coordinates]);
				
					sections.push({
					id: `fan-${name}-${i}-${sectionCounter++}`,
					displayId,
					polygon,
					price,
						available: availableSeats > 0,
					seats,
					availableSeats,
					});
			} catch (e) {
				console.error("Error creating fan section", e);
			}
		}
	});
	
	return sections;
}
