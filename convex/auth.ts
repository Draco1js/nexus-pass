import { AuthFunctions, createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal, api } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";
import { ConvexError } from "convex/values";

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
	authFunctions,
	triggers: {
		user: {
			onCreate: async (ctx, authUser) => {
				// Create user first (Polar customer creation will happen asynchronously)
				const userId = await ctx.db.insert("users", {
					name: authUser.name,
					emailVerified: authUser.emailVerified,
					role: "customer",
					authId: authUser._id,
					email: authUser.email ?? "",
				});

				// Schedule Polar customer creation asynchronously (non-blocking)
				// This must be done via action since it uses fetch()
				if (authUser.email) {
					try {
						// Schedule the action to run immediately after the mutation completes
						await ctx.scheduler.runAfter(0, api.polar.upsertPolarCustomer, {
							userId,
							email: authUser.email,
							name: authUser.name || "User",
						});
					} catch (error) {
						console.error("[auth.onCreate] Failed to schedule Polar customer creation:", error);
						// Don't throw - auth should succeed even if Polar scheduling fails
					}
				}
			},
			onUpdate: async (ctx, newDoc, oldDoc) => {
				const authId = ctx.db.normalizeId("users",newDoc._id)
				if(!authId) {
					throw new ConvexError("Unknown User?")
				}

				// Get existing user to check for polarCustomerId
				const existingUser = await ctx.db.get(authId);
				const existingPolarCustomerId = existingUser?.polarCustomerId;

				// Update user record first
				await ctx.db.patch(authId, {
					name: newDoc.name,
					email: newDoc.email,
					emailVerified: newDoc.emailVerified,
					image: newDoc.image || "",
					phone: newDoc.phoneNumber || "",
				});

				// Schedule Polar customer update asynchronously if email or name changed (non-blocking)
				if (newDoc.email && (newDoc.email !== oldDoc.email || newDoc.name !== oldDoc.name)) {
					try {
						// Schedule the action to run immediately after the mutation completes
						await ctx.scheduler.runAfter(0, api.polar.upsertPolarCustomer, {
							userId: authId,
							email: newDoc.email,
							name: newDoc.name || "User",
							existingCustomerId: existingPolarCustomerId,
						});
					} catch (error) {
						console.error("[auth.onUpdate] Failed to schedule Polar customer update:", error);
						// Don't throw - user update should succeed even if Polar scheduling fails
					}
				}
			},
			onDelete: async (ctx, doc) => {
				const authId = ctx.db.normalizeId("users",doc._id)
				if(!authId) {
					throw new ConvexError("Unknown User?")
				}
				await ctx.db.patch(authId, { isDeleted: true });
			},
		}
	}
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (
	ctx: GenericCtx<DataModel>,
	{ optionsOnly } = { optionsOnly: false },
) => {
	return betterAuth({
		// disable logging when createAuth is called just to generate options.
		// this is not required, but there's a lot of noise in logs without it.
		logger: {
			disabled: optionsOnly,
		},
		telemetry: {
			enabled: true
		},
		baseURL: process.env.SITE_URL!,
		database: authComponent.adapter(ctx),
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
				prompt: "select_account"
			}
		},
		emailAndPassword: {
			enabled: false,
			requireEmailVerification: false,
		},
		plugins: [
			convex(),
		],
	});
};

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		try {
			const authUser = await authComponent.getAuthUser(ctx);
			return authUser;
		} catch (error) {
			return null;
		}
	},
});

/**
 * Get the current user with their role from the users table
 */
export const getCurrentUserWithRole = query({
	args: {},
	handler: async (ctx) => {
		try {
			const authUser = await authComponent.getAuthUser(ctx);
			if (!authUser) {
				return null;
			}
			
			// Get the user from our users table to get their role
			const user = await ctx.db
				.query("users")
				.withIndex("by_authId", (q) => q.eq("authId", authUser._id))
				.first();
			
			if (!user) {
				return null;
			}
			
			// Check if this user has an associated artist profile
			const artist = await ctx.db
				.query("artists")
				.withIndex("by_userId", (q) => q.eq("userId", user._id))
				.first();
			
			return {
				...authUser,
				userId: user._id,
				role: user.role,
				artistId: artist?._id ?? null,
			};
		} catch (error) {
			return null;
		}
	},
});

/**
 * Get current user with Polar customer ID for Polar integration
 */
export const getCurrentUserForPolar = query({
	args: {},
	handler: async (ctx) => {
		try {
			const authUser = await authComponent.getAuthUser(ctx);
			if (!authUser) {
				return null;
			}
			
			// Get the user from our users table to get their Polar customer ID
			const user = await ctx.db
				.query("users")
				.withIndex("by_authId", (q) => q.eq("authId", authUser._id))
				.first();
			
			if (!user || !user.email) {
				return null;
			}
			
			return {
				_id: user._id,
				email: user.email,
				name: user.name,
				polarCustomerId: user.polarCustomerId,
			};
		} catch (error) {
			return null;
		}
	},
});