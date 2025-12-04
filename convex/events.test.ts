import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "../lib/test.setup";
import { setupConvexTest } from "../lib/test-helpers";

describe("events queries", () => {
  it("homepageHighlights returns empty structure when no events exist", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const highlights = await t.query(api.events.homepageHighlights, {
      city: null,
    });

    expect(highlights).toEqual({
      hero: null,
      featured: [],
      presales: [],
      cityGroups: [],
      editorsPicks: [],
    });
  });

  it("homepageHighlights returns events grouped correctly", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    // Setup: Create category, venues, and events
    const { categoryId, venueId1, venueId2 } = await t.run(async (ctx) => {
      const categoryId = await ctx.db.insert("categories", {
        name: "Concerts",
        slug: "concerts",
        sortOrder: 1,
      });

      const venueId1 = await ctx.db.insert("venues", {
        name: "Venue 1",
        slug: "venue-1",
        address: "123 Main St",
        city: "Karachi",
        country: "Pakistan",
        capacity: 1000,
        images: [],
        createdAt: Date.now(),
      });

      const venueId2 = await ctx.db.insert("venues", {
        name: "Venue 2",
        slug: "venue-2",
        address: "456 Park Ave",
        city: "Lahore",
        country: "Pakistan",
        capacity: 2000,
        images: [],
        createdAt: Date.now(),
      });

      const now = Date.now();
      const tomorrow = now + 86400000;

      // Create featured event
      await ctx.db.insert("events", {
        title: "Featured Event",
        slug: "featured-event",
        description: "A featured event",
        categoryId,
        venueId: venueId1,
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

      // Create presale event
      await ctx.db.insert("events", {
        title: "Presale Event",
        slug: "presale-event",
        description: "A presale event",
        categoryId,
        venueId: venueId2,
        images: [],
        startTime: tomorrow + 86400000,
        onSaleStartTime: now,
        presaleStartTime: now,
        presaleEndTime: tomorrow,
        status: "on_sale",
        isFeatured: false,
        isPresale: true,
        minPrice: 1500,
        maxPrice: 2500,
        currency: "PKR",
        tags: [],
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      return { categoryId, venueId1, venueId2 };
    });

    const highlights = await t.query(api.events.homepageHighlights, {
      city: null,
    });

    expect(highlights.hero).toBeTruthy();
    expect(highlights.hero?.title).toBe("Featured Event");
    expect(highlights.featured.length).toBeGreaterThan(0);
    expect(highlights.presales.length).toBeGreaterThan(0);
  });

  it("getEventBySlug returns event with ticket types", async () => {
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

      await ctx.db.insert("ticketTypes", {
        eventId,
        name: "General Admission",
        price: 1000,
        fees: 100,
        currency: "PKR",
        totalQuantity: 100,
        availableQuantity: 100,
        minPerOrder: 1,
        maxPerOrder: 10,
        tier: "general",
        benefits: [],
        salesStartTime: Date.now(),
        isActive: true,
      });

      await ctx.db.insert("ticketTypes", {
        eventId,
        name: "VIP",
        price: 2000,
        fees: 200,
        currency: "PKR",
        totalQuantity: 50,
        availableQuantity: 50,
        minPerOrder: 1,
        maxPerOrder: 5,
        tier: "vip",
        benefits: ["Early entry", "Meet & greet"],
        salesStartTime: Date.now(),
        isActive: true,
      });

      return { eventSlug: "test-event" };
    });

    const event = await t.query(api.events.getEventBySlug, {
      slug: eventSlug,
    });

    expect(event).toBeTruthy();
    expect(event?.title).toBe("Test Event");
    expect(event?.ticketTypes).toHaveLength(2);
    expect(event?.ticketTypes[0].name).toBe("General Admission");
    expect(event?.ticketTypes[1].name).toBe("VIP");
  });

  it("getEventBySlug returns null for non-existent event", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const event = await t.query(api.events.getEventBySlug, {
      slug: "non-existent-event",
    });

    expect(event).toBeNull();
  });

  it("getAvailableTickets returns tickets for event", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const { eventId } = await t.run(async (ctx) => {
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

      await ctx.db.insert("ticketTypes", {
        eventId,
        name: "General Admission",
        price: 1000,
        fees: 100,
        currency: "PKR",
        totalQuantity: 10,
        availableQuantity: 10,
        minPerOrder: 1,
        maxPerOrder: 10,
        tier: "general",
        benefits: [],
        salesStartTime: Date.now(),
        isActive: true,
      });

      return { eventId };
    });

    const tickets = await t.query(api.events.getAvailableTickets, {
      eventId,
    });

    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0]).toHaveProperty("id");
    expect(tickets[0]).toHaveProperty("price");
    expect(tickets[0]).toHaveProperty("fees");
  });

  it("getArtistBySlug returns artist with events", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const { artistSlug } = await t.run(async (ctx) => {
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

      const artistId = await ctx.db.insert("artists", {
        name: "Test Artist",
        slug: "test-artist",
        verified: true,
        createdAt: Date.now(),
      });

      const eventId = await ctx.db.insert("events", {
        title: "Test Event",
        slug: "test-event",
        description: "A test event",
        categoryId,
        venueId,
        artistId,
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

      return { artistSlug: "test-artist" };
    });

    const artist = await t.query(api.events.getArtistBySlug, {
      slug: artistSlug,
    });

    expect(artist).toBeTruthy();
    expect(artist?.name).toBe("Test Artist");
    expect(artist?.events).toHaveLength(1);
    expect(artist?.events[0].title).toBe("Test Event");
  });
});

