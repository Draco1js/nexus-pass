import { Polar } from "@convex-dev/polar";
import { api, components } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const polar = new Polar(components.polar, {
  // Optional: Set Polar configuration directly in code or use env vars
  organizationToken: process.env.POLAR_ORGANIZATION_TOKEN,
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
  server: "sandbox",
  getUserInfo: async (ctx): Promise<{ userId: string; email: string }> => {
    // Replace this with your actual user fetching logic
    const user: { _id: string; email?: string } | null = await ctx.runQuery(api.auth.getCurrentUser);
    if (!user) {
      throw new Error("User not authenticated");
    }
    return {
      userId: user._id,
      email: user.email ?? "",
    };
  },
});

export const {
  changeCurrentSubscription,
  cancelCurrentSubscription,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();

export const createCheckout = action({
  args: {
    ticketTypeId: v.id("ticketTypes"),
    price: v.number(),
  },
  handler: async (ctx, args): Promise<string> => {
    try {
      // 1. Fetch ticket type details
      const ticketType = await ctx.runQuery(api.events.getTicketType, { id: args.ticketTypeId });
      if (!ticketType) {
        throw new Error("Ticket type not found");
      }

      // 2. List all available Polar products
      const products = await ctx.runQuery(api.polar.listAllProducts);
      
      if (!products || products.length === 0) {
        throw new Error("No products found in Polar. Please create products in your Polar dashboard.");
      }

      // 3. Try to find a matching product
      // First, try to match by name (ticket type name)
      let product: typeof products[0] | undefined = products.find((p: typeof products[0]) => 
        p.name.toLowerCase().includes(ticketType.name.toLowerCase()) ||
        ticketType.name.toLowerCase().includes(p.name.toLowerCase())
      );

      // If no match by name, try to match by price (within 10% tolerance)
      if (!product) {
        product = products.find((p: typeof products[0]) => {
          if (p.prices && p.prices.length > 0) {
            const productPrice = p.prices[0].priceAmount ?? 0;
            const priceDiff = Math.abs(productPrice - args.price);
            return priceDiff / args.price < 0.1; // 10% tolerance
          }
          return false;
        });
      }

      // If still no match, use the first available product as fallback
      if (!product) {
        console.warn(`No matching product found for ticket "${ticketType.name}", using first available product: ${products[0].name}`);
        product = products[0];
      }

      if (!product || !product.id) {
        throw new Error("Invalid product configuration");
      }

      // 4. Generate checkout link using the Polar action
      // generateCheckoutLink from polar.api() is a registered Convex action, call it via ctx.runAction
      const siteUrl = process.env.SITE_URL || "http://localhost:3000";
      const successUrl = ticketType.eventSlug 
        ? `${siteUrl}/event/${ticketType.eventSlug}/success`
        : `${siteUrl}/checkout/success`;

      const checkoutResult = await ctx.runAction(api.polar.generateCheckoutLink, {
        productIds: [product.id],
        origin: siteUrl,
        successUrl: successUrl,
      });

      // The result should be an object with a 'url' property
      if (checkoutResult && typeof checkoutResult === 'object' && 'url' in checkoutResult) {
        return checkoutResult.url as string;
      }
      
      // Fallback: if it's already a string, return it
      if (typeof checkoutResult === 'string') {
        return checkoutResult;
      }

      throw new Error("Invalid checkout link response");
    } catch (error) {
      console.error("Failed to create checkout link:", error);
      throw new Error(`Checkout failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});
