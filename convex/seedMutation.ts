import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to create slugs from names
function createSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.trim();
}

const artistValidator = v.object({
	name: v.string(),
	slug: v.string(),
	bio: v.string(),
	image: v.string(),
	genre: v.string(),
	category: v.string(),
});

export const seedDatabase = internalMutation({
	args: {
		artists: v.array(artistValidator),
	},
	returns: v.object({
		categories: v.number(),
		venues: v.number(),
		artists: v.number(),
		events: v.number(),
		ticketTypes: v.number(),
	}),
	handler: async (ctx, args) => {
		const now = Date.now();
		let totalEvents = 0;
		let totalTicketTypes = 0;

		console.log("📁 Creating categories...");
		const categoryNames = [
			"Concerts",
			"Sports",
			"Arts & Theater",
			"Comedy",
			"Family",
		];
		const categoryIds: Record<string, Id<"categories">> = {};

		for (let i = 0; i < categoryNames.length; i++) {
			const name = categoryNames[i];
			const categoryId = await ctx.db.insert("categories", {
				name,
				slug: createSlug(name),
				description: `Find the best ${name.toLowerCase()} tickets`,
				sortOrder: i,
			});
			categoryIds[name] = categoryId;
		}

	console.log("🏟️  Creating venues...");
	const venues = [
		{ city: "Karachi", name: "Arts Council", slug: "karachi-arena" },
		{ city: "Lahore", name: "Neon Square", slug: "lahore-arena" },
		{ city: "Islamabad", name: "National Arts Council", slug: "islamabad-arena" },
		{ city: "Faisalabad", name: "Chenab Club", slug: "faisalabad-arena" },
		{ city: "Multan", name: "Multan Cricket Stadium", slug: "multan-arena" },
		{ city: "Peshawar", name: "Uptown Sports Arena", slug: "peshawar-arena" },
		{ city: "Sialkot", name: "Anwar Club", slug: "sialkot-arena" },
		{ city: "Quetta", name: "Quetta Stadium", slug: "quetta-arena" },
	];
	const venueIds: Record<string, Id<"venues">> = {};
	const cities = venues.map(v => v.city);

	for (const venue of venues) {
		const venueId = await ctx.db.insert("venues", {
			name: venue.name,
			slug: venue.slug,
			address: `Main Boulevard, ${venue.city}`,
			city: venue.city,
			state: undefined,
			country: "Pakistan",
			postalCode: undefined,
			capacity: 15000,
			phone: undefined,
			website: undefined,
			images: [
				`https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=600&fit=crop`,
			],
			parkingInfo: "Ample parking available",
			accessibilityInfo: "Wheelchair accessible",
			description: `Premier entertainment venue in ${venue.city}`,
			coordinates: undefined,
			createdAt: now,
		});
		venueIds[venue.city] = venueId;
	}

		console.log("🎤 Creating artists and events...");
		const artistIds: string[] = [];

		for (let i = 0; i < args.artists.length; i++) {
			const artistData = args.artists[i];

			// Create artist
			const artistId = await ctx.db.insert("artists", {
				name: artistData.name,
				slug: artistData.slug,
				bio: artistData.bio,
				image: artistData.image,
				genre: artistData.genre,
				website: undefined,
				socialLinks: undefined,
				verified: true,
				createdAt: now,
			});
			artistIds.push(artistId);

		// Create 2-3 events per artist in different cities
		const numEvents = Math.floor(Math.random() * 2) + 2;
		for (let j = 0; j < numEvents; j++) {
			const cityIndex = (i + j) % cities.length;
			const city = cities[cityIndex];
			const venue = venues.find(v => v.city === city)!;
			const venueId = venueIds[city];
			const categoryId = categoryIds[artistData.category];

			// Create event dates 30-180 days in the future
			const daysInFuture = Math.floor(Math.random() * 150) + 30;
			const eventStart = now + daysInFuture * 24 * 60 * 60 * 1000;
			const eventEnd = eventStart + 3 * 60 * 60 * 1000;
			const doorTime = eventStart - 60 * 60 * 1000;
			const onSaleStart = now - 7 * 24 * 60 * 60 * 1000;

			const minPrice = Math.floor(Math.random() * 3000) + 2000;
			const maxPrice = minPrice + Math.floor(Math.random() * 5000) + 3000;

			const isFeatured = i < 5;
			const isPresale = Math.random() > 0.7;

			const eventId = await ctx.db.insert("events", {
				title: `${artistData.name} Live in ${city}`,
				slug: createSlug(`${artistData.name}-live-in-${city}-${j + 1}`),
				description: `Experience ${artistData.name} live at ${venue.name}! ${artistData.bio.substring(0, 200)}...`,
					categoryId: categoryId,
					venueId: venueId,
					artistId: artistId,
					images: [artistData.image],
					startTime: eventStart,
					endTime: eventEnd,
					doorTime: doorTime,
					onSaleStartTime: onSaleStart,
					onSaleEndTime: undefined,
					presaleStartTime: isPresale ? onSaleStart : undefined,
					presaleEndTime: isPresale ? onSaleStart + 3 * 24 * 60 * 60 * 1000 : undefined,
					presaleCode: isPresale ? "NEXUS2025" : undefined,
					status: "on_sale" as const,
					isFeatured: isFeatured,
					isPresale: isPresale,
					ageRestriction: artistData.category === "Comedy" ? "18+" : undefined,
					genre: artistData.genre,
					subGenre: undefined,
					promoter: "NexusPass Entertainment",
					minPrice: minPrice,
					maxPrice: maxPrice,
					currency: "PKR",
					tags: [artistData.category, artistData.genre, city],
					viewCount: Math.floor(Math.random() * 10000),
					createdAt: now,
					updatedAt: now,
				});

				totalEvents++;

				// Create ticket types
				const ticketTiers = [
					{
						name: "General Admission",
						tier: "general" as const,
						price: minPrice,
						quantity: 500,
					},
					{
						name: "VIP Package",
						tier: "vip" as const,
						price: Math.floor(minPrice * 2.5),
						quantity: 100,
					},
					{
						name: "Premium Seating",
						tier: "premium" as const,
						price: Math.floor(minPrice * 1.5),
						quantity: 200,
					},
				];

				for (const tier of ticketTiers) {
					await ctx.db.insert("ticketTypes", {
						eventId: eventId,
						name: tier.name,
						description: `${tier.name} access to the show`,
						price: tier.price,
						fees: Math.floor(tier.price * 0.15),
						currency: "PKR",
						totalQuantity: tier.quantity,
						availableQuantity: tier.quantity,
						minPerOrder: 1,
						maxPerOrder: 8,
						section: tier.tier === "general" ? "Standing" : `Section ${tier.tier.toUpperCase()}`,
						tier: tier.tier,
						benefits:
							tier.tier === "vip"
								? ["Meet & Greet", "Exclusive Merchandise", "Premium Bar Access"]
								: tier.tier === "premium"
									? ["Reserved Seating", "Express Entry"]
									: ["General Entry"],
						salesStartTime: onSaleStart,
						salesEndTime: eventStart - 24 * 60 * 60 * 1000,
						isActive: true,
					});
					totalTicketTypes++;
				}
			}
		}

		return {
			categories: categoryNames.length,
			venues: cities.length,
			artists: artistIds.length,
			events: totalEvents,
			ticketTypes: totalTicketTypes,
		};
	},
});

