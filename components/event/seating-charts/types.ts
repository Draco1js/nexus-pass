export interface SeatingSection {
	id: string;
	displayId: string; // User-facing section ID
	polygon: import("ol/geom").Polygon;
	price: number;
	available: boolean;
	seats: number;
	availableSeats: number; // Number of available seats
	row?: string;
}

export interface TicketType {
	_id: string;
	section?: string;
	price: number;
	availableQuantity: number;
}

export interface GenerateSectionsParams {
	capacity: number;
	ticketTypes: TicketType[];
	baseLon: number;
	baseLat: number;
	centerX: number;
	centerY: number;
	stageY: number;
}

