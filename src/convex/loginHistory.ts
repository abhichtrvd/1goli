import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";

// ============ QUERIES ============

export const getUserLoginHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const history = await ctx.db
      .query("loginHistory")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);

    return history;
  },
});

export const getFailedLoginAttempts = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.userId) {
      const history = await ctx.db
        .query("loginHistory")
        .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId as any))
        .order("desc")
        .collect();

      return history.filter((h) => !h.success).slice(0, args.limit || 20);
    }

    // Get all failed attempts
    const allHistory = await ctx.db
      .query("loginHistory")
      .withIndex("by_success", (q) => q.eq("success", false))
      .order("desc")
      .take(args.limit || 100);

    return allHistory;
  },
});

export const getRecentLogins = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const logins = await ctx.db
      .query("loginHistory")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit || 50);

    // Enrich with user data
    const enrichedLogins = await Promise.all(
      logins.map(async (login) => {
        const user = await ctx.db.get(login.userId);
        return {
          ...login,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "",
        };
      })
    );

    return enrichedLogins;
  },
});

export const getLoginStats = query({
  args: {
    userId: v.optional(v.id("users")),
    days: v.optional(v.number()), // Last N days
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const cutoffTime = Date.now() - (args.days || 30) * 24 * 60 * 60 * 1000;

    let query = ctx.db.query("loginHistory");

    const history = args.userId
      ? await query
          .withIndex("by_user_timestamp", (q) =>
            q.eq("userId", args.userId as any).gt("timestamp", cutoffTime)
          )
          .collect()
      : await query
          .withIndex("by_timestamp")
          .filter((q) => q.gt(q.field("timestamp"), cutoffTime))
          .collect();

    const totalAttempts = history.length;
    const successfulLogins = history.filter((h) => h.success).length;
    const failedLogins = history.filter((h) => !h.success).length;

    // Group by date
    const loginsByDate: Record<string, { success: number; failed: number }> = {};
    history.forEach((login) => {
      const date = new Date(login.timestamp).toISOString().split("T")[0];
      if (!loginsByDate[date]) {
        loginsByDate[date] = { success: 0, failed: 0 };
      }
      if (login.success) {
        loginsByDate[date].success++;
      } else {
        loginsByDate[date].failed++;
      }
    });

    // Most common IPs
    const ipCounts: Record<string, number> = {};
    history.forEach((login) => {
      if (login.ipAddress) {
        ipCounts[login.ipAddress] = (ipCounts[login.ipAddress] || 0) + 1;
      }
    });

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));

    return {
      totalAttempts,
      successfulLogins,
      failedLogins,
      successRate: totalAttempts > 0 ? (successfulLogins / totalAttempts) * 100 : 0,
      loginsByDate,
      topIPs,
    };
  },
});

// ============ MUTATIONS ============

export const logLogin = mutation({
  args: {
    userId: v.id("users"),
    success: v.boolean(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("loginHistory", {
      userId: args.userId,
      timestamp: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      success: args.success,
      failureReason: args.failureReason,
      location: args.location,
    });

    // Also log as user activity
    if (args.success) {
      await ctx.db.insert("userActivity", {
        userId: args.userId,
        action: "login",
        details: args.location || args.ipAddress || "Unknown location",
        metadata: {
          ipAddress: args.ipAddress,
          userAgent: args.userAgent,
        },
        timestamp: Date.now(),
      });

      // Update user's lastActiveAt
      await ctx.db.patch(args.userId, {
        lastActiveAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const clearLoginHistory = mutation({
  args: {
    userId: v.id("users"),
    olderThan: v.optional(v.number()), // timestamp
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const cutoffTime = args.olderThan || 0;

    const history = await ctx.db
      .query("loginHistory")
      .withIndex("by_user_timestamp", (q) =>
        q.eq("userId", args.userId).lt("timestamp", cutoffTime || Date.now())
      )
      .collect();

    for (const entry of history) {
      await ctx.db.delete(entry._id);
    }

    return { deleted: history.length };
  },
});

export const exportLoginHistory = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const history = await ctx.db
      .query("loginHistory")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const user = await ctx.db.get(args.userId);

    return {
      user: {
        id: args.userId,
        name: user?.name,
        email: user?.email,
      },
      history: history.map((h) => ({
        timestamp: h.timestamp,
        date: new Date(h.timestamp).toISOString(),
        success: h.success,
        ipAddress: h.ipAddress || "N/A",
        userAgent: h.userAgent || "N/A",
        failureReason: h.failureReason || "N/A",
        location: h.location || "N/A",
      })),
    };
  },
});
