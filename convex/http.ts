import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { internal, api } from "./_generated/api";
import { polar } from "./polar";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);


// Custom webhook handler for checkout completion events
// Polar component doesn't handle checkout events, so we need a custom route
http.route({
	path: "/polar/checkout-webhook",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
		if (!webhookSecret) {
			console.error("[polar checkout webhook] POLAR_WEBHOOK_SECRET not configured");
			return new Response("Webhook secret not configured", { status: 500 });
		}

		try {
			const rawBody = await request.text();
			// Convert Headers to plain object
			const headers: Record<string, string> = {};
			request.headers.forEach((value, key) => {
				headers[key] = value;
			});
			let event: any;
			try {
				// Try to parse the webhook payload
				const payload = JSON.parse(rawBody);
				event = {
					type: payload.type || "checkout.updated",
					data: payload.data || payload,
				};
			} catch (parseError) {
				console.error("[polar checkout webhook] Failed to parse webhook payload:", parseError);
				throw new Error("Invalid webhook payload");
			}
			
			console.log("[polar checkout webhook] Received event:", event.type);

			// Handle order.paid event (most reliable indicator of successful payment)
			if (event.type === "order.paid") {
				const order = event.data as any;
				console.log("[polar checkout webhook] Processing order.paid event:", order.id);
				
				// Return 200 immediately to acknowledge receipt (Polar waits for this)
				// Process asynchronously using scheduler to avoid blocking
				const checkoutId = order.checkout_id || order.checkout?.id || order.checkout_id;
				const customerId = order.customer_id || order.customer?.id || order.customer_id;
				const productId = order.product_id || 
					(order.items && order.items.length > 0 && order.items[0].product_id) ||
					order.product?.id;
				
				console.log("[polar checkout webhook] Extracted:", { checkoutId, customerId, productId });
				
				if (!checkoutId || !customerId) {
					console.warn("[polar checkout webhook] Missing checkout_id or customer_id in order.paid event");
					return new Response("Accepted", { status: 200 });
				}
				
				// Schedule async processing - await it to ensure it's scheduled, but return quickly
				await ctx.scheduler.runAfter(0, api.polar.processCheckoutWebhook, {
					checkoutId: checkoutId,
					customerId: customerId,
					productId: productId,
					status: "paid",
				});
				
				console.log("[polar checkout webhook] Scheduled async processing for order.paid:", order.id);
				return new Response("Accepted", { status: 200 });
			}
			// Handle checkout completion events
			else if (event.type === "checkout.updated" || event.type === "checkout.completed") {
				const checkout = event.data as any;
				
				// Process succeeded, completed, or paid checkouts
				// Polar uses "succeeded" status for successful checkouts
				if (checkout.status === "completed" || checkout.status === "paid" || checkout.status === "succeeded") {
					console.log("[polar checkout webhook] Processing completed checkout:", checkout.id);
					
					// Return 200 immediately and process asynchronously
					// Only process checkout.updated if we haven't already processed order.paid for this checkout
					// Check if order already exists to avoid duplicate processing
					const existingOrders = await ctx.runQuery(api.polar.getOrderByCheckoutId, {
						checkoutId: checkout.id,
					});
					
					if (existingOrders && existingOrders.length > 0) {
						console.log(`[polar checkout webhook] Order already exists for checkout ${checkout.id}, skipping checkout.updated processing`);
						return new Response("Accepted", { status: 200 });
					}
					
					await ctx.scheduler.runAfter(0, api.polar.processCheckoutWebhook, {
						checkoutId: checkout.id,
						customerId: checkout.customer_id || checkout.customer?.id,
						productId: checkout.product_id || checkout.product?.id,
						status: checkout.status,
					});
					
					console.log("[polar checkout webhook] Scheduled async processing for checkout:", checkout.id);
					return new Response("Accepted", { status: 200 });
				} else {
					console.log(`[polar checkout webhook] Checkout ${checkout.id} not completed, status: ${checkout.status}`);
				}
			} else {
				console.log(`[polar checkout webhook] Unhandled event type: ${event.type}`);
			}

			return new Response("Accepted", { status: 200 });
		} catch (error: any) {
			// Check if it's a webhook verification error
			if (error?.name === "WebhookVerificationError" || error?.message?.includes("webhook")) {
				console.error("[polar checkout webhook] Webhook verification failed:", error);
				return new Response("Invalid webhook signature", { status: 403 });
			}
			console.error("[polar checkout webhook] Error processing webhook:", error);
			return new Response("Error processing webhook", { status: 500 });
		}
	}),
});

// Seed endpoint
http.route({
	path: "/seed",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const body = await request.json();

		if (!body.artists || !Array.isArray(body.artists)) {
			return new Response(JSON.stringify({ error: "Invalid request body" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		try {
			const result = await ctx.runMutation(internal.seedMutation.seedDatabase, {
				artists: body.artists,
			});

			return new Response(
				JSON.stringify({
					success: true,
					message: "Database seeded successfully",
					stats: result,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			console.error("Seed error:", error);
			return new Response(
				JSON.stringify({
					error: "Failed to seed database",
					details: error instanceof Error ? error.message : String(error),
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	}),
});

// Seed reviews endpoint
http.route({
	path: "/api/seed-reviews",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const body = await request.json();

		if (!body.reviews || !Array.isArray(body.reviews)) {
			return new Response(JSON.stringify({ error: "Invalid request body" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		try {
			const result = await ctx.runMutation(internal.seedMutation.seedReviews, {
				reviews: body.reviews,
			});

			return new Response(
				JSON.stringify({
					success: true,
					message: "Reviews seeded successfully",
					stats: result,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			console.error("Seed reviews error:", error);
			return new Response(
				JSON.stringify({
					error: "Failed to seed reviews",
					details: error instanceof Error ? error.message : String(error),
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	}),
});

export default http;