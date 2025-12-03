import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  requireAuth,
  requireArtist,
  requireArtistProfile,
  getArtistForUser,
  createSlug,
} from "./utils";

/**
 * Get artist dashboard data for the currently logged in artist
 */
export const getArtistDashboardData = query({
  args: {},
  handler: async (ctx) => {
    console.log("[getArtistDashboardData] Query called");
    console.log("[getArtistDashboardData] ctx.auth:", ctx.auth ? "exists" : "null");
    try {
      const user = await requireArtist(ctx);
      console.log("[getArtistDashboardData] User authenticated:", { _id: user._id, role: user.role });
      const artist = await getArtistForUser(ctx, user._id);
      console.log("[getArtistDashboardData] Artist found:", artist ? { _id: artist._id, name: artist.name } : null);

      if (!artist) {
        return { artist: null, stats: null, upcomingEvents: [], recentOrders: [] };
      }

      // Get all events for this artist
      const now = Date.now();
      const allEvents = await ctx.db
        .query("events")
        .withIndex("by_artistId", (q) => q.eq("artistId", artist._id))
        .collect();

      const upcomingEvents = allEvents
        .filter((e) => e.startTime > now)
        .sort((a, b) => a.startTime - b.startTime)
        .slice(0, 5);

      // Enrich upcoming events with venue info and sales data
      const enrichedUpcomingEvents = await Promise.all(
        upcomingEvents.map(async (event) => {
          const venue = await ctx.db.get(event.venueId);

          // Get orders for this event
          const orders = await ctx.db
            .query("orders")
            .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
            .collect();

          const confirmedOrders = orders.filter((o) => o.status === "confirmed");
          const ticketsSold = confirmedOrders.length;
          const revenue = confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

          return {
            _id: event._id,
            title: event.title,
            slug: event.slug,
            startTime: event.startTime,
            status: event.status,
            venue: venue ? { name: venue.name, city: venue.city } : null,
            ticketsSold,
            revenue,
          };
        })
      );

      // Calculate stats
      const allOrders = await Promise.all(
        allEvents.map(async (event) => {
          const orders = await ctx.db
            .query("orders")
            .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
            .collect();
          return orders;
        })
      );

      const flatOrders = allOrders.flat();
      const confirmedOrders = flatOrders.filter((o) => o.status === "confirmed");

      const stats = {
        totalEvents: allEvents.length,
        upcomingEvents: upcomingEvents.length,
        ticketsSold: confirmedOrders.length,
        totalRevenue: confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        avgAttendance: 85, // Placeholder - would calculate from actual attendance data
      };

      // Get recent orders across all artist events
      const recentOrders = confirmedOrders
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map((order) => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
        }));

      return {
        artist: {
          _id: artist._id,
          name: artist.name,
          slug: artist.slug,
          image: artist.image,
          genre: artist.genre,
        },
        stats,
        upcomingEvents: enrichedUpcomingEvents,
        recentOrders,
      };
    } catch (e) {
      console.error(e)
    }
  },
});

/**
 * Get all events for the current artist
 */
export const getArtistEvents = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("on_sale"),
        v.literal("off_sale"),
        v.literal("sold_out"),
        v.literal("cancelled"),
        v.literal("postponed"),
        v.literal("rescheduled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireArtist(ctx);
    const artist = await getArtistForUser(ctx, user._id);

    if (!artist) {
      return [];
    }

    let events = await ctx.db
      .query("events")
      .withIndex("by_artistId", (q) => q.eq("artistId", artist._id))
      .collect();

    if (args.status) {
      events = events.filter((e) => e.status === args.status);
    }

    // Enrich with venue data
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const venue = await ctx.db.get(event.venueId);
        const category = await ctx.db.get(event.categoryId);

        // Get ticket types
        const ticketTypes = await ctx.db
          .query("ticketTypes")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .collect();

        // Get orders count
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .collect();

        const confirmedOrders = orders.filter((o) => o.status === "confirmed");

        return {
          ...event,
          venue: venue ? { name: venue.name, city: venue.city, state: venue.state } : null,
          category: category ? { name: category.name } : null,
          ticketTypesCount: ticketTypes.length,
          ticketsSold: confirmedOrders.length,
          revenue: confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        };
      })
    );

    return enrichedEvents.sort((a, b) => b.startTime - a.startTime);
  },
});

/**
 * Get artist profile for editing
 */
export const getArtistProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireArtist(ctx);
    const artist = await getArtistForUser(ctx, user._id);

    if (!artist) {
      return null;
    }

    return artist;
  },
});

/**
 * Create a new artist profile
 */
export const createArtistProfile = mutation({
  args: {
    name: v.string(),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
    genre: v.optional(v.string()),
    website: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
        instagram: v.optional(v.string()),
        spotify: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireArtist(ctx);

    // Check if artist profile already exists
    const existingArtist = await getArtistForUser(ctx, user._id);
    if (existingArtist) {
      throw new Error("Artist profile already exists");
    }

    const slug = createSlug(args.name);
    const now = Date.now();

    const artistId = await ctx.db.insert("artists", {
      name: args.name,
      slug,
      bio: args.bio,
      image: args.image,
      genre: args.genre,
      website: args.website,
      socialLinks: args.socialLinks,
      verified: false, // New profiles start unverified
      userId: user._id,
      createdAt: now,
    });

    return { artistId };
  },
});

/**
 * Update artist profile
 */
export const updateArtistProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    image: v.optional(v.string()),
    genre: v.optional(v.string()),
    website: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
        instagram: v.optional(v.string()),
        spotify: v.optional(v.string()),
      })
    ),
    faqs: v.optional(
      v.array(
        v.object({
          question: v.string(),
          answer: v.string(),
        })
      )
    ),
    vipPackages: v.optional(
      v.array(
        v.object({
          name: v.string(),
          image: v.optional(v.string()),
          description: v.array(v.string()),
        })
      )
    ),
    news: v.optional(
      v.array(
        v.object({
          title: v.string(),
          image: v.optional(v.string()),
          excerpt: v.string(),
          link: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { artist } = await requireArtistProfile(ctx);

    const updates: Record<string, unknown> = {};

    if (args.name !== undefined) {
      updates.name = args.name;
      updates.slug = createSlug(args.name);
    }
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.image !== undefined) updates.image = args.image;
    if (args.genre !== undefined) updates.genre = args.genre;
    if (args.website !== undefined) updates.website = args.website;
    if (args.socialLinks !== undefined) updates.socialLinks = args.socialLinks;
    if (args.faqs !== undefined) updates.faqs = args.faqs;
    if (args.vipPackages !== undefined) updates.vipPackages = args.vipPackages;
    if (args.news !== undefined) updates.news = args.news;

    await ctx.db.patch(artist._id, updates);

    return { success: true };
  },
});

/**
 * Get single event details for editing (artist only)
 */
export const getEventForEdit = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const { artist } = await requireArtistProfile(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event || event.artistId !== artist._id) {
      return null;
    }

    const venue = await ctx.db.get(event.venueId);
    const category = await ctx.db.get(event.categoryId);

    // Get ticket types
    const ticketTypes = await ctx.db
      .query("ticketTypes")
      .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
      .collect();

    // Get artist info for banner fallback
    const artistInfo = artist ? await ctx.db.get(artist._id) : null;

    return {
      ...event,
      venue,
      category,
      ticketTypes: ticketTypes.map((tt) => ({
        _id: tt._id,
        name: tt.name,
        description: tt.description,
        price: tt.price,
        fees: tt.fees,
        totalQuantity: tt.totalQuantity,
        minPerOrder: tt.minPerOrder,
        maxPerOrder: tt.maxPerOrder,
        section: tt.section,
        tier: tt.tier,
        benefits: tt.benefits,
      })),
      artist: artistInfo ? {
        name: artistInfo.name,
        image: artistInfo.image,
      } : null,
    };
  },
});

/**
 * Get all categories for event creation
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get all venues for event creation
 */
export const getVenues = query({
  args: {},
  handler: async (ctx) => {
    const venues = await ctx.db.query("venues").collect();
    return venues.map((v) => ({
      _id: v._id,
      name: v.name,
      city: v.city,
      state: v.state,
      capacity: v.capacity,
    }));
  },
});

/**
 * Create a new event
 */
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    venueId: v.id("venues"),
    images: v.array(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    doorTime: v.optional(v.number()),
    onSaleStartTime: v.number(),
    onSaleEndTime: v.optional(v.number()),
    presaleStartTime: v.optional(v.number()),
    presaleEndTime: v.optional(v.number()),
    presaleCode: v.optional(v.string()),
    ageRestriction: v.optional(v.string()),
    genre: v.optional(v.string()),
    subGenre: v.optional(v.string()),
    refundPolicy: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { artist } = await requireArtistProfile(ctx);

    const now = Date.now();
    const slug = createSlug(args.title) + "-" + now.toString(36);

    const eventId = await ctx.db.insert("events", {
      title: args.title,
      slug,
      description: args.description,
      categoryId: args.categoryId,
      venueId: args.venueId,
      artistId: artist._id,
      images: args.images,
      startTime: args.startTime,
      endTime: args.endTime,
      doorTime: args.doorTime,
      onSaleStartTime: args.onSaleStartTime,
      onSaleEndTime: args.onSaleEndTime,
      presaleStartTime: args.presaleStartTime,
      presaleEndTime: args.presaleEndTime,
      presaleCode: args.presaleCode,
      status: "off_sale",
      isFeatured: false,
      isPresale: !!args.presaleStartTime,
      ageRestriction: args.ageRestriction,
      genre: args.genre,
      subGenre: args.subGenre,
      refundPolicy: args.refundPolicy,
      minPrice: 0,
      maxPrice: 0,
      currency: "PKR",
      tags: args.tags,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { eventId, slug };
  },
});

/**
 * Update an existing event
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    venueId: v.optional(v.id("venues")),
    images: v.optional(v.array(v.string())),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    doorTime: v.optional(v.number()),
    onSaleStartTime: v.optional(v.number()),
    onSaleEndTime: v.optional(v.number()),
    presaleStartTime: v.optional(v.number()),
    presaleEndTime: v.optional(v.number()),
    presaleCode: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("on_sale"),
        v.literal("off_sale"),
        v.literal("sold_out"),
        v.literal("cancelled"),
        v.literal("postponed"),
        v.literal("rescheduled")
      )
    ),
    ageRestriction: v.optional(v.string()),
    genre: v.optional(v.string()),
    subGenre: v.optional(v.string()),
    refundPolicy: v.optional(v.string()),
    cancellationReason: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { artist } = await requireArtistProfile(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event || event.artistId !== artist._id) {
      throw new Error("Event not found or not authorized");
    }

    const { eventId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (args.title) {
      filteredUpdates.slug = createSlug(args.title) + "-" + event.createdAt.toString(36);
    }

    filteredUpdates.updatedAt = Date.now();

    await ctx.db.patch(args.eventId, filteredUpdates);

    return { success: true };
  },
});

/**
 * Cancel an event
 */
export const cancelEvent = mutation({
  args: {
    eventId: v.id("events"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { artist } = await requireArtistProfile(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event || event.artistId !== artist._id) {
      throw new Error("Event not found or not authorized");
    }

    await ctx.db.patch(args.eventId, {
      status: "cancelled",
      cancellationReason: args.reason,
      updatedAt: Date.now(),
    });

    // TODO: Trigger refund process for all confirmed orders

    return { success: true };
  },
});

/**
 * Create a ticket type for an event
 */
export const createTicketType = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    fees: v.number(),
    currency: v.string(),
    totalQuantity: v.number(),
    minPerOrder: v.number(),
    maxPerOrder: v.number(),
    section: v.optional(v.string()),
    tier: v.union(
      v.literal("general"),
      v.literal("vip"),
      v.literal("premium"),
      v.literal("standing"),
      v.literal("seated")
    ),
    benefits: v.array(v.string()),
    salesStartTime: v.number(),
    salesEndTime: v.optional(v.number()),
    polarProductId: v.optional(v.string()),
    polarPriceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { artist } = await requireArtistProfile(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event || event.artistId !== artist._id) {
      throw new Error("Event not found or not authorized");
    }

    const ticketTypeId = await ctx.db.insert("ticketTypes", {
      eventId: args.eventId,
      name: args.name,
      description: args.description,
      price: args.price,
      fees: args.fees,
      currency: args.currency,
      totalQuantity: args.totalQuantity,
      availableQuantity: args.totalQuantity,
      minPerOrder: args.minPerOrder,
      maxPerOrder: args.maxPerOrder,
      section: args.section,
      tier: args.tier,
      benefits: args.benefits,
      salesStartTime: args.salesStartTime,
      salesEndTime: args.salesEndTime,
      isActive: true,
      polarProductId: args.polarProductId,
      polarPriceId: args.polarPriceId,
    });

    // Update event min/max prices
    const allTicketTypes = await ctx.db
      .query("ticketTypes")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    const prices = allTicketTypes.map((tt) => tt.price + tt.fees);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    await ctx.db.patch(args.eventId, {
      minPrice,
      maxPrice,
      updatedAt: Date.now(),
    });

    return { ticketTypeId };
  },
});

/**
 * Update a ticket type
 */
export const updateTicketType = mutation({
  args: {
    ticketTypeId: v.id("ticketTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    fees: v.optional(v.number()),
    totalQuantity: v.optional(v.number()),
    minPerOrder: v.optional(v.number()),
    maxPerOrder: v.optional(v.number()),
    section: v.optional(v.string()),
    tier: v.optional(
      v.union(
        v.literal("general"),
        v.literal("vip"),
        v.literal("premium"),
        v.literal("standing"),
        v.literal("seated")
      )
    ),
    benefits: v.optional(v.array(v.string())),
    salesStartTime: v.optional(v.number()),
    salesEndTime: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    polarProductId: v.optional(v.string()),
    polarPriceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { artist } = await requireArtistProfile(ctx);

    const ticketType = await ctx.db.get(args.ticketTypeId);
    if (!ticketType) {
      throw new Error("Ticket type not found");
    }

    const event = await ctx.db.get(ticketType.eventId);
    if (!event || event.artistId !== artist._id) {
      throw new Error("Not authorized");
    }

    const { ticketTypeId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    // Handle quantity changes
    if (args.totalQuantity !== undefined) {
      const soldQuantity = ticketType.totalQuantity - ticketType.availableQuantity;
      filteredUpdates.availableQuantity = Math.max(0, args.totalQuantity - soldQuantity);
    }

    await ctx.db.patch(args.ticketTypeId, filteredUpdates);

    // Update event min/max prices if price changed
    if (args.price !== undefined || args.fees !== undefined) {
      const allTicketTypes = await ctx.db
        .query("ticketTypes")
        .withIndex("by_eventId", (q) => q.eq("eventId", ticketType.eventId))
        .collect();

      const activeTickets = allTicketTypes.filter((tt) => tt.isActive);
      if (activeTickets.length > 0) {
        const prices = activeTickets.map((tt) => tt.price + tt.fees);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        await ctx.db.patch(ticketType.eventId, {
          minPrice,
          maxPrice,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

/**
 * Delete a ticket type
 */
export const deleteTicketType = mutation({
  args: {
    ticketTypeId: v.id("ticketTypes"),
  },
  handler: async (ctx, args) => {
    const { artist } = await requireArtistProfile(ctx);

    const ticketType = await ctx.db.get(args.ticketTypeId);
    if (!ticketType) {
      throw new Error("Ticket type not found");
    }

    const event = await ctx.db.get(ticketType.eventId);
    if (!event || event.artistId !== artist._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.ticketTypeId);

    return { success: true };
  },
});

/**
 * Get overall artist analytics
 */
export const getArtistAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireArtist(ctx);
    const artist = await getArtistForUser(ctx, user._id);

    if (!artist) {
      return null;
    }

    // Get all events for this artist
    const allEvents = await ctx.db
      .query("events")
      .withIndex("by_artistId", (q) => q.eq("artistId", artist._id))
      .collect();

    // Calculate analytics for each event
    const eventsWithAnalytics = await Promise.all(
      allEvents.map(async (event) => {
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .collect();

        const confirmedOrders = orders.filter((o) => o.status === "confirmed");
        const ticketsSold = confirmedOrders.length;
        const revenue = confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        const venue = await ctx.db.get(event.venueId);

        return {
          _id: event._id,
          title: event.title,
          slug: event.slug,
          startTime: event.startTime,
          venue: venue ? { name: venue.name, city: venue.city } : null,
          ticketsSold,
          revenue,
        };
      })
    );

    // Calculate totals
    const totalRevenue = eventsWithAnalytics.reduce((sum, e) => sum + e.revenue, 0);
    const totalTicketsSold = eventsWithAnalytics.reduce(
      (sum, e) => sum + e.ticketsSold,
      0
    );

    return {
      totalEvents: allEvents.length,
      totalRevenue,
      totalTicketsSold,
      averageAttendance: 85, // Placeholder
      events: eventsWithAnalytics.sort((a, b) => b.startTime - a.startTime),
    };
  },
});

/**
 * Get analytics for a specific event
 */
export const getEventAnalytics = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const { artist } = await requireArtistProfile(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event || event.artistId !== artist._id) {
      return null;
    }

    // Get all orders for this event
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    const confirmedOrders = orders.filter((o) => o.status === "confirmed");
    const pendingOrders = orders.filter((o) => o.status === "pending");
    const cancelledOrders = orders.filter((o) => o.status === "cancelled");
    const refundedOrders = orders.filter((o) => o.status === "refunded");

    // Get ticket types with sales data
    const ticketTypes = await ctx.db
      .query("ticketTypes")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    const ticketTypeSales = await Promise.all(
      ticketTypes.map(async (tt) => {
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_ticketTypeId", (q) => q.eq("ticketTypeId", tt._id))
          .collect();

        const validTickets = tickets.filter((t) => t.status === "valid" || t.status === "used");

        return {
          _id: tt._id,
          name: tt.name,
          tier: tt.tier,
          price: tt.price,
          fees: tt.fees,
          totalQuantity: tt.totalQuantity,
          availableQuantity: tt.availableQuantity,
          soldQuantity: validTickets.length,
          revenue: validTickets.reduce((sum, t) => sum + t.price, 0),
        };
      })
    );

    // Sales by day (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentOrders = confirmedOrders.filter((o) => o.createdAt >= thirtyDaysAgo);

    const salesByDay: Record<string, { orders: number; revenue: number }> = {};
    recentOrders.forEach((order) => {
      const day = new Date(order.createdAt).toISOString().split("T")[0];
      if (!salesByDay[day]) {
        salesByDay[day] = { orders: 0, revenue: 0 };
      }
      salesByDay[day].orders++;
      salesByDay[day].revenue += order.totalAmount;
    });

    return {
      event: {
        _id: event._id,
        title: event.title,
        startTime: event.startTime,
        status: event.status,
      },
      summary: {
        totalOrders: orders.length,
        confirmedOrders: confirmedOrders.length,
        pendingOrders: pendingOrders.length,
        cancelledOrders: cancelledOrders.length,
        refundedOrders: refundedOrders.length,
        totalRevenue: confirmedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        totalFees: confirmedOrders.reduce((sum, o) => sum + o.fees, 0),
      },
      ticketTypeSales,
      salesByDay: Object.entries(salesByDay).map(([date, data]) => ({
        date,
        ...data,
      })),
    };
  },
});

