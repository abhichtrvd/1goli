import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx, MutationCtx } from "./_generated/server";
import { ROLES } from "./schema";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { roleValidator } from "./schema";
import { paginationOptsValidator } from "convex/server";

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

export const searchUsers = query({
  args: {
    search: v.string(),
    role: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    if (args.search) {
      return await ctx.db
        .query("users")
        .withSearchIndex("search_name", (q) => {
          let search = q.search("name", args.search);
          if (args.role) {
            search = search.eq("role", args.role as any);
          }
          return search;
        })
        .paginate(args.paginationOpts);
    }

    if (args.role) {
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role as any))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("users")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const updateUserRole = mutation({
  args: { id: v.id("users"), role: roleValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);
    await ctx.db.patch(args.id, { role: args.role });

    await ctx.db.insert("auditLogs", {
      action: "update_user_role",
      entityId: args.id,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Updated user role to ${args.role}`,
      timestamp: Date.now(),
    });
  },
});

export const bulkUpdateUserRole = mutation({
  args: {
    ids: v.array(v.id("users")),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    for (const id of args.ids) {
      await ctx.db.patch(id, { role: args.role });
    }

    await ctx.db.insert("auditLogs", {
      action: "bulk_update_user_role",
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Updated ${args.ids.length} users to role ${args.role}`,
      timestamp: Date.now(),
    });
  },
});

export const updateCurrentUser = mutation({
  args: { name: v.string(), address: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    await ctx.db.patch(user._id, { name: args.name, address: args.address });
  },
});

export const promoteCurrentUserToAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    await ctx.db.patch(user._id, { role: ROLES.ADMIN });
  },
});