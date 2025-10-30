import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    authId: v.string(),
    role: v.union(v.literal("customer"), v.literal("venue"), v.literal("staff")),
  })
    .index("by_email", ["email"])
    .index("by_authId", ["authId"]),

  venues: defineTable({
    userId: v.id("users"),
    name: v.string(),
    address: v.string(),
    city: v.string(),
    capacity: v.number(),
    createdAt: v.number(),
    approvedBy: v.union(v.id("users"), v.null()),
    isApproved: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_city", ["city"]),

  events: defineTable({
    venueId: v.id("venues"),
    title: v.string(),
    description: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    ticketPrice: v.number(),
    refundPolicy: v.union(v.literal("no_refund"), v.literal("refund_allowed")),
    isCancelled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_venueId", ["venueId"])
    .index("by_startTime", ["startTime"]),

  seats: defineTable({
    eventId: v.id("events"),
    seatNumber: v.string(),
    section: v.string(),
    isReserved: v.boolean(),
    reservedUntil: v.union(v.number(), v.null()),
    createdAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_eventId_and_section", ["eventId", "section"]),

  bookings: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    // Optionally, paymentId might be null if cash payment, etc
    paymentId: v.union(v.id("payments"), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_eventId", ["eventId"]),

  tickets: defineTable({
    bookingId: v.id("bookings"),
    seatId: v.id("seats"),
    qrCode: v.string(),
    issuedAt: v.number(),
    isValid: v.boolean(),
    checkedInAt: v.union(v.number(), v.null()),
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_seatId", ["seatId"]),

  payments: defineTable({
    bookingId: v.id("bookings"),
    method: v.union(
      v.literal("credit_card"),
      v.literal("debit_card"),
      v.literal("cash")
    ),
    transactionId: v.string(),
    amount: v.number(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("refunded")),
    processedAt: v.number(),
    refundedAt: v.union(v.number(), v.null()),
  })
    .index("by_bookingId", ["bookingId"])
    .index("by_transactionId", ["transactionId"]),

  supportTickets: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved")
    ),
    assignedTo: v.union(v.id("users"), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
});
