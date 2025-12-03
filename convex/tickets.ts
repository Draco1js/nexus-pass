import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./utils";

/**
 * Get all tickets for the current user
 */
export const getUserTickets = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Get all orders for this user
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
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

        return tickets.map((ticket) => ({
          _id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          qrCode: ticket.qrCode,
          seatNumber: ticket.seatNumber,
          section: ticket.section,
          row: ticket.row,
          status: ticket.status,
          issuedAt: ticket.issuedAt,
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
                address: venue.address,
                city: venue.city,
                state: venue.state,
              }
            : null,
          order: {
            orderNumber: order.orderNumber,
            status: order.status,
          },
        }));
      })
    );

    // Flatten and sort by event date
    return allTickets
      .flat()
      .filter((t) => t.event)
      .sort((a, b) => (a.event?.startTime || 0) - (b.event?.startTime || 0));
  },
});

/**
 * Get a single ticket by ID
 */
export const getTicket = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;

    // Get order to verify ownership
    const order = await ctx.db.get(ticket.orderId);
    if (!order || order.userId !== user._id) {
      return null;
    }

    // Get ticket type info
    const ticketType = await ctx.db.get(ticket.ticketTypeId);

    // Get event info
    const event = await ctx.db.get(order.eventId);
    if (!event) return null;

    const venue = await ctx.db.get(event.venueId);
    const artist = event.artistId ? await ctx.db.get(event.artistId) : null;

    return {
      _id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.qrCode,
      holderName: ticket.holderName,
      holderEmail: ticket.holderEmail,
      seatNumber: ticket.seatNumber,
      section: ticket.section,
      row: ticket.row,
      price: ticket.price,
      status: ticket.status,
      issuedAt: ticket.issuedAt,
      usedAt: ticket.usedAt,
      revocationReason: ticket.revocationReason,
      revokedAt: ticket.revokedAt,
      ticketType: ticketType
        ? {
            name: ticketType.name,
            tier: ticketType.tier,
            benefits: ticketType.benefits,
          }
        : null,
      event: {
        _id: event._id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        doorTime: event.doorTime,
        images: event.images,
        ageRestriction: event.ageRestriction,
      },
      venue: venue
        ? {
            _id: venue._id,
            name: venue.name,
            address: venue.address,
            city: venue.city,
            state: venue.state,
            country: venue.country,
            coordinates: venue.coordinates,
          }
        : null,
      artist: artist
        ? {
            name: artist.name,
            slug: artist.slug,
            image: artist.image,
          }
        : null,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    };
  },
});

/**
 * Get tickets by order ID
 */
export const getTicketsByOrderId = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();
    
    return tickets;
  },
});

/**
 * Get ticket by QR code (for validation)
 */
export const getTicketByQR = query({
  args: {
    qrCode: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode))
      .first();

    if (!ticket) return null;

    const ticketType = await ctx.db.get(ticket.ticketTypeId);
    const order = await ctx.db.get(ticket.orderId);
    if (!order) return null;

    const event = await ctx.db.get(order.eventId);
    const venue = event ? await ctx.db.get(event.venueId) : null;

    return {
      _id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      section: ticket.section,
      row: ticket.row,
      seatNumber: ticket.seatNumber,
      ticketType: ticketType?.name,
      event: event
        ? {
            title: event.title,
            startTime: event.startTime,
          }
        : null,
      venue: venue?.name,
    };
  },
});

