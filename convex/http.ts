import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

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

export default http;