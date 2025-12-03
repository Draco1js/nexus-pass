import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireStaff } from "./utils";

/**
 * Get dashboard statistics for staff
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);

    // Get pending venues (unverified)
    const allVenues = await ctx.db.query("venues").collect();
    const pendingVenues = allVenues.filter((v) => !v.isVerified);

    // Get total events
    const totalEvents = await ctx.db.query("events").collect();

    // Get total users
    const totalUsers = await ctx.db.query("users").collect();

    return {
      pendingVenues: pendingVenues.length,
      totalEvents: totalEvents.length,
      totalUsers: totalUsers.length,
      pendingVenuesList: pendingVenues.slice(0, 5).map((v) => ({
        _id: v._id,
        name: v.name,
        city: v.city,
        state: v.state,
        capacity: v.capacity,
      })),
    };
  },
});

/**
 * Get all venues for staff review
 */
export const getVenues = query({
  args: {
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    let venues = await ctx.db.query("venues").collect();

    if (args.verified !== undefined) {
      venues = venues.filter((v) => v.isVerified === args.verified);
    }

    return venues.map((v) => ({
      _id: v._id,
      name: v.name,
      slug: v.slug,
      address: v.address,
      city: v.city,
      state: v.state,
      country: v.country,
      capacity: v.capacity,
      venueType: v.venueType,
      phone: v.phone,
      website: v.website,
      contactEmail: v.contactEmail,
      isVerified: v.isVerified,
      createdAt: v.createdAt,
    }));
  },
});

/**
 * Verify a venue
 */
export const verifyVenue = mutation({
  args: {
    venueId: v.id("venues"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    await ctx.db.patch(args.venueId, {
      isVerified: args.verified,
    });

    return { success: true };
  },
});

/**
 * Get all events for staff moderation
 */
export const getEvents = query({
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
    await requireStaff(ctx);

    let events = await ctx.db.query("events").collect();

    if (args.status) {
      events = events.filter((e) => e.status === args.status);
    }

    // Enrich with venue and artist data
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const venue = await ctx.db.get(event.venueId);
        const artist = event.artistId ? await ctx.db.get(event.artistId) : null;

        return {
          _id: event._id,
          title: event.title,
          slug: event.slug,
          status: event.status,
          startTime: event.startTime,
          isFeatured: event.isFeatured,
          createdAt: event.createdAt,
          venue: venue ? { name: venue.name, city: venue.city } : null,
          artist: artist ? { name: artist.name } : null,
        };
      })
    );

    return enrichedEvents.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Update event status (for moderation)
 */
export const updateEventStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("on_sale"),
      v.literal("off_sale"),
      v.literal("sold_out"),
      v.literal("cancelled"),
      v.literal("postponed"),
      v.literal("rescheduled")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "cancelled" && args.reason) {
      updates.cancellationReason = args.reason;
    }

    await ctx.db.patch(args.eventId, updates);

    return { success: true };
  },
});

/**
 * Toggle event featured status
 */
export const toggleEventFeatured = mutation({
  args: {
    eventId: v.id("events"),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    await ctx.db.patch(args.eventId, {
      isFeatured: args.featured,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});


/**
 * Get all users (for staff management)
 */
export const getUsers = query({
  args: {
    role: v.optional(
      v.union(
        v.literal("customer"),
        v.literal("artist"),
        v.literal("staff")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    let users;

    if (args.role) {
      users = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .collect();
    } else {
      users = await ctx.db.query("users").collect();
    }

    return users
      .filter((u) => !u.isDeleted)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        image: u.image,
      }));
  },
});

/**
 * Update user role
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("customer"),
      v.literal("artist"),
      v.literal("staff")
    ),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    return { success: true };
  },
});

/**
 * Create a new venue (staff only)
 */
export const createVenue = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    postalCode: v.optional(v.string()),
    capacity: v.number(),
    venueType: v.optional(
      v.union(v.literal("theatre"), v.literal("fan"), v.literal("stadium"))
    ),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    description: v.optional(v.string()),
    parkingInfo: v.optional(v.string()),
    accessibilityInfo: v.optional(v.string()),
    images: v.array(v.string()),
    coordinates: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    // Generate slug from name
    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const venueId = await ctx.db.insert("venues", {
      name: args.name,
      slug,
      address: args.address,
      city: args.city,
      state: args.state,
      country: args.country,
      postalCode: args.postalCode,
      capacity: args.capacity,
      venueType: args.venueType,
      phone: args.phone,
      website: args.website,
      contactEmail: args.contactEmail,
      description: args.description,
      parkingInfo: args.parkingInfo,
      accessibilityInfo: args.accessibilityInfo,
      images: args.images,
      coordinates: args.coordinates,
      isVerified: false, // New venues start unverified
      createdAt: Date.now(),
    });

    return { venueId };
  },
});

/**
 * Revoke a ticket with a reason
 */
export const revokeTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const staff = await requireStaff(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    await ctx.db.patch(args.ticketId, {
      status: "revoked",
      revocationReason: args.reason,
      revokedAt: Date.now(),
      revokedBy: staff._id,
    });

    return { success: true };
  },
});

/**
 * Get tickets for a specific user (staff view)
 */
export const getUserTicketsForStaff = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    // Get all orders for this user
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Get tickets for each order
    const allTickets = await Promise.all(
      orders.map(async (order) => {
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
          .collect();

        // Get event info
        const event = await ctx.db.get(order.eventId);
        const venue = event ? await ctx.db.get(event.venueId) : null;
        const ticketType = tickets[0] ? await ctx.db.get(tickets[0].ticketTypeId) : null;

        return tickets.map((ticket) => ({
          _id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          qrCode: ticket.qrCode,
          seatNumber: ticket.seatNumber,
          section: ticket.section,
          row: ticket.row,
          price: ticket.price,
          status: ticket.status,
          issuedAt: ticket.issuedAt,
          usedAt: ticket.usedAt,
          revocationReason: ticket.revocationReason,
          revokedAt: ticket.revokedAt,
          event: event
            ? {
                _id: event._id,
                title: event.title,
                slug: event.slug,
                startTime: event.startTime,
                images: event.images,
              }
            : null,
          venue: venue
            ? {
                name: venue.name,
                city: venue.city,
              }
            : null,
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            currency: order.currency,
          },
          ticketType: ticketType
            ? {
                name: ticketType.name,
                tier: ticketType.tier,
              }
            : null,
        }));
      })
    );

    return allTickets.flat().sort((a, b) => b.issuedAt - a.issuedAt);
  },
});

/**
 * Get all tickets for staff management
 */
export const getAllTickets = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("valid"),
        v.literal("used"),
        v.literal("cancelled"),
        v.literal("transferred"),
        v.literal("revoked")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    let tickets = await ctx.db.query("tickets").collect();

    if (args.status) {
      tickets = tickets.filter((t) => t.status === args.status);
    }

    // Enrich with order, event, and user data
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const order = await ctx.db.get(ticket.orderId);
        if (!order) return null;

        const event = await ctx.db.get(order.eventId);
        const user = await ctx.db.get(order.userId);
        const venue = event ? await ctx.db.get(event.venueId) : null;

        return {
          _id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          revocationReason: ticket.revocationReason,
          revokedAt: ticket.revokedAt,
          issuedAt: ticket.issuedAt,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
              }
            : null,
          event: event
            ? {
                _id: event._id,
                title: event.title,
                slug: event.slug,
                startTime: event.startTime,
              }
            : null,
          venue: venue
            ? {
                name: venue.name,
                city: venue.city,
              }
            : null,
        };
      })
    );

    return enrichedTickets
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => b.issuedAt - a.issuedAt);
  },
});

/**
 * Get all support tickets for staff
 */
export const getSupportTickets = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx);

    const tickets = await ctx.db.query("supportTickets").collect();

    // Enrich with user info
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const user = await ctx.db.get(ticket.userId);
        return {
          _id: ticket._id,
          subject: ticket.subject,
          message: ticket.message,
          category: ticket.category,
          status: ticket.status,
          priority: ticket.priority,
          userEmail: user?.email || "Unknown",
          userPhone: user?.phone || undefined,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        };
      })
    );

    return enrichedTickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Update support ticket status
 */
export const updateSupportTicketStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);

    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

