import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "../lib/test.setup";
import { setupConvexTest } from "../lib/test-helpers";

describe("tickets queries", () => {
  it("getTicketByQR returns ticket when QR code exists", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const { ticketId } = await t.run(async (ctx) => {
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

      const userId = await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
        authId: "test-auth-id",
        role: "customer",
        emailVerified: true,
      });

      const orderId = await ctx.db.insert("orders", {
        userId,
        eventId,
        orderNumber: "NP-TEST-001",
        totalAmount: 1100,
        subtotal: 1000,
        fees: 100,
        tax: 0,
        currency: "PKR",
        status: "confirmed",
        paymentStatus: "completed",
        confirmationEmail: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const ticketId = await ctx.db.insert("tickets", {
        orderId,
        ticketTypeId,
        ticketNumber: "TKT-TEST-001",
        qrCode: "QR-TEST-001",
        price: 1000,
        status: "valid",
        issuedAt: Date.now(),
      });

      return { ticketId };
    });

    const ticket = await t.query(api.tickets.getTicketByQR, {
      qrCode: "QR-TEST-001",
    });

    expect(ticket).toBeTruthy();
    expect(ticket?.ticketNumber).toBe("TKT-TEST-001");
    expect(ticket?.status).toBe("valid");
  });

  it("getTicketByQR returns null for non-existent QR code", async () => {
    const t = setupConvexTest(convexTest(schema, modules));

    const ticket = await t.query(api.tickets.getTicketByQR, {
      qrCode: "NON-EXISTENT-QR",
    });

    expect(ticket).toBeNull();
  });
});

