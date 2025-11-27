import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    authId: v.string(),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("admin")),
    emailVerified: v.boolean(),
    isDeleted: v.optional(v.boolean())
  })
    .index("by_email", ["email"])
    .index("by_authId", ["authId"]),

  // Categories for events (Concerts, Sports, Arts & Theater, Family, etc.)
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"]),

  // Artists/Performers
  artists: defineTable({
    name: v.string(),
    slug: v.string(),
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
    verified: v.boolean(),
    // Artist-controlled content
    vipPackages: v.optional(
      v.array(
        v.object({
          name: v.string(),
          image: v.optional(v.string()),
          description: v.array(v.string()),
        })
      )
    ),
    faqs: v.optional(
      v.array(
        v.object({
          question: v.string(),
          answer: v.string(),
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
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_genre", ["genre"]),

  // Venues
  venues: defineTable({
    name: v.string(),
    slug: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    postalCode: v.optional(v.string()),
    capacity: v.number(),
    venueType: v.optional(v.union(v.literal("theatre"), v.literal("fan"), v.literal("stadium"))),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    images: v.array(v.string()),
    parkingInfo: v.optional(v.string()),
    accessibilityInfo: v.optional(v.string()),
    description: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_city", ["city"])
    .index("by_city_and_state", ["city", "state"]),

  // Events
  events: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    venueId: v.id("venues"),
    artistId: v.optional(v.id("artists")),
    images: v.array(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    doorTime: v.optional(v.number()),
    
    // Ticket sales info
    onSaleStartTime: v.number(),
    onSaleEndTime: v.optional(v.number()),
    presaleStartTime: v.optional(v.number()),
    presaleEndTime: v.optional(v.number()),
    presaleCode: v.optional(v.string()),
    
    // Status
    status: v.union(
      v.literal("on_sale"),
      v.literal("off_sale"),
      v.literal("sold_out"),
      v.literal("cancelled"),
      v.literal("postponed"),
      v.literal("rescheduled")
    ),
    isFeatured: v.boolean(),
    isPresale: v.boolean(),
    
    // Additional info
    ageRestriction: v.optional(v.string()),
    genre: v.optional(v.string()),
    subGenre: v.optional(v.string()),
    promoter: v.optional(v.string()),
    
    // Pricing
    minPrice: v.number(),
    maxPrice: v.number(),
    currency: v.string(),
    
    // Metadata
    tags: v.array(v.string()),
    viewCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_venueId", ["venueId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_artistId", ["artistId"])
    .index("by_startTime", ["startTime"])
    .index("by_status", ["status"])
    .index("by_isFeatured", ["isFeatured"])
    .index("by_categoryId_and_startTime", ["categoryId", "startTime"])
    .index("by_venueId_and_startTime", ["venueId", "startTime"]),

  // Ticket types/tiers for an event
  ticketTypes: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    fees: v.number(),
    currency: v.string(),
    totalQuantity: v.number(),
    availableQuantity: v.number(),
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
    isActive: v.boolean(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_eventId_and_isActive", ["eventId", "isActive"]),

  // Orders (renamed from bookings)
  orders: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    orderNumber: v.string(),
    totalAmount: v.number(),
    subtotal: v.number(),
    fees: v.number(),
    tax: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentMethod: v.optional(v.string()),
    confirmationEmail: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_eventId", ["eventId"])
    .index("by_orderNumber", ["orderNumber"])
    .index("by_status", ["status"]),

  // Tickets in an order
  tickets: defineTable({
    orderId: v.id("orders"),
    ticketTypeId: v.id("ticketTypes"),
    ticketNumber: v.string(),
    qrCode: v.string(),
    holderName: v.optional(v.string()),
    holderEmail: v.optional(v.string()),
    seatNumber: v.optional(v.string()),
    section: v.optional(v.string()),
    row: v.optional(v.string()),
    price: v.number(),
    status: v.union(
      v.literal("valid"),
      v.literal("used"),
      v.literal("cancelled"),
      v.literal("transferred")
    ),
    issuedAt: v.number(),
    usedAt: v.optional(v.number()),
    transferredTo: v.optional(v.id("users")),
  })
    .index("by_orderId", ["orderId"])
    .index("by_ticketTypeId", ["ticketTypeId"])
    .index("by_ticketNumber", ["ticketNumber"])
    .index("by_qrCode", ["qrCode"]),

  // User favorites/watchlist
  favorites: defineTable({
    userId: v.id("users"),
    eventId: v.optional(v.id("events")),
    artistId: v.optional(v.id("artists")),
    venueId: v.optional(v.id("venues")),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_eventId", ["userId", "eventId"])
    .index("by_userId_and_artistId", ["userId", "artistId"])
    .index("by_userId_and_venueId", ["userId", "venueId"]),

  // Reviews/Ratings
  reviews: defineTable({
    userId: v.id("users"),
    artistId: v.id("artists"),
    eventId: v.optional(v.id("events")),
    venueName: v.optional(v.string()),
    rating: v.number(),
    title: v.optional(v.string()),
    comment: v.string(),
    isVerifiedPurchase: v.boolean(),
    helpful: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_artistId", ["artistId"])
    .index("by_eventId", ["eventId"]),

  // Support tickets
  supportTickets: defineTable({
    userId: v.id("users"),
    orderId: v.optional(v.id("orders")),
    subject: v.string(),
    message: v.string(),
    category: v.union(
      v.literal("order"),
      v.literal("technical"),
      v.literal("refund"),
      v.literal("transfer"),
      v.literal("other")
    ),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_orderId", ["orderId"])
    .index("by_status", ["status"]),
});
