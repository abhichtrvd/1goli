import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Create a cohort
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
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get users that match the cohort definition
    let users: any[] = [];

    if (args.definitionType === "signup_date") {
      // Users who signed up between start and end date
      const allUsers = await ctx.db.query("users").collect();
      users = allUsers.filter((user) => {
        const creationTime = user._creationTime;
        return creationTime >= args.startDate && creationTime <= args.endDate;
      });
    } else if (args.definitionType === "first_purchase") {
      // Users who made first purchase between start and end date
      const orders = await ctx.db.query("orders").collect();

      // Group by user and find first order
      const firstOrders: Record<string, number> = {};
      orders.forEach((order) => {
        if (!firstOrders[order.userId] || order._creationTime < firstOrders[order.userId]) {
          firstOrders[order.userId] = order._creationTime;
        }
      });

      // Filter users by first order date
      const userIds = Object.entries(firstOrders)
        .filter(([_, timestamp]) => timestamp >= args.startDate && timestamp <= args.endDate)
        .map(([userId, _]) => userId);

      users = await Promise.all(
        userIds.map(async (userId) => {
          const user = await ctx.db.query("users").collect();
          return user.find((u) => u._id === userId);
        })
      );
      users = users.filter(Boolean);
    }

    const cohortId = await ctx.db.insert("cohorts", {
      name: args.name,
      description: args.description,
      definitionType: args.definitionType,
      startDate: args.startDate,
      endDate: args.endDate,
      userIds: users.map((u) => u._id),
      userCount: users.length,
      createdBy: args.userId,
      createdAt: Date.now(),
    });

    return cohortId;
  },
});

// Get all cohorts
export const getCohorts = query({
  args: {},
  handler: async (ctx) => {
    const cohorts = await ctx.db.query("cohorts").collect();
    return cohorts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get cohort by ID
export const getCohort = query({
  args: { cohortId: v.id("cohorts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cohortId);
  },
});

// Get cohort retention over time
export const getCohortRetention = query({
  args: {
    cohortId: v.id("cohorts"),
    intervalDays: v.optional(v.number()), // 7 for weekly, 30 for monthly
  },
  handler: async (ctx, args) => {
    const cohort = await ctx.db.get(args.cohortId);
    if (!cohort || !cohort.userIds) return null;

    const intervalDays = args.intervalDays || 7; // Default to weekly
    const intervals = 12; // Show 12 intervals

    // Get user activity for cohort members
    const activities = await ctx.db.query("userActivity").collect();
    const cohortUserIds = new Set(cohort.userIds.map((id) => id.toString()));

    const retentionData: { interval: string; retained: number; percentage: number }[] = [];

    for (let i = 0; i <= intervals; i++) {
      const periodStart = cohort.startDate + i * intervalDays * 24 * 60 * 60 * 1000;
      const periodEnd = periodStart + intervalDays * 24 * 60 * 60 * 1000;

      const activeUsers = new Set(
        activities
          .filter(
            (a) =>
              cohortUserIds.has(a.userId.toString()) &&
              a.timestamp >= periodStart &&
              a.timestamp < periodEnd
          )
          .map((a) => a.userId.toString())
      );

      const retainedCount = activeUsers.size;
      const percentage = (cohort.userCount || 0) > 0 ? (retainedCount / (cohort.userCount || 1)) * 100 : 0;

      retentionData.push({
        interval: `Week ${i}`,
        retained: retainedCount,
        percentage: Math.round(percentage * 10) / 10,
      });
    }

    return retentionData;
  },
});

// Get cohort revenue analysis
export const getCohortRevenue = query({
  args: {
    cohortId: v.id("cohorts"),
  },
  handler: async (ctx, args) => {
    const cohort = await ctx.db.get(args.cohortId);
    if (!cohort || !cohort.userIds) return null;

    const cohortUserIds = new Set(cohort.userIds.map((id) => id.toString()));

    // Get orders from cohort members
    const allOrders = await ctx.db.query("orders").collect();
    const cohortOrders = allOrders.filter((order) => cohortUserIds.has(order.userId));

    // Calculate metrics
    const totalRevenue = cohortOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = cohortOrders.length > 0 ? totalRevenue / cohortOrders.length : 0;
    const avgRevenuePerUser = cohort.userCount > 0 ? totalRevenue / cohort.userCount : 0;

    // Group revenue by month
    const monthlyRevenue: Record<string, number> = {};
    cohortOrders.forEach((order) => {
      const date = new Date(order._creationTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.total;
    });

    return {
      totalRevenue,
      avgOrderValue,
      avgRevenuePerUser,
      totalOrders: cohortOrders.length,
      monthlyRevenue: Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  },
});

// Compare multiple cohorts
export const compareCohorts = query({
  args: {
    cohortIds: v.array(v.id("cohorts")),
  },
  handler: async (ctx, args) => {
    const cohorts = await Promise.all(
      args.cohortIds.map((id) => ctx.db.get(id))
    );

    const comparison = await Promise.all(
      cohorts.map(async (cohort) => {
        if (!cohort || !cohort.userIds) return null;

        const cohortUserIds = new Set(cohort.userIds.map((id) => id.toString()));

        // Get orders
        const allOrders = await ctx.db.query("orders").collect();
        const cohortOrders = allOrders.filter((order) => cohortUserIds.has(order.userId));

        const totalRevenue = cohortOrders.reduce((sum, order) => sum + order.total, 0);
        const avgRevenuePerUser = cohort.userCount > 0 ? totalRevenue / cohort.userCount : 0;

        // Get recent activity count (last 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const activities = await ctx.db.query("userActivity").collect();
        const recentActivity = new Set(
          activities
            .filter(
              (a) =>
                cohortUserIds.has(a.userId.toString()) && a.timestamp >= thirtyDaysAgo
            )
            .map((a) => a.userId.toString())
        );

        const retentionRate =
          cohort.userCount > 0 ? (recentActivity.size / cohort.userCount) * 100 : 0;

        return {
          cohortId: cohort._id,
          name: cohort.name,
          userCount: cohort.userCount,
          totalRevenue,
          avgRevenuePerUser,
          retentionRate,
          startDate: cohort.startDate,
        };
      })
    );

    return comparison.filter(Boolean);
  },
});

// Delete cohort
export const deleteCohort = mutation({
  args: { cohortId: v.id("cohorts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cohortId);
    return { success: true };
  },
});

// Get cohort users
export const getCohortUsers = query({
  args: {
    cohortId: v.id("cohorts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cohort = await ctx.db.get(args.cohortId);
    if (!cohort || !cohort.userIds) return [];

    const limit = args.limit || 50;
    const userIds = cohort.userIds.slice(0, limit);

    const users = await Promise.all(
      userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        // Get user's order count and total spent
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          orderCount: orders.length,
          totalSpent,
          lastActiveAt: user.lastActiveAt,
        };
      })
    );

    return users.filter(Boolean);
  },
});
