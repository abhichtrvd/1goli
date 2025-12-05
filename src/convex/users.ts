import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx, MutationCtx } from "./_generated/server";
import { ROLES } from "./schema";

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