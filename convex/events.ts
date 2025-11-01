import { query } from "./_generated/server";
import { v } from "convex/values";

export const getCities = query({
	args: {},
	returns: v.array(v.string()),
	handler: () => {
		return ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Multan", "Peshawar", "Sialkot", "Quetta"];
	},
});

/**
 * Query function to retrieve curated groups of upcoming events for the homepage.
 * - Optionally filters events by `city`.
 * - Fetches up to 50 upcoming events ordered by soonest start time.
 * - Enriches each event with venue and artist information.
 * - Returns:
 *    - hero:          First featured event (or null).
 *    - featured:      Up to 4 featured events.
 *    - presales:      Up to 6 presale events.
 *    - editorsPicks:  Up to 6 curated events.
 *    - cityGroups:    Up to 5 cities, each with up to 4 events.
 */
export const homepageHighlights = query({
	args: {
		city: v.union(v.string(), v.null()),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const limit = 50;

		// Fetch upcoming events that are on sale
		const upcoming = await ctx.db
			.query("events")
			.withIndex("by_startTime", (q) => q.gte("startTime", now))
			.order("asc")
			.take(limit);

		// Enrich events with their venues and artists
		const enriched = await Promise.all(
			upcoming.map(async (event) => {
				const venue = await ctx.db.get(event.venueId);
				if (!venue) {
					return null;
				}

				// Filter by city if provided
				if (args.city && venue.city.toLowerCase() !== args.city.toLowerCase()) {
					return null;
				}

				// Get artist info if available
				let artist = null;
				if (event.artistId) {
					artist = await ctx.db.get(event.artistId);
				}

				// Get category info
				const category = await ctx.db.get(event.categoryId);

				return {
					_id: event._id,
					title: event.title,
					slug: event.slug,
					description: event.description,
					images: event.images,
					startTime: event.startTime,
					endTime: event.endTime,
					doorTime: event.doorTime,
					minPrice: event.minPrice,
					maxPrice: event.maxPrice,
					currency: event.currency,
					status: event.status,
					isFeatured: event.isFeatured,
					isPresale: event.isPresale,
					presaleStartTime: event.presaleStartTime,
					presaleEndTime: event.presaleEndTime,
					ageRestriction: event.ageRestriction,
					genre: event.genre,
					venue: {
						_id: venue._id,
						name: venue.name,
						slug: venue.slug,
						city: venue.city,
						state: venue.state,
						address: venue.address,
					},
					artist: artist
						? {
								_id: artist._id,
								name: artist.name,
								slug: artist.slug,
								image: artist.image,
								genre: artist.genre,
						  }
						: null,
					category: category
						? {
								_id: category._id,
								name: category.name,
								slug: category.slug,
						  }
						: null,
				} as const;
			}),
		);

		// Remove nulls (filtered events or missing venues)
		const events = enriched.filter(
			(event): event is NonNullable<typeof event> => event !== null,
		);

		if (events.length === 0) {
			return {
				hero: null,
				featured: [],
				presales: [],
				cityGroups: [],
				editorsPicks: [],
			} as const;
		}

		// Get featured events for hero and featured section
		const featuredEvents = events.filter((e) => e.isFeatured);
		const presaleEvents = events.filter((e) => e.isPresale);

		// Hero: First featured event or first event
		const hero = featuredEvents[0] ?? events[0] ?? null;

		// Featured: Next 4 featured events (or regular events if not enough featured)
		const featured = featuredEvents.slice(1, 5);
		if (featured.length < 4) {
			const nonFeatured = events.filter((e) => !e.isFeatured).slice(0, 4 - featured.length);
			featured.push(...nonFeatured);
		}

		// Presales: Up to 6 presale events
		const presales = presaleEvents.slice(0, 6);

		// Editor's Picks: Mix of events (skip hero and featured)
		const usedIds = new Set([
			hero?._id,
			...featured.map((e) => e._id),
			...presales.map((e) => e._id),
		]);
		const editorsPicks = events.filter((e) => !usedIds.has(e._id)).slice(0, 6);

		// Build city-to-events map for up to 5 city groups, each with up to 4 events
		const cityMap = new Map<string, Array<(typeof events)[number]>>();
		for (const event of events) {
			const cityKey = event.venue.city;
			if (!cityMap.has(cityKey)) {
				cityMap.set(cityKey, []);
			}
			const cityEvents = cityMap.get(cityKey);
			if (cityEvents && cityEvents.length < 4) {
				cityEvents.push(event);
			}
		}

		// Take up to 5 city groups for display
		const cityGroups = Array.from(cityMap.entries())
			.slice(0, 5)
			.map(([city, cityEvents]) => ({
				city,
				events: cityEvents,
			}));

		return {
			hero,
			featured,
			presales,
			cityGroups,
			editorsPicks,
		} as const;
	},
});
