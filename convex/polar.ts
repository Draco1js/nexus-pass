import { Polar } from "@convex-dev/polar";
import { api, components, internal } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { generateOrderNumber, generateTicketNumber } from "./utils";

// Polar API base URL - uses sandbox by default, change to production when ready
const POLAR_API_BASE = "https://sandbox-api.polar.sh";

// Validate Polar configuration
// Try POLAR_ORGANIZATION_TOKEN first, fallback to POLAR_ACCESS_TOKEN
const organizationToken = process.env.POLAR_ORGANIZATION_TOKEN || process.env.POLAR_ACCESS_TOKEN;
if (!organizationToken) {
  console.warn("[polar] Neither POLAR_ORGANIZATION_TOKEN nor POLAR_ACCESS_TOKEN is set. Polar checkout will fail.");
}

export const polar = new Polar(components.polar, {
  // Optional: Set Polar configuration directly in code or use env vars
  // Use POLAR_ORGANIZATION_TOKEN if available, otherwise fallback to POLAR_ACCESS_TOKEN
  organizationToken: organizationToken,
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
  server: "sandbox",
  // Required: getUserInfo function that returns userId and email
  // Optionally returns customerId if customer already exists
  getUserInfo: async (ctx): Promise<{ userId: string; email: string; customerId?: string }> => {
    // Get the user with Polar customer ID using a query
    const user = await ctx.runQuery(api.auth.getCurrentUserForPolar);
    if (!user) {
      throw new Error("User not authenticated");
    }

    if (!user.email) {
      throw new Error("User email not found");
    }

    // Return the stored customer ID if available
    // If not available, Polar component will try to create one
    // If creation fails because customer exists, the component should handle it gracefully
    return {
      userId: user._id,
      email: user.email,
      ...(user.polarCustomerId && { customerId: user.polarCustomerId }),
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

/**
 * Create or update a Polar customer for a user (Action)
 * Uses upsert logic - creates if doesn't exist, updates if it does
 * This is called from auth triggers to proactively create/update customers
 * Uses Polar API directly (component doesn't expose customer CRUD methods)
 * Must be an action because it uses fetch()
 */
export const upsertPolarCustomer = action({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    existingCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string | null> => {
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    const organizationId = process.env.POLAR_ORGANIZATION_ID;

    if (!accessToken || !organizationId) {
      console.warn("[upsertPolarCustomer] Polar access token or organization ID not configured");
      return null;
    }

    try {
      // If we have an existing customer ID, try to update first
      if (args.existingCustomerId) {
        try {
          const updateResponse = await fetch(`${POLAR_API_BASE}/v1/customers/${args.existingCustomerId}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: args.email,
              name: args.name,
            }),
          });

          if (updateResponse.ok) {
            const updatedCustomer = await updateResponse.json();
            const customerId = updatedCustomer.id || args.existingCustomerId;
            console.log(`[upsertPolarCustomer] Updated Polar customer ${customerId} for user ${args.userId}`);
            
            // Update the user record with the customer ID
            await ctx.runMutation(api.polar.updateUserPolarCustomerId as any, {
              userId: args.userId,
              polarCustomerId: customerId,
            });
            
            // Ensure customer exists in Polar component's internal database
            await ctx.runMutation(api.polar.syncCustomerToPolarComponent as any, {
              userId: args.userId,
              customerId: customerId,
              email: args.email,
              name: args.name,
            });
            
            return customerId;
          }
        } catch (updateError) {
          console.warn(`[upsertPolarCustomer] Failed to update customer ${args.existingCustomerId}, will try to create:`, updateError);
          // Continue to create flow if update fails
        }
      }

      // Try to find existing customer by email
      try {
        const searchResponse = await fetch(
          `${POLAR_API_BASE}/v1/customers?email=${encodeURIComponent(args.email)}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          if (searchResult.items && searchResult.items.length > 0) {
            const existingCustomer = searchResult.items[0];
            console.log(`[upsertPolarCustomer] Found existing Polar customer ${existingCustomer.id} for email ${args.email}`);
            
            // Update the existing customer
            const updateResponse = await fetch(`${POLAR_API_BASE}/v1/customers/${existingCustomer.id}`, {
              method: "PATCH",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: args.email,
                name: args.name,
              }),
            });

            if (updateResponse.ok) {
              // Update the user record with the customer ID
              await ctx.runMutation(api.polar.updateUserPolarCustomerId as any, {
                userId: args.userId,
                polarCustomerId: existingCustomer.id,
              });
              
              // Ensure customer exists in Polar component's internal database
              await ctx.runMutation(api.polar.syncCustomerToPolarComponent as any, {
                userId: args.userId,
                customerId: existingCustomer.id,
                email: args.email,
                name: args.name,
              });
              
              return existingCustomer.id;
            }
          }
        }
      } catch (searchError) {
        console.warn(`[upsertPolarCustomer] Failed to search for existing customer:`, searchError);
        // Continue to create flow
      }

      // Create new customer
      const createResponse = await fetch(`${POLAR_API_BASE}/v1/customers`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: args.email,
          name: args.name,
          metadata: {
            user_id: args.userId,
          },
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        
        // If customer already exists (422), try to find it again
        if (createResponse.status === 422) {
          console.log(`[upsertPolarCustomer] Customer already exists, looking up by email: ${args.email}`);
          try {
            const retrySearchResponse = await fetch(
              `${POLAR_API_BASE}/v1/customers?email=${encodeURIComponent(args.email)}`,
              {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (retrySearchResponse.ok) {
              const retrySearchResult = await retrySearchResponse.json();
              if (retrySearchResult.items && retrySearchResult.items.length > 0) {
                const existingCustomer = retrySearchResult.items[0];
                console.log(`[upsertPolarCustomer] Found existing customer ${existingCustomer.id} after 422 error`);
                
                // Update the user record with the customer ID
                await ctx.runMutation(api.polar.updateUserPolarCustomerId as any, {
                  userId: args.userId,
                  polarCustomerId: existingCustomer.id,
                });
                
                // Ensure customer exists in Polar component's internal database
                await ctx.runMutation(api.polar.syncCustomerToPolarComponent as any, {
                  userId: args.userId,
                  customerId: existingCustomer.id,
                  email: args.email,
                  name: args.name,
                });
                
                return existingCustomer.id;
              }
            }
          } catch (retryError) {
            console.warn(`[upsertPolarCustomer] Failed to retry search after 422:`, retryError);
          }
        }
        
        console.error(`[upsertPolarCustomer] Polar API error creating customer:`, createResponse.status, errorText);
        return null;
      }

      const newCustomer = await createResponse.json();
      if (newCustomer && newCustomer.id) {
        console.log(`[upsertPolarCustomer] Created new Polar customer ${newCustomer.id} for user ${args.userId}`);
        
        // Update the user record with the customer ID
        await ctx.runMutation(api.polar.updateUserPolarCustomerId as any, {
          userId: args.userId,
          polarCustomerId: newCustomer.id,
        });
        
        // Ensure customer exists in Polar component's internal database
        await ctx.runMutation(api.polar.syncCustomerToPolarComponent as any, {
          userId: args.userId,
          customerId: newCustomer.id,
          email: args.email,
          name: args.name,
        });
        
        return newCustomer.id;
      }

      return null;
    } catch (error) {
      console.error("[upsertPolarCustomer] Failed to upsert Polar customer:", error);
      return null;
    }
  },
});

/**
 * Find existing Polar customer by email (Action)
 * Used to lookup customer ID if we don't have it stored locally
 */
export const findCustomerByEmail = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<string | null> => {
    const accessToken = process.env.POLAR_ACCESS_TOKEN || process.env.POLAR_ORGANIZATION_TOKEN;
    
    if (!accessToken) {
      return null;
    }

    try {
      const searchResponse = await fetch(
        `${POLAR_API_BASE}/v1/customers?email=${encodeURIComponent(args.email)}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.items && searchResult.items.length > 0) {
          const existingCustomer = searchResult.items[0];
          return existingCustomer.id;
        }
      }
    } catch (error) {
      console.warn(`[findCustomerByEmail] Failed to search for customer:`, error);
    }

    return null;
  },
});

/**
 * Internal mutation to update user's Polar customer ID
 * Called from the upsertPolarCustomer action
 */
export const updateUserPolarCustomerId = mutation({
  args: {
    userId: v.id("users"),
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      polarCustomerId: args.polarCustomerId,
    });
  },
});

/**
 * Internal mutation to sync customer to Polar component's internal database
 * Ensures the customer exists in the component's database so it can be found by getCustomerByUserId
 * Called from upsertPolarCustomer after creating/finding a customer
 */
export const syncCustomerToPolarComponent = mutation({
  args: {
    userId: v.id("users"),
    customerId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if customer already exists in Polar component's database
      const existingCustomer = await ctx.runQuery(components.polar.lib.getCustomerByUserId, {
        userId: args.userId,
      });
      
      // Only insert if it doesn't exist
      if (!existingCustomer) {
        await ctx.runMutation(components.polar.lib.insertCustomer, {
          id: args.customerId,
          userId: args.userId,
          metadata: {
            email: args.email,
            name: args.name,
          },
        });
        console.log(`[syncCustomerToPolarComponent] Inserted customer ${args.customerId} into Polar component database for user ${args.userId}`);
      } else {
        console.log(`[syncCustomerToPolarComponent] Customer ${args.customerId} already exists in Polar component database`);
      }
    } catch (error) {
      // Log but don't throw - this is a sync operation and shouldn't fail the main flow
      console.warn(`[syncCustomerToPolarComponent] Failed to sync customer to Polar component database:`, error);
    }
  },
});

/**
 * Main checkout action - uses Polar component's generateCheckoutLink
 * Matches ticket type to Polar product and generates checkout link
 */
export const createCheckout = action({
  args: {
    ticketTypeId: v.id("ticketTypes"),
    price: v.number(),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<string> => {
    try {
      // 0. Ensure user has a Polar customer ID before proceeding
      // This prevents the Polar component from trying to create a duplicate customer
      let user = await ctx.runQuery(api.auth.getCurrentUserForPolar);
      if (!user || !user.email) {
        throw new Error("User not authenticated");
      }

      if (!user.polarCustomerId) {
        // Try to find existing customer in Polar
        const existingCustomerId = await ctx.runAction(api.polar.findCustomerByEmail, {
          email: user.email,
        });
        
        if (existingCustomerId) {
          // Store the customer ID in our database
          await ctx.runMutation(api.polar.updateUserPolarCustomerId as any, {
            userId: user._id,
            polarCustomerId: existingCustomerId,
          });
        } else {
          // If customer doesn't exist, create one proactively
          const newCustomerId = await ctx.runAction(api.polar.upsertPolarCustomer, {
            userId: user._id,
            email: user.email,
            name: user.name || "User",
          });
          
          // If creation succeeded but didn't return an ID, look it up
          if (!newCustomerId) {
            const foundCustomerId = await ctx.runAction(api.polar.findCustomerByEmail, {
              email: user.email,
            });
            if (foundCustomerId) {
              await ctx.runMutation(api.polar.updateUserPolarCustomerId as any, {
                userId: user._id,
                polarCustomerId: foundCustomerId,
              });
            }
          }
        }
        
        // Re-query user to ensure we have the latest customer ID
        // This ensures the Polar component's getUserInfo will return the customerId
        user = await ctx.runQuery(api.auth.getCurrentUserForPolar);
        
        if (!user || !user.email) {
          throw new Error("Polar recheck failed" + user);
        }

        if (!user?.polarCustomerId) {
          console.warn("[createCheckout] Customer ID still not found after lookup/creation. Polar component may try to create a duplicate.");
        }
      }

      // 0.5. Ensure customer exists in Polar component's internal database
      // This prevents the component from trying to create a duplicate customer
      if (user.polarCustomerId) {
        try {
          // Check if customer exists in Polar component's database
          const dbCustomer = await ctx.runQuery(components.polar.lib.getCustomerByUserId, {
            userId: user._id,
          });
          
          // If customer doesn't exist in component's database, insert it
          if (!dbCustomer) {
            console.log(`[createCheckout] Inserting customer ${user.polarCustomerId} into Polar component database`);
            await ctx.runMutation(components.polar.lib.insertCustomer, {
              id: user.polarCustomerId,
              userId: user._id,
              metadata: {
                email: user.email,
                name: user.name,
              },
            });
          }
        } catch (error) {
          console.warn("[createCheckout] Failed to ensure customer in Polar component database:", error);
          // Continue anyway - the component will try to handle it
        }
      }

      // 1. Fetch ticket type details
      const ticketType = await ctx.runQuery(api.events.getTicketType, { id: args.ticketTypeId });
      if (!ticketType) {
        throw new Error("Ticket type not found");
      }

      // Check if ticket type has a stored Polar product ID
      // Type assertion needed until Convex regenerates types
      const ticketTypeWithPolar = ticketType as typeof ticketType & { 
        polarProductId?: string | undefined;
        polarPriceId?: string | undefined;
      };
      
      if (ticketTypeWithPolar.polarProductId) {
        console.log(`[createCheckout] Using stored Polar product ID: ${ticketTypeWithPolar.polarProductId}`);
        const siteUrl = process.env.SITE_URL || "http://localhost:3000";
        // Always include ticketTypeId in success URL so webhook can find the correct ticket type
        const successUrl = ticketType.eventSlug 
          ? `${siteUrl}/event/${ticketType.eventSlug}/success?ticketTypeId=${args.ticketTypeId}&quantity=1`
          : `${siteUrl}/checkout/success?ticketTypeId=${args.ticketTypeId}&quantity=1`;

      try {
        const checkoutResult = await ctx.runAction(api.polar.generateCheckoutLink, {
          productIds: [ticketTypeWithPolar.polarProductId],
          origin: siteUrl,
          successUrl: successUrl,
        });

        if (checkoutResult && typeof checkoutResult === 'object' && 'url' in checkoutResult) {
          return checkoutResult.url as string;
        }
        
        if (typeof checkoutResult === 'string') {
          return checkoutResult;
        }
      } catch (error) {
        console.error(`[createCheckout] Failed to generate checkout link with stored product ID:`, error);
        // Fall through to try other methods
      }
      }

      // 2. Try to use default product ID from environment variable
      const defaultProductId = process.env.POLAR_DEFAULT_PRODUCT_ID;
      if (defaultProductId) {
        console.log(`[createCheckout] Using default Polar product ID from env: ${defaultProductId}`);
        const siteUrl = process.env.SITE_URL || "http://localhost:3000";
        // Always include ticketTypeId in success URL so webhook can find the correct ticket type
        const successUrl = ticketType.eventSlug 
          ? `${siteUrl}/event/${ticketType.eventSlug}/success?ticketTypeId=${args.ticketTypeId}&quantity=1`
          : `${siteUrl}/checkout/success?ticketTypeId=${args.ticketTypeId}&quantity=1`;

        try {
          const checkoutResult = await ctx.runAction(api.polar.generateCheckoutLink, {
            productIds: [defaultProductId],
            origin: siteUrl,
            successUrl: successUrl,
          });

          if (checkoutResult && typeof checkoutResult === 'object' && 'url' in checkoutResult) {
            return checkoutResult.url as string;
          }
          
          if (typeof checkoutResult === 'string') {
            return checkoutResult;
          }
        } catch (error) {
          console.error(`[createCheckout] Failed to generate checkout link with default product ID:`, error);
          // Fall through to try other methods
        }
      }

      // 3. List all available Polar products using the component's query
      const products = await ctx.runQuery(api.polar.listAllProducts);
      console.log(`[createCheckout] Found ${products?.length || 0} products from listAllProducts`);
      
      if (!products || products.length === 0) {
        throw new Error("No products found in Polar. Please create products in your Polar dashboard or set POLAR_DEFAULT_PRODUCT_ID environment variable.");
      }

      // 4. Try to find a matching product
      // First, try to match by name (ticket type name)
      type PolarProduct = { id: string; name: string; prices?: Array<{ priceAmount?: number }> };
      let product: PolarProduct | undefined = products.find((p: PolarProduct) => 
        p.name.toLowerCase().includes(ticketType.name.toLowerCase()) ||
        ticketType.name.toLowerCase().includes(p.name.toLowerCase())
      );

      // If no match by name, try to match by price (within 10% tolerance)
      if (!product) {
        product = products.find((p: PolarProduct) => {
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
        product = products[0] as PolarProduct;
      }

      if (!product || !product.id) {
        throw new Error("Invalid product configuration");
      }

      // 5. Generate checkout link using the Polar component action
      const siteUrl = process.env.SITE_URL || "http://localhost:3000";
      // Include ticket type ID and quantity in success URL for processing
      const quantity = args.quantity || 1;
      const successUrl = ticketType.eventSlug 
        ? `${siteUrl}/event/${ticketType.eventSlug}/success?ticketTypeId=${args.ticketTypeId}&quantity=${quantity}`
        : `${siteUrl}/checkout/success?ticketTypeId=${args.ticketTypeId}&quantity=${quantity}`;

      try {
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
        // If Polar authentication fails, provide a helpful error message
        if (error instanceof Error && error.message.includes("Unauthorized")) {
          throw new Error("Polar authentication failed. Please check that POLAR_ORGANIZATION_TOKEN is set correctly in your Convex environment variables.");
        }
        throw error;
      }
    } catch (error) {
      console.error("Failed to create checkout link:", error);
      throw new Error(`Checkout failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

/**
 * Process checkout completion and create orders/tickets
 * Called when user returns from Polar checkout with customer_session_token
 * Includes idempotency check to prevent duplicate ticket creation
 */
export const processCheckoutCompletion = action({
  args: {
    customerSessionToken: v.string(),
    ticketTypeId: v.id("ticketTypes"),
    quantity: v.number(),
  },
  handler: async (ctx, args): Promise<{ orderId: string; ticketIds: string[] }> => {
    const accessToken = process.env.POLAR_ACCESS_TOKEN || process.env.POLAR_ORGANIZATION_TOKEN;
    
    if (!accessToken) {
      throw new Error("Polar access token not configured");
    }

    try {
      // Get checkout session from Polar using customer_session_token
      // Try multiple possible endpoints
      let checkout: any = null;
      let checkoutId: string | null = null;

      // First, try to get checkout by customer_session_token
      // Note: The webhook already processes payment, so we can proceed with ticket creation
      // even if we can't fetch checkout details here
      try {
        const checkoutResponse = await fetch(
          `${POLAR_API_BASE}/v1/checkouts?customer_session_token=${args.customerSessionToken}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (checkoutResponse.ok) {
          const checkoutData = await checkoutResponse.json();
          
          // Handle array response (list of checkouts)
          checkout = Array.isArray(checkoutData) && checkoutData.length > 0 
            ? checkoutData[0] 
            : checkoutData;
          
          checkoutId = checkout?.id || null;
          
          // Verify checkout is completed if we got checkout data
          // Polar uses "succeeded" status for successful checkouts
          if (checkout && checkout.status) {
            if (checkout.status !== "completed" && checkout.status !== "paid" && checkout.status !== "succeeded") {
              throw new Error(`Checkout not completed. Status: ${checkout.status}`);
            }
          }
        } else {
          console.warn(`[processCheckoutCompletion] Failed to fetch checkout: ${checkoutResponse.status}`);
        }
      } catch (fetchError) {
        console.warn("[processCheckoutCompletion] Failed to fetch checkout by session token:", fetchError);
        // Continue anyway - webhook should have already processed the payment
      }
      
      // If checkout is null/undefined but we have a session token, proceed anyway
      // The webhook handles the actual ticket creation, but this provides a fallback
      if (!checkout) {
        console.log("[processCheckoutCompletion] Checkout data not available via API, but proceeding with ticket creation (webhook should have already processed)");
      }

      // Get current user
      const user = await ctx.runQuery(api.auth.getCurrentUserForPolar);
      if (!user || !user.email) {
        throw new Error("User not authenticated");
      }

      // Check for existing order with this checkout ID first (idempotency check)
      // The webhook may have already processed this checkout
      if (checkoutId) {
        const existingOrders = await ctx.runQuery(api.polar.getOrderByCheckoutId, {
          checkoutId: checkoutId,
        });
        
        if (existingOrders && existingOrders.length > 0) {
          const existingOrder = existingOrders[0];
          console.log(`[processCheckoutCompletion] Order already exists for checkout ${checkoutId}, returning existing tickets`);
          
          // Get existing tickets for this order
          const existingTickets = await ctx.runQuery(api.tickets.getTicketsByOrderId, {
            orderId: existingOrder._id,
          });
          
          return {
            orderId: existingOrder._id,
            ticketIds: existingTickets?.map(t => t._id) || [],
          };
        }
      }

      // Also check by session token as fallback (in case checkoutId is null)
      // Check if user already has recent orders for this event (within last 5 minutes)
      // This prevents duplicate orders if processCheckoutCompletion is called multiple times
      // Get ticket type first to get eventId
      const ticketType = await ctx.runQuery(api.events.getTicketType, { id: args.ticketTypeId });
      if (!ticketType) {
        throw new Error("Ticket type not found");
      }

      // Get event
      if (!ticketType.eventSlug) {
        throw new Error("Ticket type does not have an associated eventSlug");
      }
      const event = await ctx.runQuery(api.events.getEventBySlug, { slug: ticketType.eventSlug as string });
      if (!event) {
        throw new Error("Event not found");
      }

      // Check for recent duplicate orders BEFORE creating a new one
      const recentOrders = await ctx.runQuery(api.polar.getRecentOrdersByUserAndEvent, {
        userId: user._id,
        eventId: event._id,
        withinMinutes: 5,
      });
      
      if (recentOrders && recentOrders.length > 0) {
        // Check if any of these orders match the expected quantity and are recent
        const matchingOrder = recentOrders.find((order: any) => {
          // If we have a checkoutId, match by that
          if (checkoutId && order.polarCheckoutId === checkoutId) {
            return true;
          }
          // Otherwise, if order was created very recently (within 1 minute), it's likely a duplicate
          const orderAge = Date.now() - order.createdAt;
          return orderAge < 60000; // 1 minute
        });
        
        if (matchingOrder) {
          console.log(`[processCheckoutCompletion] Found recent duplicate order ${matchingOrder._id}, returning existing tickets`);
          const existingTickets = await ctx.runQuery(api.tickets.getTicketsByOrderId, {
            orderId: matchingOrder._id,
          });
          
          return {
            orderId: matchingOrder._id,
            ticketIds: existingTickets?.map(t => t._id) || [],
          };
        }
      }

      // Calculate totals
      const subtotal = ticketType.price * args.quantity;
      const fees = ticketType.fees * args.quantity;
      const tax = 0; // Add tax calculation if needed
      const totalAmount = subtotal + fees + tax;

      // Create order
      const orderId = await ctx.runMutation(api.polar.createOrder, {
        userId: user._id,
        eventId: event._id,
        ticketTypeId: args.ticketTypeId,
        quantity: args.quantity,
        subtotal,
        fees,
        tax,
        totalAmount,
        currency: ticketType.currency,
        polarCheckoutId: checkoutId || `session_${args.customerSessionToken.substring(0, 8)}`,
      });

      // Create tickets
      const ticketIds: string[] = [];
      for (let i = 0; i < args.quantity; i++) {
        const ticketId = await ctx.runMutation(api.polar.createTicket, {
          orderId,
          ticketTypeId: args.ticketTypeId,
          holderName: user.name,
          holderEmail: user.email,
          price: ticketType.price,
          section: ticketType.section,
          row: undefined, // Add row assignment logic if needed
          seatNumber: undefined, // Add seat assignment logic if needed
        });
        ticketIds.push(ticketId);
      }

      // Update ticket type availability
      await ctx.runMutation(api.polar.updateTicketTypeAvailability, {
        ticketTypeId: args.ticketTypeId,
        quantitySold: args.quantity,
      });

      console.log(`[processCheckoutCompletion] Successfully created order ${orderId} with ${ticketIds.length} tickets`);
      return { orderId, ticketIds };
    } catch (error) {
      console.error("[processCheckoutCompletion] Error:", error);
      throw error;
    }
  },
});

/**
 * Get user by Polar customer ID
 */
export const getUserByPolarCustomerId = query({
  args: {
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("polarCustomerId"), args.customerId))
      .first();
    
    return user;
  },
});

/**
 * Get ticket type by Polar product ID
 */
export const getTicketTypeByProductId = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const ticketTypes = await ctx.db
      .query("ticketTypes")
      .filter((q) => q.eq(q.field("polarProductId"), args.productId))
      .collect();
    
    // Return the first matching ticket type
    return ticketTypes.length > 0 ? ticketTypes[0] : null;
  },
});

/**
 * Get order by Polar checkout ID (for idempotency checks)
 */
export const getOrderByCheckoutId = query({
  args: {
    checkoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_polarCheckoutId", (q) => q.eq("polarCheckoutId", args.checkoutId))
      .collect();
    
    return orders;
  },
});

/**
 * Process checkout completion from webhook
 * This is called when Polar sends a checkout.updated webhook event
 */
export const processCheckoutWebhook = action({
  args: {
    checkoutId: v.string(),
    customerId: v.string(),
    productId: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    console.log(`[processCheckoutWebhook] Processing checkout ${args.checkoutId} for customer ${args.customerId}, product ${args.productId}`);
    
    // Check if order already exists (idempotency)
    const existingOrders = await ctx.runQuery(api.polar.getOrderByCheckoutId, {
      checkoutId: args.checkoutId,
    });
    
    if (existingOrders && existingOrders.length > 0) {
      console.log(`[processCheckoutWebhook] Order already exists for checkout ${args.checkoutId}, skipping`);
      console.log(`[processCheckoutWebhook] Existing order IDs:`, existingOrders.map(o => o._id));
      return;
    }
    
    console.log(`[processCheckoutWebhook] No existing order found, proceeding with ticket creation`);
    
    // Find user by Polar customer ID
    let user = await ctx.runQuery(api.polar.getUserByPolarCustomerId, {
      customerId: args.customerId,
    });
    
    // If user not found, try to get customer info from Polar and find by email
    if (!user) {
      console.warn(`[processCheckoutWebhook] User not found for customer ID ${args.customerId}, trying to fetch from Polar`);
      const accessToken = process.env.POLAR_ACCESS_TOKEN || process.env.POLAR_ORGANIZATION_TOKEN;
      if (accessToken) {
        try {
          const customerResponse = await fetch(
            `${POLAR_API_BASE}/v1/customers/${args.customerId}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          if (customerResponse.ok) {
            const customer = await customerResponse.json();
            const email = customer.email;
            
            // Find user by email using the users table
            const usersByEmail = await ctx.runQuery(api.polar.getUsersByEmail, { email });
            if (usersByEmail && usersByEmail.length > 0) {
              const foundUser = usersByEmail[0];
              // Update user with customer ID
              await ctx.runMutation(api.polar.updateUserPolarCustomerId, {
                userId: foundUser._id,
                polarCustomerId: args.customerId,
              });
              user = foundUser;
            } else {
              throw new Error(`User not found for customer ${args.customerId} with email ${email}`);
            }
          }
        } catch (error) {
          console.error(`[processCheckoutWebhook] Failed to fetch customer info:`, error);
          throw new Error(`User not found for customer ID ${args.customerId}`);
        }
      } else {
        throw new Error(`User not found for customer ID ${args.customerId}`);
      }
    }
    
    if (!user || !user.email) {
      throw new Error(`User not found or invalid for customer ID ${args.customerId}`);
    }
    
    // Find ticket type by product ID
    if (!args.productId) {
      console.warn(`[processCheckoutWebhook] Product ID not provided in webhook event, will try to get from checkout`);
    }
    
    let ticketType: any = null;
    
    if (args.productId) {
      ticketType = await ctx.runQuery(api.polar.getTicketTypeByProductId, {
        productId: args.productId,
      });
      console.log(`[processCheckoutWebhook] Looked up ticket type by product ID ${args.productId}:`, ticketType ? ticketType._id : "not found");
    }
    
    // If ticket type not found by product ID, try to get from checkout metadata
    if (!ticketType) {
      console.warn(`[processCheckoutWebhook] Ticket type not found for product ID ${args.productId}, checking checkout metadata`);
      const accessToken = process.env.POLAR_ACCESS_TOKEN || process.env.POLAR_ORGANIZATION_TOKEN;
      if (accessToken) {
        try {
          const checkoutResponse = await fetch(
            `${POLAR_API_BASE}/v1/checkouts/${args.checkoutId}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          if (checkoutResponse.ok) {
            const checkout = await checkoutResponse.json();
            // Check if checkout has metadata with ticketTypeId
            if (checkout.metadata && checkout.metadata.ticketTypeId) {
              const ticketTypeId = checkout.metadata.ticketTypeId as string;
              const ticketTypeResult = await ctx.runQuery(api.events.getTicketType, { id: ticketTypeId as any });
              if (ticketTypeResult) {
                ticketType = ticketTypeResult;
              }
            }
          }
        } catch (error) {
          console.error(`[processCheckoutWebhook] Failed to fetch checkout details:`, error);
        }
      }
    }
    
    if (!ticketType || !ticketType._id) {
      console.error(`[processCheckoutWebhook] Ticket type not found for product ID ${args.productId}`);
      // Try to fetch checkout to get product ID or metadata
      const accessToken = process.env.POLAR_ACCESS_TOKEN || process.env.POLAR_ORGANIZATION_TOKEN;
      if (accessToken && args.checkoutId) {
        try {
          const checkoutResponse = await fetch(
            `${POLAR_API_BASE}/v1/checkouts/${args.checkoutId}`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          if (checkoutResponse.ok) {
            const checkout = await checkoutResponse.json();
            console.log(`[processCheckoutWebhook] Checkout details:`, JSON.stringify(checkout, null, 2));
            
            // Try to get product ID from checkout if not provided
            if (!args.productId && checkout.product_id) {
              ticketType = await ctx.runQuery(api.polar.getTicketTypeByProductId, {
                productId: checkout.product_id,
              });
              console.log(`[processCheckoutWebhook] Found ticket type from checkout product_id:`, ticketType ? ticketType._id : "not found");
            }
            
            // Check metadata for ticketTypeId
            if (!ticketType && checkout.metadata && checkout.metadata.ticketTypeId) {
              const ticketTypeId = checkout.metadata.ticketTypeId as string;
              ticketType = await ctx.runQuery(api.events.getTicketType, { id: ticketTypeId as any });
              console.log(`[processCheckoutWebhook] Found ticket type from checkout metadata:`, ticketType ? ticketType._id : "not found");
            }
            
            // If still no ticket type, try to extract ticketTypeId from success_url query params
            if (!ticketType && checkout.success_url) {
              try {
                // Extract ticketTypeId and quantity from success URL query params
                // Format: http://localhost:3000/event/{slug}/success?ticketTypeId={id}&quantity=2
                const url = new URL(checkout.success_url);
                const ticketTypeIdParam = url.searchParams.get("ticketTypeId");
                const quantityParam = url.searchParams.get("quantity");
                
                if (ticketTypeIdParam) {
                  console.log(`[processCheckoutWebhook] Extracted ticketTypeId from success_url: ${ticketTypeIdParam}, quantity: ${quantityParam || "1"}`);
                  ticketType = await ctx.runQuery(api.events.getTicketType, { id: ticketTypeIdParam as any });
                  if (ticketType) {
                    console.log(`[processCheckoutWebhook] Found ticket type from success_url query param: ${ticketType._id}`);
                    // Store quantity in checkout object for later use
                    (checkout as any).extractedQuantity = quantityParam ? parseInt(quantityParam, 10) : 1;
                  }
                }
                
                // Fallback: Extract event slug from success URL if ticketTypeId not found
                if (!ticketType) {
                  const urlMatch = checkout.success_url.match(/\/event\/([^\/]+)\/success/);
                  if (urlMatch && urlMatch[1]) {
                    const eventSlug = urlMatch[1];
                    console.log(`[processCheckoutWebhook] Extracted event slug from success_url: ${eventSlug}`);
                    
                    // Get event by slug
                    const event = await ctx.runQuery(api.events.getEventBySlug, { slug: eventSlug });
                    if (event) {
                      console.log(`[processCheckoutWebhook] Found event: ${event._id}`);
                      
                      // Get ticket types for this event directly from database
                      const ticketTypes = await ctx.runQuery(api.polar.getTicketTypesByEventId, { eventId: event._id });
                      if (ticketTypes && ticketTypes.length > 0) {
                        // Use the first active ticket type (since we can't distinguish by price)
                        ticketType = ticketTypes[0];
                        console.log(`[processCheckoutWebhook] Using first ticket type for event: ${ticketType._id}`);
                      }
                    }
                  }
                }
              } catch (urlError) {
                console.error(`[processCheckoutWebhook] Failed to extract ticketTypeId/event from success_url:`, urlError);
              }
            }
          }
        } catch (error) {
          console.error(`[processCheckoutWebhook] Failed to fetch checkout:`, error);
        }
      }
      
      if (!ticketType || !ticketType._id) {
        throw new Error(`Ticket type not found for product ID ${args.productId || "unknown"} and checkout ${args.checkoutId}`);
      }
    }
    
    console.log(`[processCheckoutWebhook] Found ticket type: ${ticketType._id}, eventId: ${ticketType.eventId}`);
    
    // Get event using eventId directly from database
    const event = await ctx.runQuery(api.polar.getEventById, { 
      eventId: ticketType.eventId as any
    });
    
    if (!event) {
      throw new Error(`Event not found for ticket type ${ticketType._id}`);
    }
    
    console.log(`[processCheckoutWebhook] Found event: ${event._id}`);
    
    // Extract quantity from checkout success_url or default to 1
    // Fetch checkout to get success_url with quantity
    let quantity = 1;
    const accessToken = process.env.POLAR_ACCESS_TOKEN || process.env.POLAR_ORGANIZATION_TOKEN;
    if (accessToken && args.checkoutId) {
      try {
        const checkoutResponse = await fetch(
          `${POLAR_API_BASE}/v1/checkouts/${args.checkoutId}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        
        if (checkoutResponse.ok) {
          const checkout = await checkoutResponse.json();
          if (checkout.success_url) {
            try {
              const url = new URL(checkout.success_url);
              const quantityParam = url.searchParams.get("quantity");
              if (quantityParam) {
                quantity = parseInt(quantityParam, 10) || 1;
                console.log(`[processCheckoutWebhook] Extracted quantity from success_url: ${quantity}`);
              }
            } catch (urlError) {
              console.warn(`[processCheckoutWebhook] Failed to extract quantity from success_url:`, urlError);
            }
          }
        }
      } catch (fetchError) {
        console.warn(`[processCheckoutWebhook] Failed to fetch checkout for quantity extraction:`, fetchError);
      }
    }
    
    // Calculate totals - use type assertion for ticketType properties
    const ticketPrice = (ticketType as any).price || 0;
    const ticketFees = (ticketType as any).fees || 0;
    const ticketCurrency = (ticketType as any).currency || "USD";
    const subtotal = ticketPrice * quantity;
    const fees = ticketFees * quantity;
    const tax = 0;
    const totalAmount = subtotal + fees + tax;
    
    console.log(`[processCheckoutWebhook] Creating order for user ${user._id}, event ${event._id}, ticketType ${ticketType._id}`);
    
    // Create order
    const orderId = await ctx.runMutation(api.polar.createOrder, {
      userId: user._id,
      eventId: event._id,
      ticketTypeId: ticketType._id,
      quantity,
      subtotal,
      fees,
      tax,
      totalAmount,
      currency: ticketCurrency,
      polarCheckoutId: args.checkoutId,
    });
    
    console.log(`[processCheckoutWebhook] Created order: ${orderId}, now creating ${quantity} ticket(s)`);
    
    // Create tickets
    const ticketIds: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const ticketId = await ctx.runMutation(api.polar.createTicket, {
        orderId,
        ticketTypeId: ticketType._id,
        holderName: user.name,
        holderEmail: user.email,
        price: ticketPrice,
        section: (ticketType as any).section,
        row: undefined,
        seatNumber: undefined,
      });
      ticketIds.push(ticketId);
      console.log(`[processCheckoutWebhook] Created ticket ${i + 1}/${quantity}: ${ticketId}`);
    }
    
    // Update ticket type availability
    await ctx.runMutation(api.polar.updateTicketTypeAvailability, {
      ticketTypeId: ticketType._id,
      quantitySold: quantity,
    });
    
    console.log(`[processCheckoutWebhook] Successfully created order ${orderId} with ${quantity} ticket(s) [${ticketIds.join(", ")}] for checkout ${args.checkoutId}`);
  },
});

/**
 * Get users by email (helper query)
 */
export const getUsersByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    
    return users;
  },
});

/**
 * Get event by ID (helper query)
 */
export const getEventById = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    return event;
  },
});

/**
 * Get ticket types by event ID (helper query)
 */
export const getTicketTypesByEventId = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const ticketTypes = await ctx.db
      .query("ticketTypes")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return ticketTypes;
  },
});

/**
 * Get recent orders by user and event (for idempotency check)
 */
export const getRecentOrdersByUserAndEvent = query({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    withinMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.withinMinutes * 60 * 1000);
    
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("eventId"), args.eventId),
          q.gte(q.field("createdAt"), cutoffTime)
        )
      )
      .collect();
    
    return orders;
  },
});

/**
 * Create order after successful checkout
 */
export const createOrder = mutation({
  args: {
    userId: v.id("users"),
    eventId: v.id("events"),
    ticketTypeId: v.id("ticketTypes"),
    quantity: v.number(),
    subtotal: v.number(),
    fees: v.number(),
    tax: v.number(),
    totalAmount: v.number(),
    currency: v.string(),
    polarCheckoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      eventId: args.eventId,
      orderNumber: generateOrderNumber(),
      totalAmount: args.totalAmount,
      subtotal: args.subtotal,
      fees: args.fees,
      tax: args.tax,
      currency: args.currency,
      status: "confirmed",
      paymentStatus: "completed",
      paymentMethod: "polar",
      polarCheckoutId: args.polarCheckoutId,
      confirmationEmail: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return orderId;
  },
});

/**
 * Create ticket for an order
 */
export const createTicket = mutation({
  args: {
    orderId: v.id("orders"),
    ticketTypeId: v.id("ticketTypes"),
    holderName: v.optional(v.string()),
    holderEmail: v.optional(v.string()),
    price: v.number(),
    section: v.optional(v.string()),
    row: v.optional(v.string()),
    seatNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate unique QR code
    // Use ticket number + order ID + timestamp to create a unique identifier
    // Since ticket number is already unique, we can create a simple hash-like string
    const ticketNumber = generateTicketNumber();
    const timestamp = Date.now().toString(36);
    const orderIdShort = args.orderId.replace("orders_", "").substring(0, 8);
    // Create a unique QR code by combining ticket number, order ID, and timestamp
    // This ensures uniqueness without requiring crypto
    const qrCode = `${ticketNumber}-${orderIdShort}-${timestamp}`.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 32);

    const ticketId = await ctx.db.insert("tickets", {
      orderId: args.orderId,
      ticketTypeId: args.ticketTypeId,
      ticketNumber,
      qrCode,
      holderName: args.holderName,
      holderEmail: args.holderEmail,
      seatNumber: args.seatNumber,
      section: args.section,
      row: args.row,
      price: args.price,
      status: "valid",
      issuedAt: Date.now(),
    });

    return ticketId;
  },
});

/**
 * Update ticket type availability after purchase
 */
export const updateTicketTypeAvailability = mutation({
  args: {
    ticketTypeId: v.id("ticketTypes"),
    quantitySold: v.number(),
  },
  handler: async (ctx, args) => {
    const ticketType = await ctx.db.get(args.ticketTypeId);
    if (!ticketType) {
      throw new Error("Ticket type not found");
    }

    const newAvailableQuantity = Math.max(0, ticketType.availableQuantity - args.quantitySold);
    
    await ctx.db.patch(args.ticketTypeId, {
      availableQuantity: newAvailableQuantity,
    });
  },
});
