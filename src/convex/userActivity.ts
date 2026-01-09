import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";

// ============ QUERIES ============

export const getUserActivity = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    filter: v.optional(v.string()), // "24h", "7d", "30d", "all"
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let cutoffTime = 0;
    const now = Date.now();

    switch (args.filter) {
      case "24h":
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case "7d":
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        cutoffTime = 0;
    }

    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_user_timestamp", (q) =>
        q.eq("userId", args.userId).gt("timestamp", cutoffTime)
      )
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

export const getAllRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit || 100);

    // Enrich with user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        return {
          ...activity,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "",
        };
      })
    );

    return enrichedActivities;
  },
});

export const getActivityByAction = query({
  args: {
    action: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_action", (q) => q.eq("action", args.action))
      .order("desc")
      .take(args.limit || 50);

    return activities;
  },
});

// ============ MUTATIONS ============

export const logActivity = mutation({
  args: {
    userId: v.id("users"),
    action: v.string(),
    details: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        orderId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // This can be called by any authenticated user for their own actions
    // or by admin for any user

    await ctx.db.insert("userActivity", {
      userId: args.userId,
      action: args.action,
      details: args.details,
      metadata: args.metadata,
      timestamp: Date.now(),
    });

    // Update user's lastActiveAt
    await ctx.db.patch(args.userId, {
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});

export const bulkLogActivity = mutation({
  args: {
    activities: v.array(
      v.object({
        userId: v.id("users"),
        action: v.string(),
        details: v.optional(v.string()),
        metadata: v.optional(
          v.object({
            ipAddress: v.optional(v.string()),
            userAgent: v.optional(v.string()),
            orderId: v.optional(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const timestamp = Date.now();
    for (const activity of args.activities) {
      await ctx.db.insert("userActivity", {
        ...activity,
        timestamp,
      });
    }

    return { success: true, count: args.activities.length };
  },
});

export const clearUserActivity = mutation({
  args: {
    userId: v.id("users"),
    olderThan: v.optional(v.number()), // timestamp
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const cutoffTime = args.olderThan || 0;

    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_user_timestamp", (q) =>
        q.eq("userId", args.userId).lt("timestamp", cutoffTime || Date.now())
      )
      .collect();

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    return { deleted: activities.length };
  },
});

// Predefined activity action types for consistency
export const ACTIVITY_ACTIONS = {
  LOGIN: "login",
  LOGOUT: "logout",
  ORDER_PLACED: "order_placed",
  PROFILE_UPDATED: "profile_updated",
  PASSWORD_CHANGED: "password_changed",
  PASSWORD_RESET_REQUESTED: "password_reset_requested",
  EMAIL_VERIFIED: "email_verified",
  ADDRESS_UPDATED: "address_updated",
  CART_UPDATED: "cart_updated",
  REVIEW_POSTED: "review_posted",
  PRESCRIPTION_UPLOADED: "prescription_uploaded",
  CONSULTATION_BOOKED: "consultation_booked",
  ACCOUNT_SUSPENDED: "account_suspended",
  ACCOUNT_ACTIVATED: "account_activated",
} as const;
