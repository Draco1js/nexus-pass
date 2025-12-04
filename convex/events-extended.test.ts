import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "../lib/test.setup";
import { setupConvexTest } from "../lib/test-helpers";

describe("events extended queries", () => {
  it("homepageHighlights filters by city correctly", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    await t.run(async (ctx) => {
      const categoryId = await ctx.db.insert("categories", {
        name: "Concerts",
        slug: "concerts",
        sortOrder: 1,
      });

      const venueKarachi = await ctx.db.insert("venues", {
        name: "Karachi Venue",
        slug: "karachi-venue",
        address: "123 Main St",
        city: "Karachi",
        country: "Pakistan",
        capacity: 1000,
        images: [],
        createdAt: Date.now(),
      });

      const venueLahore = await ctx.db.insert("venues", {
        name: "Lahore Venue",
        slug: "lahore-venue",
        address: "456 Park Ave",
        city: "Lahore",
        country: "Pakistan",
        capacity: 2000,
        images: [],
        createdAt: Date.now(),
      });

      const now = Date.now();
      const tomorrow = now + 86400000;

      await ctx.db.insert("events", {
        title: "Karachi Event",
        slug: "karachi-event",
        description: "Event in Karachi",
        categoryId,
        venueId: venueKarachi,
        images: [],
        startTime: tomorrow,
        onSaleStartTime: now,
        status: "on_sale",
        isFeatured: true,
        isPresale: false,
        minPrice: 1000,
        maxPrice: 2000,
        currency: "PKR",
        tags: [],
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("events", {
        title: "Lahore Event",
        slug: "lahore-event",
        description: "Event in Lahore",
        categoryId,
        venueId: venueLahore,
        images: [],
        startTime: tomorrow,
        onSaleStartTime: now,
        status: "on_sale",
        isFeatured: true,
        isPresale: false,
        minPrice: 1000,
        maxPrice: 2000,
        currency: "PKR",
        tags: [],
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    });

    const highlights = await t.query(api.events.homepageHighlights, {
      city: "Karachi",
    });

    expect(highlights.hero).toBeTruthy();
    expect(highlights.hero?.venue.city).toBe("Karachi");
  });

  it("getAvailableTicketsBySlug returns tickets for event by slug", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const { eventSlug } = await t.run(async (ctx) => {
      const categoryId = await ctx.db.insert("categories", {
        name: "Concerts",
        slug: "concerts",
        sortOrder: 1,
      });

      const venueId = await ctx.db.insert("venues", {
        name: "Test Venue",
        slug: "test-venue",
        address: "123 Main St",
        city: "Karachi",
        country: "Pakistan",
        capacity: 1000,
        images: [],
        createdAt: Date.now(),
      });

      const eventId = await ctx.db.insert("events", {
        title: "Test Event",
        slug: "test-event-slug",
        description: "A test event",
        categoryId,
        venueId,
        images: [],
        startTime: Date.now() + 86400000,
        onSaleStartTime: Date.now(),
        status: "on_sale",
        isFeatured: false,
        isPresale: false,
        minPrice: 1000,
        maxPrice: 2000,
        currency: "PKR",
        tags: [],
        viewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("ticketTypes", {
        eventId,
        name: "General Admission",
        price: 1000,
        fees: 100,
        currency: "PKR",
        totalQuantity: 5,
        availableQuantity: 5,
        minPerOrder: 1,
        maxPerOrder: 5,
        tier: "general",
        benefits: [],
        salesStartTime: Date.now(),
        isActive: true,
      });

      return { eventSlug: "test-event-slug" };
    });

    const tickets = await t.query(api.events.getAvailableTicketsBySlug, {
      slug: eventSlug,
    });

    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0]).toHaveProperty("id");
    expect(tickets[0]).toHaveProperty("price");
  });

  it("getAvailableTicketsBySlug returns empty array for non-existent event", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const tickets = await t.query(api.events.getAvailableTicketsBySlug, {
      slug: "non-existent-slug",
    });

    expect(tickets).toEqual([]);
  });

  it("getTicketType returns ticket type with event info", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const { ticketTypeId } = await t.run(async (ctx) => {
      const categoryId = await ctx.db.insert("categories", {
        name: "Concerts",
        slug: "concerts",
        sortOrder: 1,
      });

      const venueId = await ctx.db.insert("venues", {
        name: "Test Venue",
        slug: "test-venue",
        address: "123 Main St",
        city: "Karachi",
        country: "Pakistan",
        capacity: 1000,
        images: [],
        createdAt: Date.now(),
      });

      const eventId = await ctx.db.insert("events", {
        title: "Test Event",
        slug: "test-event",
        description: "A test event",
        categoryId,
        venueId,
        images: [],
        startTime: Date.now() + 86400000,
        onSaleStartTime: Date.now(),
        status: "on_sale",
        isFeatured: false,
        isPresale: false,
        minPrice: 1000,
        maxPrice: 2000,
        currency: "PKR",
        tags: [],
        viewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const ticketTypeId = await ctx.db.insert("ticketTypes", {
        eventId,
        name: "VIP Ticket",
        price: 2000,
        fees: 200,
        currency: "PKR",
        totalQuantity: 50,
        availableQuantity: 50,
        minPerOrder: 1,
        maxPerOrder: 5,
        tier: "vip",
        benefits: ["Early entry"],
        salesStartTime: Date.now(),
        isActive: true,
      });

      return { ticketTypeId };
    });

    const ticketType = await t.query(api.events.getTicketType, {
      id: ticketTypeId,
    });

    expect(ticketType).toBeTruthy();
    expect(ticketType?.name).toBe("VIP Ticket");
    expect(ticketType?.price).toBe(2000);
    expect(ticketType?.eventSlug).toBeTruthy();
  });

  it("getTicketType returns null for non-existent ticket type", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    // Create a valid ID format but non-existent
    const fakeId = await t.run(async (ctx) => {
      const categoryId = await ctx.db.insert("categories", {
        name: "Temp",
        slug: "temp",
        sortOrder: 1,
      });
      const venueId = await ctx.db.insert("venues", {
        name: "Temp",
        slug: "temp",
        address: "Temp",
        city: "Temp",
        country: "Temp",
        capacity: 1,
        images: [],
        createdAt: Date.now(),
      });
      const eventId = await ctx.db.insert("events", {
        title: "Temp",
        slug: "temp",
        description: "Temp",
        categoryId,
        venueId,
        images: [],
        startTime: Date.now(),
        onSaleStartTime: Date.now(),
        status: "on_sale",
        isFeatured: false,
        isPresale: false,
        minPrice: 0,
        maxPrice: 0,
        currency: "PKR",
        tags: [],
        viewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const ticketTypeId = await ctx.db.insert("ticketTypes", {
        eventId,
        name: "Temp",
        price: 0,
        fees: 0,
        currency: "PKR",
        totalQuantity: 1,
        availableQuantity: 1,
        minPerOrder: 1,
        maxPerOrder: 1,
        tier: "general",
        benefits: [],
        salesStartTime: Date.now(),
        isActive: true,
      });
      await ctx.db.delete(ticketTypeId);
      return ticketTypeId;
    });

    const ticketType = await t.query(api.events.getTicketType, {
      id: fakeId,
    });

    expect(ticketType).toBeNull();
  });

  it("getRelatedArtists returns artists excluding the specified one", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const { excludeArtistId } = await t.run(async (ctx) => {
      const excludeArtistId = await ctx.db.insert("artists", {
        name: "Excluded Artist",
        slug: "excluded-artist",
        verified: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("artists", {
        name: "Related Artist 1",
        slug: "related-artist-1",
        verified: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("artists", {
        name: "Related Artist 2",
        slug: "related-artist-2",
        verified: true,
        createdAt: Date.now(),
      });

      return { excludeArtistId };
    });

    const related = await t.query(api.events.getRelatedArtists, {
      excludeId: excludeArtistId,
      limit: 5,
    });

    expect(related.length).toBeGreaterThan(0);
    expect(related.every((a) => a._id !== excludeArtistId)).toBe(true);
  });
});

