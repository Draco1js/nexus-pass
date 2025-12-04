import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "../lib/test.setup";
import { setupConvexTest } from "../lib/test-helpers";
import type { MutationCtx } from "./_generated/server";

describe("search queries", () => {
  it("searchEvents returns empty array when no events match", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const results = await t.query(api.search.searchEvents, {
      query: "nonexistent event",
    });

    expect(results).toEqual([]);
  });

  it("searchEvents filters by query text", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    await t.run(async (ctx: MutationCtx) => {
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

      await ctx.db.insert("events", {
        title: "Rock Concert 2024",
        slug: "rock-concert-2024",
        description: "An amazing rock concert",
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
        tags: ["rock", "music"],
        viewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("events", {
        title: "Jazz Night",
        slug: "jazz-night",
        description: "Smooth jazz evening",
        categoryId,
        venueId,
        images: [],
        startTime: Date.now() + 172800000,
        onSaleStartTime: Date.now(),
        status: "on_sale",
        isFeatured: false,
        isPresale: false,
        minPrice: 1500,
        maxPrice: 2500,
        currency: "PKR",
        tags: ["jazz"],
        viewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const results = await t.query(api.search.searchEvents, {
      query: "rock",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain("rock");
  });

  it("searchEvents filters by city", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    await t.run(async (ctx: MutationCtx) => {
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

      await ctx.db.insert("events", {
        title: "Event in Karachi",
        slug: "event-karachi",
        description: "An event",
        categoryId,
        venueId: venueKarachi,
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

      await ctx.db.insert("events", {
        title: "Event in Lahore",
        slug: "event-lahore",
        description: "Another event",
        categoryId,
        venueId: venueLahore,
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
    });

    const results = await t.query(api.search.searchEvents, {
      city: "Karachi",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((e: any) => e.venue.city === "Karachi")).toBe(true);
  });

  it("searchEvents filters by price range", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    await t.run(async (ctx: MutationCtx) => {
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

      await ctx.db.insert("events", {
        title: "Cheap Event",
        slug: "cheap-event",
        description: "Affordable event",
        categoryId,
        venueId,
        images: [],
        startTime: Date.now() + 86400000,
        onSaleStartTime: Date.now(),
        status: "on_sale",
        isFeatured: false,
        isPresale: false,
        minPrice: 500,
        maxPrice: 1000,
        currency: "PKR",
        tags: [],
        viewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("events", {
        title: "Mid Range Event",
        slug: "mid-range-event",
        description: "Mid range event",
        categoryId,
        venueId,
        images: [],
        startTime: Date.now() + 86400000,
        onSaleStartTime: Date.now(),
        status: "on_sale",
        isFeatured: false,
        isPresale: false,
        minPrice: 1500,
        maxPrice: 2000,
        currency: "PKR",
        tags: [],
        viewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("events", {
        title: "Expensive Event",
        slug: "expensive-event",
        description: "Premium event",
        categoryId,
        venueId,
        images: [],
        startTime: Date.now() + 86400000,
        onSaleStartTime: Date.now(),
        status: "on_sale",
        isFeatured: false,
        isPresale: false,
        minPrice: 5000,
        maxPrice: 10000,
        currency: "PKR",
        tags: [],
        viewCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const results = await t.query(api.search.searchEvents, {
      minPrice: 1000,
      maxPrice: 2000,
    });

    expect(results.length).toBeGreaterThan(0);
    // Check that results are within the price range
    // The filter checks minPrice >= filter minPrice, so events with minPrice >= 1000 should match
    expect(results.every((e: any) => e.minPrice >= 1000)).toBe(true);
  });

  it("getSearchFilters returns all filters", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    await t.run(async (ctx: MutationCtx) => {
      await ctx.db.insert("categories", {
        name: "Concerts",
        slug: "concerts",
        sortOrder: 1,
      });

      await ctx.db.insert("venues", {
        name: "Venue 1",
        slug: "venue-1",
        address: "123 Main St",
        city: "Karachi",
        country: "Pakistan",
        capacity: 1000,
        images: [],
        createdAt: Date.now(),
      });

      await ctx.db.insert("venues", {
        name: "Venue 2",
        slug: "venue-2",
        address: "456 Park Ave",
        city: "Lahore",
        country: "Pakistan",
        capacity: 2000,
        images: [],
        createdAt: Date.now(),
      });
    });

    const filters = await t.query(api.search.getSearchFilters);

    expect(filters).toHaveProperty("categories");
    expect(filters).toHaveProperty("cities");
    expect(filters).toHaveProperty("genres");
    expect(filters.cities.length).toBeGreaterThan(0);
  });

  it("getAutocompleteSuggestions returns suggestions for events, artists, and venues", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    await t.run(async (ctx: MutationCtx) => {
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

      await ctx.db.insert("artists", {
        name: "Test Artist",
        slug: "test-artist",
        verified: true,
        createdAt: Date.now(),
      });

      await ctx.db.insert("events", {
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
    });

    const suggestions = await t.query(api.search.getAutocompleteSuggestions, {
      query: "test",
    });

    expect(suggestions).toHaveProperty("events");
    expect(suggestions).toHaveProperty("artists");
    expect(suggestions).toHaveProperty("venues");
    expect(suggestions.events.length + suggestions.artists.length + suggestions.venues.length).toBeGreaterThan(0);
  });

  it("getAutocompleteSuggestions returns empty when query is too short", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const suggestions = await t.query(api.search.getAutocompleteSuggestions, {
      query: "t",
    });

    expect(suggestions).toEqual({
      events: [],
      artists: [],
      venues: [],
    });
  });
});

