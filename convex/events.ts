import { query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

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

/**
 * Get artist by slug with all their upcoming events
 */
export const getArtistBySlug = query({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const artist = await ctx.db
			.query("artists")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();

		if (!artist) {
			return null;
		}

		// Get all upcoming events for this artist
		const now = Date.now();
		const events = await ctx.db
			.query("events")
			.withIndex("by_startTime", (q) => q.gte("startTime", now))
			.collect();

		const artistEvents = events.filter((e) => e.artistId === artist._id);

		// Enrich events with venue and category info
		const enrichedEvents = await Promise.all(
			artistEvents.map(async (event) => {
				const venue = await ctx.db.get(event.venueId);
				const category = await ctx.db.get(event.categoryId);

				if (!venue) return null;

				return {
					_id: event._id,
					title: event.title,
					slug: event.slug,
					startTime: event.startTime,
					endTime: event.endTime,
					doorTime: event.doorTime,
					minPrice: event.minPrice,
					maxPrice: event.maxPrice,
					currency: event.currency,
					status: event.status,
					isPresale: event.isPresale,
					venue: {
						_id: venue._id,
						name: venue.name,
						city: venue.city,
						state: venue.state,
						address: venue.address,
						country: venue.country,
					},
					category: category
						? {
								_id: category._id,
								name: category.name,
						  }
						: null,
				};
			}),
		);

		const validEvents = enrichedEvents.filter(
			(e): e is NonNullable<typeof e> => e !== null,
		);

		// Sort events by start time
		validEvents.sort((a, b) => a.startTime - b.startTime);

		// Get category for breadcrumb
		const category = validEvents[0]?.category;

		return {
			_id: artist._id,
			name: artist.name,
			slug: artist.slug,
			bio: artist.bio,
			image: artist.image,
			genre: artist.genre,
			website: artist.website,
			socialLinks: artist.socialLinks,
			vipPackages: artist.vipPackages,
			faqs: artist.faqs,
			news: artist.news,
			category: category?.name || "Concerts",
			events: validEvents,
		};
	},
});

/**
 * Get event by slug with full details including ticket types
 */
export const getEventBySlug = query({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		const event = await ctx.db
			.query("events")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();

		if (!event) {
			return null;
		}

		// Get venue, artist, and category
		const venue = await ctx.db.get(event.venueId);
		const artist = event.artistId ? await ctx.db.get(event.artistId) : null;
		const category = await ctx.db.get(event.categoryId);

		// Get ticket types for this event
		const ticketTypes = await ctx.db
			.query("ticketTypes")
			.withIndex("by_eventId", (q) => q.eq("eventId", event._id))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();

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
			isPresale: event.isPresale,
			presaleStartTime: event.presaleStartTime,
			presaleEndTime: event.presaleEndTime,
			presaleCode: event.presaleCode,
			ageRestriction: event.ageRestriction,
			genre: event.genre,
			venue: venue
				? {
						_id: venue._id,
						name: venue.name,
						city: venue.city,
						state: venue.state,
						address: venue.address,
						country: venue.country,
						capacity: venue.capacity,
						venueType: venue.venueType || "theatre",
				  }
				: null,
			artist: artist
				? {
						_id: artist._id,
						name: artist.name,
						slug: artist.slug,
						image: artist.image,
				  }
				: null,
			category: category
				? {
						_id: category._id,
						name: category.name,
						slug: category.slug,
				  }
				: null,
			ticketTypes: ticketTypes.map((tt) => ({
				_id: tt._id,
				name: tt.name,
				description: tt.description,
				price: tt.price,
				fees: tt.fees,
				currency: tt.currency,
				availableQuantity: tt.availableQuantity,
				minPerOrder: tt.minPerOrder,
				maxPerOrder: tt.maxPerOrder,
				section: tt.section,
				tier: tt.tier,
				benefits: tt.benefits,
			})),
		};
	},
});

/**
 * Get related artists (for Fans Also Viewed section)
 */
export const getRelatedArtists = query({
	args: {
		excludeId: v.id("artists"),
		limit: v.number(),
	},
	handler: async (ctx, args) => {
		const allArtists = await ctx.db.query("artists").collect();
		const filtered = allArtists.filter((a) => a._id !== args.excludeId);

		// Shuffle and take limit
		const shuffled = filtered.sort(() => Math.random() - 0.5);
		return shuffled.slice(0, args.limit).map((artist) => ({
			_id: artist._id,
			name: artist.name,
			slug: artist.slug,
			image: artist.image,
		}));
	},
});

/**
 * Get ticket type by ID
 */
export const getTicketType = query({
	args: {
		id: v.id("ticketTypes"),
	},
	handler: async (ctx, args) => {
		const ticketType = await ctx.db.get(args.id);
		if (!ticketType) {
			return null;
		}
		
		// Get event to include eventId
		const event = await ctx.db.get(ticketType.eventId);
		
		return {
			_id: ticketType._id,
			name: ticketType.name,
			description: ticketType.description,
			price: ticketType.price,
			fees: ticketType.fees,
			currency: ticketType.currency,
			availableQuantity: ticketType.availableQuantity,
			section: ticketType.section,
			tier: ticketType.tier,
			eventId: ticketType.eventId,
			eventSlug: event?.slug || null,
		};
	},
});

/**
 * Get reviews for an artist
 */
export const getArtistReviews = query({
	args: {
		artistId: v.id("artists"),
	},
	handler: async (ctx, args) => {
		const reviews = await ctx.db
			.query("reviews")
			.withIndex("by_artistId", (q) => q.eq("artistId", args.artistId))
			.order("desc")
			.take(100);

		// Enrich with user names and check if current user can delete
		// Try to get auth user, but don't fail if not authenticated
		let currentUserId: string | null = null;
		try {
			const authUser = await authComponent.getAuthUser(ctx);
			if (authUser) {
				const authId = (authUser as any).id || (authUser as any).userId;
				if (authId) {
					const currentUser = await ctx.db
						.query("users")
						.withIndex("by_authId", (q) => q.eq("authId", authId))
						.first();
					currentUserId = currentUser?._id || null;
				}
			}
		} catch (error) {
			// User is not authenticated, which is fine for viewing reviews
			currentUserId = null;
		}

		const enrichedReviews = await Promise.all(
			reviews.map(async (review) => {
				const user = await ctx.db.get(review.userId);
				return {
					_id: review._id,
					rating: review.rating,
					title: review.title,
					comment: review.comment,
					venueName: review.venueName,
					userName: user?.name || "Anonymous",
					userId: review.userId,
					canDelete: currentUserId === review.userId,
					createdAt: review.createdAt,
				};
			}),
		);

		// Calculate average rating
		const totalRating = enrichedReviews.reduce((sum, r) => sum + r.rating, 0);
		const averageRating = enrichedReviews.length > 0 ? totalRating / enrichedReviews.length : 0;

		return {
			reviews: enrichedReviews,
			averageRating,
			totalReviews: enrichedReviews.length,
		};
	},
});
