import { Polygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import type { SeatingSection, GenerateSectionsParams } from "../types";

export function generateStadiumSections({
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
	
	// Stadium Layout with Capacity-Based Scaling
	
	// Determine Floor vs Bowl split based on capacity
	// Typically Floor is ~10-20% of capacity
	
	const floorPercent = 0.15;
	const floorCapacity = Math.floor(capacity * floorPercent);
	const bowlCapacity = capacity - floorCapacity;
	
	// 1. Floor Configuration
	// Grid size depends on floor capacity
	// Aim for ~100-200 seats per floor section if possible for large venues
	let maxSeatsPerFloorSection = 100;
	if (capacity < 5000) maxSeatsPerFloorSection = 50;
	
	const totalFloorSectionsNeeded = Math.ceil(floorCapacity / maxSeatsPerFloorSection);
	// Try to make a nice grid (approx square/rectangle)
	const floorCols = Math.ceil(Math.sqrt(totalFloorSectionsNeeded));
	const floorRows = Math.ceil(totalFloorSectionsNeeded / floorCols);
	
	const realTotalFloorSections = floorRows * floorCols;
	const seatsPerFloorSection = Math.floor(floorCapacity / realTotalFloorSections);
	const floorRemainder = floorCapacity % realTotalFloorSections;
	
	const floorSectionWidth = 60;
	const floorSectionDepth = 80;
	const floorGap = 10;
	const floorStartY = stageY + 100;

	// 2. Bowl Configuration
	// Split remaining capacity into tiers (Lower/Upper)
	let bowlConfigs: Array<{ name: string; weight: number; depth: number; gap: number }>;
	if (capacity <= 5000) {
		// 1 Tier
		bowlConfigs = [{ name: "100", weight: 1.0, depth: 120, gap: 20 }];
	} else {
		// 2 Tiers (Lower/Upper)
		bowlConfigs = [
			{ name: "100", weight: 0.55, depth: 100, gap: 20 },
			{ name: "200", weight: 0.45, depth: 120, gap: 20 }
		];
	}
	
	let maxSeatsPerBowlSection = 150;
	if (capacity < 5000) maxSeatsPerBowlSection = 80;
	
	// Process Bowl Tiers
	const bowlTiers = bowlConfigs.map(config => {
		const tierCapacity = Math.floor(bowlCapacity * config.weight);
		const minSections = Math.ceil(tierCapacity / maxSeatsPerBowlSection);
		// Ideally ~20-30 sections around the horseshoe
		const numSections = Math.max(minSections, 15);
		return {
			...config,
			numSections,
			seatsPerSection: Math.floor(tierCapacity / numSections),
			remainder: tierCapacity % numSections
		};
	});

	// Distribute any global remainder
	const assigned = (realTotalFloorSections * seatsPerFloorSection + floorRemainder) + 
					 bowlTiers.reduce((sum, t) => sum + (t.numSections * t.seatsPerSection) + t.remainder, 0);
	const globalDiff = capacity - assigned;
	if (globalDiff > 0 && bowlTiers.length > 0) {
		bowlTiers[bowlTiers.length - 1].remainder += globalDiff;
	}
	
	let sectionCounter = 0;
	let floorSeatCounter = 0;

	// --- Helper to create section ---
	const createSection = (
		points: number[][], 
		displayId: string, 
		tierIndex: number, 
		isFloor: boolean,
		seats: number,
		available: number
	) => {
		// Pricing
		const existingTicketType = ticketTypes.find(tt => tt.section === displayId);
		const priceMultiplier = isFloor ? 3.0 : (bowlConfigs.length - (tierIndex - 1)) * 0.8 + 0.5;
		const price = existingTicketType?.price || Math.round(basePrice * priceMultiplier);

		try {
			const coordinates = points.map(([lon, lat]) => fromLonLat([lon, lat]));
			if (coordinates.length > 0 && (coordinates[0][0] !== coordinates[coordinates.length-1][0] || coordinates[0][1] !== coordinates[coordinates.length-1][1])) {
				coordinates.push([...coordinates[0]]);
			}
			
			sections.push({
				id: `stadium-${displayId}-${sectionCounter++}`,
				displayId,
				polygon: new Polygon([coordinates]),
				price,
				available: available > 0,
				seats,
				availableSeats: available,
			});
		} catch (e) {
			console.error("Error creating stadium section", e);
		}
	};

	// --- Generate Floor ---
	const totalFloorWidth = (floorCols * floorSectionWidth) + ((floorCols - 1) * floorGap);
	
	for (let r = 0; r < floorRows; r++) {
		for (let c = 0; c < floorCols; c++) {
			const x = centerX - (totalFloorWidth / 2) + c * (floorSectionWidth + floorGap);
			const y = floorStartY + r * (floorSectionDepth + floorGap);
			
			const p1 = [baseLon + x / 111320, baseLat + y / 111320];
			const p2 = [baseLon + (x + floorSectionWidth) / 111320, baseLat + y / 111320];
			const p3 = [baseLon + (x + floorSectionWidth) / 111320, baseLat + (y + floorSectionDepth) / 111320];
			const p4 = [baseLon + x / 111320, baseLat + (y + floorSectionDepth) / 111320];
			
			const floorNum = (r * floorCols) + c + 1;
			const displayId = `FL-${floorNum}`;
			
			const seats = floorSeatCounter < floorRemainder ? seatsPerFloorSection + 1 : seatsPerFloorSection;
			floorSeatCounter++;

			// Availability Logic
			const existing = ticketTypes.find(tt => tt.section === displayId);
			let avail: number;
			if (existing) avail = existing.availableQuantity;
			else {
				const occupiedPercent = 85 + (Math.random() * 10);
				const occ = Math.floor(seats * (occupiedPercent / 100));
				avail = Math.max(0, seats - occ);
				if (seats > 1 && avail === seats) avail = Math.max(1, seats - 1);
				else if (seats > 1 && avail === 0) avail = 1;
			}
			
			createSection([p1, p2, p3, p4], displayId, 0, true, seats, avail);
		}
	}

	// --- Generate Bowl ---
	const bowlCenterY = floorStartY + (floorRows * floorSectionDepth) / 2; 
	let currentInnerRadiusX = (totalFloorWidth / 2) + 50; 
	let currentInnerRadiusY = (floorRows * floorSectionDepth / 2) + 50;

	bowlTiers.forEach((config, tierIdx) => {
		const tierIndex = tierIdx + 1; 
		const outerRadiusX = currentInnerRadiusX + config.depth;
		const outerRadiusY = currentInnerRadiusY + config.depth;
		
		// U Shape: Start PI-0.2 (West), End 2PI+0.2 (East)
		const startAngle = Math.PI - 0.2; 
		const endAngle = 2 * Math.PI + 0.2; 
		const totalAngle = endAngle - startAngle;
		const angleStep = totalAngle / config.numSections;
		
		let tierSeatCounter = 0;

		for (let i = 0; i < config.numSections; i++) {
			const sAngle = startAngle + (i * angleStep);
			const eAngle = sAngle + angleStep;
			const gap = 0.02;
			const useSAngle = sAngle + gap;
			const useEAngle = eAngle - gap;
			
			const points: number[][] = [];
			const steps = 10;
			
			for (let j = 0; j <= steps; j++) {
				const a = useSAngle + (useEAngle - useSAngle) * (j/steps);
				const px = centerX + outerRadiusX * Math.cos(a);
				const py = bowlCenterY + outerRadiusY * Math.sin(a); 
				points.push([baseLon + px / 111320, baseLat + py / 111320]);
			}
			for (let j = steps; j >= 0; j--) {
				const a = useSAngle + (useEAngle - useSAngle) * (j/steps);
				const px = centerX + currentInnerRadiusX * Math.cos(a);
				const py = bowlCenterY + currentInnerRadiusY * Math.sin(a);
				points.push([baseLon + px / 111320, baseLat + py / 111320]);
			}
			
			const sectionNum = parseInt(config.name) + i + 1;
			const displayId = `${sectionNum}`;
			
			const seats = tierSeatCounter < config.remainder ? config.seatsPerSection + 1 : config.seatsPerSection;
			tierSeatCounter++;
			
			// Availability
			const existing = ticketTypes.find(tt => tt.section === displayId);
			let avail: number;
			if (existing) avail = existing.availableQuantity;
			else {
				const tierBase = tierIndex === 1 ? 75 : 40;
				const occupiedPercent = tierBase + (Math.random() * 20 - 10);
				const occ = Math.floor(seats * (occupiedPercent / 100));
				avail = Math.max(0, seats - occ);
				if (seats > 1 && avail === seats) avail = Math.max(1, seats - 1);
				else if (seats > 1 && avail === 0) avail = 1;
					}
					
			createSection(points, displayId, tierIndex, false, seats, avail);
		}
		
		currentInnerRadiusX += config.depth + config.gap;
		currentInnerRadiusY += config.depth + config.gap;
	});
	
	return sections;
}
