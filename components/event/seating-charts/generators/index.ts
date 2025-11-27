import { generateStadiumSections } from "./stadium";
import { generateFanSections } from "./fan";
import { generateTheatreSections } from "./theatre";
import type { GenerateSectionsParams } from "../types";

export function generateSections(
	venueType: "theatre" | "fan" | "stadium",
	params: GenerateSectionsParams
) {
	switch (venueType) {
		case "stadium":
			return generateStadiumSections(params);
		case "fan":
			return generateFanSections(params);
		case "theatre":
		default:
			return generateTheatreSections(params);
	}
}

