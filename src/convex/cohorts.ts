import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";

// ============ QUERIES ============

export const getCohorts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const cohorts = await ctx.db.query("cohorts").order("desc").collect();

    return cohorts;
  },
});

export const getCohort = query({
  args: { id: v.id("cohorts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getCohortRetention = query({
  args: {
    cohortId: v.id("cohorts"),
    periods: v.optional(v.number()), // Number of periods to analyze (default 12)
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const cohort = await ctx.db.get(args.cohortId);
    if (!cohort) throw new Error("Cohort not found");

    const periods = args.periods || 12;
    const periodMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Get users in cohort
    let userIds: Id<"users">[] = [];

    if (cohort.userIds) {
      userIds = cohort.userIds;
    } else {
      // Build cohort based on definition
      const users = await ctx.db.query("users").collect();

      if (cohort.definitionType === "signup_date") {
        userIds = users
          .filter(
            (u) =>
              u._creationTime >= cohort.startDate &&
              u._creationTime <= cohort.endDate
          )
          .map((u) => u._id);
      }
    }

    // Calculate retention for each period
    const retention: Array<{ period: number; retained: number; rate: number }> =
      [];

    for (let period = 0; period < periods; period++) {
      const periodStart = cohort.startDate + period * periodMs;
      const periodEnd = periodStart + periodMs;

      // Count users active in this period
      const activeUsers = await Promise.all(
        userIds.map(async (userId) => {
          const activities = await ctx.db
            .query("userActivity")
            .withIndex("by_user_timestamp", (q) =>
              q.eq("userId", userId).gte("timestamp", periodStart)
            )
            .filter((q) => q.lte(q.field("timestamp"), periodEnd))
            .first();

          return activities ? userId : null;
        })
      );

      const retained = activeUsers.filter((u) => u !== null).length;
      const rate = userIds.length > 0 ? (retained / userIds.length) * 100 : 0;

      retention.push({
        period,
        retained,
        rate: parseFloat(rate.toFixed(2)),
      });
    }

    return {
      cohortName: cohort.name,
      totalUsers: userIds.length,
      retention,
    };
  },
});

export const getCohortRevenue = query({
  args: {
    cohortId: v.id("cohorts"),
    periods: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const cohort = await ctx.db.get(args.cohortId);
    if (!cohort) throw new Error("Cohort not found");

    const periods = args.periods || 12;
    const periodMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Get users in cohort
    let userIds: Id<"users">[] = [];

    if (cohort.userIds) {
      userIds = cohort.userIds;
    } else {
      const users = await ctx.db.query("users").collect();

      if (cohort.definitionType === "signup_date") {
        userIds = users
          .filter(
            (u) =>
              u._creationTime >= cohort.startDate &&
              u._creationTime <= cohort.endDate
          )
          .map((u) => u._id);
      }
    }

    // Calculate revenue for each period
    const revenue: Array<{
      period: number;
      revenue: number;
      avgPerUser: number;
    }> = [];

    for (let period = 0; period < periods; period++) {
      const periodStart = cohort.startDate + period * periodMs;
      const periodEnd = periodStart + periodMs;

      // Get all orders for cohort users in this period
      let totalRevenue = 0;

      for (const userId of userIds) {
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();

        const periodOrders = orders.filter(
          (o) =>
            o._creationTime >= periodStart && o._creationTime <= periodEnd
        );

        totalRevenue += periodOrders.reduce((sum, o) => sum + o.total, 0);
      }

      const avgPerUser = userIds.length > 0 ? totalRevenue / userIds.length : 0;

      revenue.push({
        period,
        revenue: totalRevenue,
        avgPerUser: parseFloat(avgPerUser.toFixed(2)),
      });
    }

    return {
      cohortName: cohort.name,
      totalUsers: userIds.length,
      revenue,
    };
  },
});

export const getCohortBehavior = query({
  args: { cohortId: v.id("cohorts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const cohort = await ctx.db.get(args.cohortId);
    if (!cohort) throw new Error("Cohort not found");

    // Get users in cohort
    let userIds: Id<"users">[] = [];

    if (cohort.userIds) {
      userIds = cohort.userIds;
    } else {
      const users = await ctx.db.query("users").collect();

      if (cohort.definitionType === "signup_date") {
        userIds = users
          .filter(
            (u) =>
              u._creationTime >= cohort.startDate &&
              u._creationTime <= cohort.endDate
          )
          .map((u) => u._id);
      }
    }

    // Analyze behavior patterns
    const actionCounts: Record<string, number> = {};
    let totalOrders = 0;
    let totalRevenue = 0;

    for (const userId of userIds) {
      // Get activities
      const activities = await ctx.db
        .query("userActivity")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      for (const activity of activities) {
        actionCounts[activity.action] =
          (actionCounts[activity.action] || 0) + 1;
      }

      // Get orders
      const orders = await ctx.db
        .query("orders")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      totalOrders += orders.length;
      totalRevenue += orders.reduce((sum, o) => sum + o.total, 0);
    }

    const avgOrdersPerUser =
      userIds.length > 0 ? totalOrders / userIds.length : 0;
    const avgRevenuePerUser =
      userIds.length > 0 ? totalRevenue / userIds.length : 0;

    return {
      cohortName: cohort.name,
      totalUsers: userIds.length,
      topActions: Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count })),
      totalOrders,
      avgOrdersPerUser: avgOrdersPerUser.toFixed(2),
      totalRevenue,
      avgRevenuePerUser: avgRevenuePerUser.toFixed(2),
    };
  },
});

// ============ MUTATIONS ============

export const createCohort = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    definitionType: v.union(
      v.literal("signup_date"),
      v.literal("first_purchase"),
      v.literal("location"),
      v.literal("custom")
    ),
    startDate: v.number(),
    endDate: v.number(),
    customUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // Calculate user count
    let userIds: Id<"users">[] = [];

    if (args.definitionType === "custom" && args.customUserIds) {
      userIds = args.customUserIds;
    } else if (args.definitionType === "signup_date") {
      const users = await ctx.db.query("users").collect();
      userIds = users
        .filter(
          (u) =>
            u._creationTime >= args.startDate &&
            u._creationTime <= args.endDate
        )
        .map((u) => u._id);
    }

    const cohortId = await ctx.db.insert("cohorts", {
      name: args.name,
      description: args.description,
      definitionType: args.definitionType,
      startDate: args.startDate,
      endDate: args.endDate,
      userIds: args.definitionType === "custom" ? userIds : undefined,
      userCount: userIds.length,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    return { cohortId, userCount: userIds.length };
  },
});

export const deleteCohort = mutation({
  args: { id: v.id("cohorts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
