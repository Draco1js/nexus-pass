import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireAuth, getCurrentUser } from "./utils";

/**
 * Get user's support tickets
 */
export const getUserTickets = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return tickets
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((t) => ({
        _id: t._id,
        subject: t.subject,
        category: t.category,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
  },
});

/**
 * Get single ticket with messages (user view)
 */
export const getTicket = query({
  args: {
    ticketId: v.id("supportTickets"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || ticket.userId !== user._id) {
      return null;
    }

    // Get messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    // Enrich messages with sender info
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          _id: msg._id,
          content: msg.content,
          isStaffMessage: msg.isStaffMessage,
          senderName: msg.isStaffMessage ? "Support Team" : sender?.name || "You",
          createdAt: msg.createdAt,
        };
      })
    );

    return {
      ...ticket,
      messages: enrichedMessages.sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});

/**
 * Create a new support ticket
 */
export const createTicket = mutation({
  args: {
    subject: v.string(),
    message: v.string(),
    category: v.union(
      v.literal("order"),
      v.literal("technical"),
      v.literal("refund"),
      v.literal("transfer"),
      v.literal("other")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const now = Date.now();

    const ticketId = await ctx.db.insert("supportTickets", {
      userId: user._id,
      orderId: args.orderId,
      subject: args.subject,
      message: args.message,
      category: args.category,
      status: "open",
      priority: args.priority,
      createdAt: now,
      updatedAt: now,
    });

    return { ticketId };
  },
});

/**
 * Send a message on a ticket (user)
 */
export const sendMessage = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || ticket.userId !== user._id) {
      throw new Error("Ticket not found");
    }

    await ctx.db.insert("messages", {
      ticketId: args.ticketId,
      senderId: user._id,
      content: args.content,
      isStaffMessage: false,
      createdAt: Date.now(),
    });

    // Reopen ticket if it was resolved/closed
    if (ticket.status === "resolved" || ticket.status === "closed") {
      await ctx.db.patch(args.ticketId, {
        status: "open",
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

