import { readFile } from "fs/promises";
import { join } from "path";
import dotenv from 'dotenv'
dotenv.config({ quiet: true })
dotenv.config({path: "./.env.local"})
dotenv.config({ path: "../.env.local", quiet: true})

// Helper to create slugs from names
function createSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.trim();
}

// Parse CSV file
async function parseCSV(csvPath: string) {
	const content = await readFile(csvPath, "utf-8");
	const lines = content.split("\n").slice(1); // Skip header
	const artists: Array<{ image: string; name: string; category: string }> = [];

	for (const line of lines) {
		if (!line.trim()) continue;
		// Parse CSV line (handling quoted fields)
		const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
		if (!matches || matches.length < 5) continue;

		const cleanField = (field: string) =>
			field
				.replace(/^,?"?/, "")
				.replace(/"?$/, "")
				.trim();

		const image = cleanField(matches[2] || "");
		const name = cleanField(matches[3] || "");
		const category = cleanField(matches[4] || "");

		if (image && name && category) {
			artists.push({ image, name, category });
		}
	}

	return artists;
}

// Parse artist bios from TXT file
async function parseBios(txtPath: string) {
	const content = await readFile(txtPath, "utf-8");
	const separator = "------------------------------------------------------------";
	const sections = content.split(separator).map((s) => s.trim()).filter((s) => s.length > 0);
	return sections;
}

// Map category names to standardized categories
function mapCategory(category: string): string {
	const categoryMap: Record<string, string> = {
		Pop: "Concerts",
		"R&B": "Concerts",
		Country: "Concerts",
		Urban: "Concerts",
		Other: "Concerts",
		NBA: "Sports",
		Musical: "Arts & Theater",
		Drama: "Arts & Theater",
		Comedy: "Comedy",
	};
	return categoryMap[category] || "Concerts";
}

// Map category to genre
function mapGenre(category: string): string {
	const genreMap: Record<string, string> = {
		Pop: "Pop",
		"R&B": "R&B",
		Country: "Country",
		Urban: "Hip-Hop",
		Other: "Alternative",
		NBA: "Basketball",
		Musical: "Musical Theatre",
		Drama: "Drama",
		Comedy: "Stand-Up",
	};
	return genreMap[category] || "Other";
}

export interface ParsedArtist {
	name: string;
	slug: string;
	bio: string;
	image: string;
	genre: string;
	category: string;
}

export async function parseTicketmasterData(): Promise<ParsedArtist[]> {
	const csvPath = join(process.cwd(), "assets", "ticketmaster.csv");
	const txtPath = join(process.cwd(), "assets", "artist_bios.txt");

	console.log("📖 Parsing CSV and TXT files...");
	const artistsData = await parseCSV(csvPath);
	const bios = await parseBios(txtPath);

	console.log(`✅ Found ${artistsData.length} artists and ${bios.length} bios`);

	const parsedArtists: ParsedArtist[] = [];

	for (let i = 0; i < artistsData.length; i++) {
		const artistData = artistsData[i];
		const bio = bios[i] || "No biography available.";

		parsedArtists.push({
			name: artistData.name,
			slug: createSlug(artistData.name),
			bio: bio,
			image: artistData.image,
			genre: mapGenre(artistData.category),
			category: mapCategory(artistData.category),
		});
	}

	return parsedArtists;
}

// Main function to seed the database
async function main() {
	try {
		const artists = await parseTicketmasterData();

		console.log("\n📤 Sending data to Convex...");

		const convexUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
		if (!convexUrl) {
			console.log(process.env)
			throw new Error("NEXT_PUBLIC_SITE_CONVEX_URL environment variable is not set");
		}

		const response = await fetch(`${convexUrl}/seed`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ artists }),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to seed database: ${error}`);
		}

		const result = await response.json();
		console.log("\n🎉 Database seeding completed successfully!");
		console.log(result);
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		process.exit(1);
	}
}

// Run if this is the main module
if (require.main === module) {
	main();
}

