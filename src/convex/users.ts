import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx, MutationCtx } from "./_generated/server";
import { ROLES } from "./schema";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { roleValidator } from "./schema";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx | MutationCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

export const requireAdmin = async (ctx: QueryCtx | MutationCtx) => {
  const user = await getCurrentUser(ctx);
  if (!user || user.role !== ROLES.ADMIN) {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
};

export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("users").collect();
  },
});

export const updateUserRole = mutation({
  args: { id: v.id("users"), role: roleValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { role: args.role });
  },
});

export const updateCurrentUser = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    await ctx.db.patch(user._id, { name: args.name });
  },
});