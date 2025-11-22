import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

/**
 * Create a new review for an artist
 */
export const createReview = mutation({
	args: {
		artistId: v.id("artists"),
		rating: v.number(),
		title: v.optional(v.string()),
		comment: v.string(),
		venueName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await ctx.auth.getUserIdentity()
		if (!authUser) {
			throw new Error("Not authenticated");
		}

		// better-auth returns user with 'id' field
		const authId = authUser.subject;
		if (!authId) {
			console.error("AuthUser structure:", authUser);
			throw new Error("User ID not found in auth user");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", authId))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		const now = Date.now();

		const reviewId = await ctx.db.insert("reviews", {
			userId: user._id,
			artistId: args.artistId,
			eventId: undefined,
			rating: args.rating,
			title: args.title,
			comment: args.comment,
			venueName: args.venueName,
			isVerifiedPurchase: false,
			helpful: 0,
			createdAt: now,
			updatedAt: now,
		});

		return reviewId;
	},
});

/**
 * Delete a review (users can only delete their own reviews)
 */
export const deleteReview = mutation({
	args: {
		reviewId: v.id("reviews"),
	},
	handler: async (ctx, args) => {
		const authUser = await authComponent.getAuthUser(ctx);
		if (!authUser) {
			throw new Error("Not authenticated");
		}

		// better-auth returns user with 'id' field
		const authId = (authUser as any).id || (authUser as any).userId;
		if (!authId) {
			throw new Error("User ID not found in auth user");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", authId))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		// Get the review
		const review = await ctx.db.get(args.reviewId);
		if (!review) {
			throw new Error("Review not found");
		}

		// Check if the user owns this review
		if (review.userId !== user._id) {
			throw new Error("You can only delete your own reviews");
		}

		// Delete the review
		await ctx.db.delete(args.reviewId);
		return { success: true };
	},
});

