import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Search events with filters
 */
export const searchEvents = query({
  args: {
    query: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    city: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    genre: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const now = Date.now();

    // Get all upcoming events
    let events = await ctx.db
      .query("events")
      .withIndex("by_startTime", (q) => q.gte("startTime", now))
      .order("asc")
      .take(200);

    // Apply text search filter
    if (args.query) {
      const searchLower = args.query.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(searchLower) ||
          e.description.toLowerCase().includes(searchLower) ||
          e.genre?.toLowerCase().includes(searchLower) ||
          e.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (args.categoryId) {
      events = events.filter((e) => e.categoryId === args.categoryId);
    }

    // Apply date range filter
    if (args.dateFrom) {
      events = events.filter((e) => e.startTime >= args.dateFrom!);
    }
    if (args.dateTo) {
      events = events.filter((e) => e.startTime <= args.dateTo!);
    }

    // Apply price range filter
    if (args.minPrice !== undefined) {
      events = events.filter((e) => e.minPrice >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      events = events.filter((e) => e.maxPrice <= args.maxPrice!);
    }

    // Apply genre filter
    if (args.genre) {
      const genreLower = args.genre.toLowerCase();
      events = events.filter((e) => e.genre?.toLowerCase().includes(genreLower));
    }

    // Enrich with venue and artist data, filter by city
    const enrichedEvents = await Promise.all(
      events.slice(0, limit * 2).map(async (event) => {
        const venue = await ctx.db.get(event.venueId);
        if (!venue) return null;

        // Apply city filter
        if (args.city && venue.city.toLowerCase() !== args.city.toLowerCase()) {
          return null;
        }

        const artist = event.artistId ? await ctx.db.get(event.artistId) : null;
        const category = await ctx.db.get(event.categoryId);

        return {
          _id: event._id,
          title: event.title,
          slug: event.slug,
          description: event.description,
          images: event.images,
          startTime: event.startTime,
          minPrice: event.minPrice,
          maxPrice: event.maxPrice,
          currency: event.currency,
          status: event.status,
          genre: event.genre,
          venue: {
            _id: venue._id,
            name: venue.name,
            city: venue.city,
            state: venue.state,
          },
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
        };
      })
    );

    // Remove nulls and limit results
    return enrichedEvents
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .slice(0, limit);
  },
});

/**
 * Get search filters (categories, cities, genres)
 */
export const getSearchFilters = query({
  args: {},
  handler: async (ctx) => {
    // Get all categories
    const categories = await ctx.db.query("categories").collect();

    // Get all venues to extract unique cities
    const venues = await ctx.db.query("venues").collect();
    const cities = [...new Set(venues.map((v) => v.city))].sort();

    // Get all events to extract unique genres
    const events = await ctx.db.query("events").collect();
    const genres = [
      ...new Set(events.filter((e) => e.genre).map((e) => e.genre!)),
    ].sort();

    return {
      categories: categories.map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
      })),
      cities,
      genres,
    };
  },
});

/**
 * Get autocomplete suggestions
 */
export const getAutocompleteSuggestions = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.query.length < 2) {
      return { events: [], artists: [], venues: [] };
    }

    const searchLower = args.query.toLowerCase();

    // Search events
    const allEvents = await ctx.db.query("events").take(100);
    const matchingEvents = allEvents
      .filter((e) => e.title.toLowerCase().includes(searchLower))
      .slice(0, 5)
      .map((e) => ({
        _id: e._id,
        title: e.title,
        slug: e.slug,
        type: "event" as const,
      }));

    // Search artists
    const allArtists = await ctx.db.query("artists").take(100);
    const matchingArtists = allArtists
      .filter((a) => a.name.toLowerCase().includes(searchLower))
      .slice(0, 5)
      .map((a) => ({
        _id: a._id,
        name: a.name,
        slug: a.slug,
        type: "artist" as const,
      }));

    // Search venues
    const allVenues = await ctx.db.query("venues").take(100);
    const matchingVenues = allVenues
      .filter((v) => v.name.toLowerCase().includes(searchLower))
      .slice(0, 5)
      .map((v) => ({
        _id: v._id,
        name: v.name,
        slug: v.slug,
        city: v.city,
        type: "venue" as const,
      }));

    return {
      events: matchingEvents,
      artists: matchingArtists,
      venues: matchingVenues,
    };
  },
});

