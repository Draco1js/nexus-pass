import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { ConvexError } from "convex/values";

export type UserRole = "customer" | "artist" | "staff";

/**
 * Get the current authenticated user from the database
 * Returns null if not authenticated (instead of throwing)
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  try {
    console.log("[getCurrentUser] Starting auth check...");
    
    // Check ctx.auth.getUserIdentity() - this is what expectAuth: true checks
    const userIdentity = await ctx.auth.getUserIdentity();
    console.log("[getCurrentUser] ctx.auth.getUserIdentity():", userIdentity ? { tokenIdentifier: userIdentity.tokenIdentifier } : null);
    
    // Also check authComponent.getAuthUser
    const authUser = await authComponent.getAuthUser(ctx);
    console.log("[getCurrentUser] authComponent.getAuthUser():", authUser ? { _id: authUser._id, name: (authUser as any).name } : null);
    
    if (!authUser) {
      console.log("[getCurrentUser] No authUser found from authComponent.getAuthUser");
      return null;
    }

    // Better Auth returns auth user with _id property
    const authId = (authUser as any)._id;
    console.log("[getCurrentUser] Extracted authId:", authId);
    
    if (!authId) {
      console.log("[getCurrentUser] No authId found in authUser");
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", authId))
      .first();

    console.log("[getCurrentUser] Found user:", user ? { _id: user._id, role: user.role } : null);
    return user;
  } catch (error) {
    console.error("[getCurrentUser] Error:", error);
    // Return null if user is not authenticated (instead of throwing)
    return null;
  }
}

/**
 * Require the current user to be authenticated
 * Throws an error if not authenticated
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  console.log("[requireAuth] Checking authentication...");
  const user = await getCurrentUser(ctx);
  if (!user) {
    console.error("[requireAuth] User not authenticated - throwing error");
    throw new ConvexError("Not authenticated");
  }
  console.log("[requireAuth] User authenticated:", { _id: user._id, role: user.role });
  return user;
}

/**
 * Check if the current user has one of the required roles
 * Throws an error if not authorized
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: UserRole[]
): Promise<Doc<"users">> {
  const user = await requireAuth(ctx);
  
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new ConvexError(
      `Access denied. Required roles: ${allowedRoles.join(", ")}`
    );
  }
  
  return user;
}

/**
 * Check if the current user is staff
 */
export async function requireStaff(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  return requireRole(ctx, ["staff"]);
}

/**
 * Check if the current user is an artist or staff
 */
export async function requireArtist(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  return requireRole(ctx, ["artist", "staff"]);
}

/**
 * Get the artist profile linked to the current user
 * Returns null if user is not linked to an artist
 */
export async function getArtistForUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"artists"> | null> {
  const artist = await ctx.db
    .query("artists")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  
  return artist;
}

/**
 * Require the current user to be linked to an artist profile
 */
export async function requireArtistProfile(
  ctx: QueryCtx | MutationCtx
): Promise<{ user: Doc<"users">; artist: Doc<"artists"> }> {
  const user = await requireArtist(ctx);
  const artist = await getArtistForUser(ctx, user._id);
  
  if (!artist) {
    throw new ConvexError("No artist profile linked to this account");
  }
  
  return { user, artist };
}

/**
 * Generate a URL-friendly slug from a string
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NP-${timestamp}-${random}`;
}

/**
 * Generate a unique ticket number
 */
export function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

