import { Polygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import type { SeatingSection, GenerateSectionsParams } from "../types";

export function generateTheatreSections({
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
	
	// For very small venues (10-40 seats), show individual seats
	const isIndividualSeats = capacity >= 10 && capacity <= 40;
	
	let numSections: number;
	let numRows: number;
	let sectionsPerRow: number;
	let baseSeatsPerSection: number;
	let remainder: number;
	let maxSeatsPerSection: number;

	if (isIndividualSeats) {
		// Individual seats: 5-10 seats per row
		const seatsPerRow = capacity <= 20 ? 5 : capacity <= 30 ? 7 : 10;
		numRows = Math.ceil(capacity / seatsPerRow);
		sectionsPerRow = seatsPerRow;
		numSections = capacity; // Each seat is its own "section"
		baseSeatsPerSection = 1;
		remainder = 0;
		maxSeatsPerSection = 1;
	} else {
		// Determine initial sections per row and max seats per section based on capacity
		let initialSectionsPerRow: number;
		if (capacity <= 500) {
			initialSectionsPerRow = 3;
			maxSeatsPerSection = 40;
		} else if (capacity <= 1000) {
			initialSectionsPerRow = 4;
			maxSeatsPerSection = 40;
		} else if (capacity <= 2000) {
			initialSectionsPerRow = 5;
			maxSeatsPerSection = 60;
		} else if (capacity <= 5000) {
			initialSectionsPerRow = 7;
			maxSeatsPerSection = 80;
		} else if (capacity <= 10000) {
			initialSectionsPerRow = 8;
			maxSeatsPerSection = 80;
		} else if (capacity <= 15000) {
			initialSectionsPerRow = 9;
			maxSeatsPerSection = 100;
		} else {
			initialSectionsPerRow = 10;
			maxSeatsPerSection = 100;
		}
		
		// Calculate minimum sections needed based on max seats per section
		const minSections = Math.ceil(capacity / maxSeatsPerSection);
		
		// Start with initial sections per row
		sectionsPerRow = initialSectionsPerRow;
		
		// Calculate number of rows needed
		numRows = Math.ceil(minSections / sectionsPerRow);
		
		// If we have too many rows (more than K), increase sections per row
		const MAX_ROWS_THRESHOLD = 15; // K value - maximum desirable rows
		
		if (numRows > MAX_ROWS_THRESHOLD) {
			// Recalculate sections per row to keep rows under threshold
			sectionsPerRow = Math.ceil(minSections / MAX_ROWS_THRESHOLD);
			
			// Recalculate rows with new sections per row
			numRows = Math.ceil(minSections / sectionsPerRow);
		}
		
		numSections = numRows * sectionsPerRow;
		
		// Calculate seats per section, ensuring we account for all seats
		baseSeatsPerSection = Math.floor(capacity / numSections);
		remainder = capacity % numSections;
	}

	// Theatre: Rectangular sections in rows (or individual seats for small venues)
	// Fixed section dimensions
	const SECTION_WIDTH = isIndividualSeats ? 20 : 50; // meters (smaller for individual seats)
	const SECTION_HEIGHT = isIndividualSeats ? 30 : 50; // meters (smaller for individual seats)
	
	let sectionCounter = 0;
	let seatCounter = 0; // Track which sections get extra seats
	
	for (let row = 0; row < numRows; row++) {
		const rowY = stageY + 100 + (row * SECTION_HEIGHT); // meters
		
		// For individual seats, calculate how many seats in this row
		const seatsInThisRow = isIndividualSeats
			? row === numRows - 1
				? capacity - (sectionsPerRow * (numRows - 1))
				: sectionsPerRow
			: sectionsPerRow;
		
		// Calculate total row width based on number of sections
		const totalRowWidth = seatsInThisRow * SECTION_WIDTH;
		
		for (let i = 0; i < seatsInThisRow; i++) {
			const startX = centerX - totalRowWidth / 2 + (i * SECTION_WIDTH);
			const endX = startX + SECTION_WIDTH;
			
			const points: number[][] = [
				[baseLon + (startX / 111320), baseLat + (rowY / 111320)],
				[baseLon + (endX / 111320), baseLat + (rowY / 111320)],
				[baseLon + (endX / 111320), baseLat + ((rowY + SECTION_HEIGHT) / 111320)],
				[baseLon + (startX / 111320), baseLat + ((rowY + SECTION_HEIGHT) / 111320)],
				[baseLon + (startX / 111320), baseLat + (rowY / 111320)],
			];
			
			// Generate unique section ID based on row and position (alphanumeric: A1, B2, C3, etc.)
			let displayId: string;
			if (isIndividualSeats) {
				// Individual seats: use seat number (1, 2, 3, etc.)
				displayId = `${row * sectionsPerRow + i + 1}`;
			} else {
				// Use letters for rows (A, B, C, etc.) and numbers for sections (1, 2, 3, etc.)
				const rowLetter = String.fromCharCode(65 + row); // A=65, B=66, etc.
				displayId = `${rowLetter}${i + 1}`;
			}
			
			// Calculate price based on distance from stage (closer = more expensive)
			// Row 0 is closest, so it should have the highest multiplier
			const maxRow = numRows - 1;
			const priceMultiplier = 1 + ((maxRow - row) * 0.35);
			const price = Math.round(basePrice * priceMultiplier);
			
			// Distribute remainder seats across first sections
			const seats = isIndividualSeats 
				? 1 
				: seatCounter < remainder 
					? baseSeatsPerSection + 1 
					: baseSeatsPerSection;
			seatCounter++;
			
			const existingTicketType = ticketTypes.find(tt => tt.section === displayId);
			
			// Calculate available seats with simulated occupancy for color variation
			let availableSeats: number;
			if (isIndividualSeats) {
				availableSeats = 1; // Individual seats are always available
			} else {
				// Use actual ticket type data if available, otherwise simulate occupancy
				if (existingTicketType) {
					availableSeats = existingTicketType.availableQuantity;
				} else {
					// Simulate occupancy for visual color variation
				// Closer rows (lower row number) have MORE occupancy (less availability)
				// This creates a gradient: front rows are more occupied (red/orange/yellow), back rows less (light blue)
				const maxRow = numRows - 1;
				
				// Calculate occupied percentage (0-100%)
				// Row 0 (closest): ~90% occupied (red)
				// Middle rows: ~70% occupied (orange/yellow)
				// Row maxRow (furthest): ~30% occupied (light blue)
				let occupiedPercent: number;
				if (maxRow === 0) {
					// Single row: vary by section position
					occupiedPercent = 50 + (i % 4) * 12; // 50%, 62%, 74%, 86% for variation
				} else {
					// Front rows: 90% occupied, back rows: 30% occupied
					const baseOccupied = 90 - (row / maxRow) * 60; // 90% down to 30%
					// Add variation based on section position: ±15% for more dramatic variation
					const sectionVariation = ((i % 4) - 1.5) * 5; // -7.5% to +7.5% variation
					occupiedPercent = Math.max(15, Math.min(95, baseOccupied + sectionVariation));
				}
				
					// Convert to available seats
				const occupiedSeats = Math.floor(seats * (occupiedPercent / 100));
				availableSeats = Math.max(0, seats - occupiedSeats);
				
				// Ensure we have at least some variation: if seats are few, ensure different available counts
				if (seats > 1 && availableSeats === seats) {
					// If all seats are available, make at least one occupied for color
					availableSeats = Math.max(1, seats - 1);
				} else if (seats > 1 && availableSeats === 0) {
					// If no seats available, make at least one available
					availableSeats = 1;
				}
				}
			}
			
			sections.push({
				id: isIndividualSeats 
					? `seat-${row}-${i}-${sectionCounter++}` 
					: `theatre-${row}-${i}-${sectionCounter++}`,
				displayId: displayId,
				polygon: new Polygon([points.map(([lon, lat]) => fromLonLat([lon, lat]))]),
				price: existingTicketType?.price || price,
				available: availableSeats > 0,
				seats: seats,
				availableSeats: availableSeats,
				row: `Row ${row + 1}`,
			});
		}
	}
	
	return sections;
}

