import { AuthFunctions, createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
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
				await ctx.db.insert("users", {
					name: authUser.name,
					emailVerified: authUser.emailVerified,
					role: "customer",
					authId: authUser._id,
					email: authUser.email ?? "",
				});
			},
			onUpdate: async (ctx, newDoc, oldDoc) => {
				const authId = ctx.db.normalizeId("users",newDoc._id)
				if(!authId) {
					throw new ConvexError("Unknown User?")
				}
				await ctx.db.patch(authId, {
					name: newDoc.name,
					email: newDoc.email,
					emailVerified: newDoc.emailVerified,
					image: newDoc.image || "",
					phone: newDoc.phoneNumber || "",
				});
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
		baseURL: process.env.SITE_URL!,
		database: authComponent.adapter(ctx),
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!
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
		const authUser = await authComponent.getAuthUser(ctx);
		return authUser
	},
});