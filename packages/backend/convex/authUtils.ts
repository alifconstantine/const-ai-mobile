/**
 * Const AI Mobile — Centralized Authentication & Security Utilities
 * Strictly isolates user data based on Clerk JWT Identity or Convex Auth Session.
 * Eliminates insecure single-tenant database fallbacks.
 */

import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { auth } from "./auth";

export interface AuthenticatedUserResult {
  user: Doc<"users"> | null;
  userId: Id<"users"> | null;
  isVirtualClerkPreview?: boolean;
  virtualProfile?: {
    name: string;
    email?: string;
    username: string;
    avatarUrl?: string;
  };
}

/**
 * Resolves the authenticated user from the request context.
 * Returns null if no valid Clerk JWT or Convex Auth session is present.
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUserResult> {
  // 1. Check Clerk JWT Identity
  const identity = await ctx.auth.getUserIdentity();
  if (identity) {
    const email = identity.email || "";
    if (email) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();

      if (user) {
        return {
          user,
          userId: user._id,
        };
      }
    }

    // Clerk identity exists, but user record hasn't been synced to DB yet
    const name = identity.name || (email ? email.split("@")[0] : "Operator");
    const username =
      (identity.nickname as string) ||
      (email ? email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") : "operator");

    return {
      user: null,
      userId: null,
      isVirtualClerkPreview: true,
      virtualProfile: {
        name,
        email: email || undefined,
        username,
        avatarUrl: identity.pictureUrl,
      },
    };
  }

  // 2. Check Convex Auth Session
  try {
    const userId = await auth.getUserId(ctx);
    if (userId) {
      const user = await ctx.db.get(userId);
      if (user) {
        return {
          user,
          userId: user._id,
        };
      }
    }
  } catch {
    // Convex auth session not found or invalid
  }

  return {
    user: null,
    userId: null,
  };
}

/**
 * Enforces that the caller is authenticated.
 * Throws an Unauthorized error if not authenticated.
 */
export async function requireAuthenticatedUser(
  ctx: MutationCtx | QueryCtx
): Promise<{ user: Doc<"users">; userId: Id<"users"> }> {
  const { user, userId, isVirtualClerkPreview, virtualProfile } =
    await getAuthenticatedUser(ctx);

  if (user && userId) {
    return { user, userId };
  }

  // If user is authenticated via Clerk but record is not yet in DB, auto-initialize
  if (isVirtualClerkPreview && virtualProfile?.email && "insert" in ctx.db) {
    const mutationDb = ctx.db as MutationCtx["db"];
    const now = Date.now();
    const createdUserId = await mutationDb.insert("users", {
      email: virtualProfile.email,
      name: virtualProfile.name,
      username: virtualProfile.username,
      avatarUrl: virtualProfile.avatarUrl,
      subscriptionStatus: "active",
      subscriptionPlan: "yearly",
      subscriptionExpiresAt: now + 365 * 24 * 60 * 60 * 1000,
      creditsBalanceUsd: 50.0,
      createdAt: now,
    });

    const createdUser = await ctx.db.get(createdUserId);
    if (createdUser) {
      return { user: createdUser, userId: createdUserId };
    }
  }

  throw new Error("Unauthorized: Please sign in to perform this action");
}

/**
 * Validates and resolves the target user ID for a query or mutation.
 * Prevents callers from accessing or manipulating data of another user.
 */
export async function resolveTargetUserId(
  ctx: QueryCtx | MutationCtx,
  explicitUserId?: string | Id<"users">
): Promise<Id<"users"> | null> {
  const authResult = await getAuthenticatedUser(ctx);

  if (explicitUserId && typeof explicitUserId === "string") {
    // If authenticated, ensure explicitUserId matches the authenticated user
    if (authResult.userId && authResult.userId === explicitUserId) {
      return authResult.userId;
    }
    // Allow resolving if ID is valid and caller is authenticated
    if (authResult.userId) {
      return authResult.userId;
    }
  }

  return authResult.userId;
}
