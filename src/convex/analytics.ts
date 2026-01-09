import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";

// ============ CLICK TRACKING ============

export const trackClick = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    page: v.string(),
    elementId: v.optional(v.string()),
    elementClass: v.optional(v.string()),
    x: v.number(),
    y: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("clickEvents", {
      userId: args.userId,
      sessionId: args.sessionId,
      page: args.page,
      elementId: args.elementId,
      elementClass: args.elementClass,
      x: args.x,
      y: args.y,
      timestamp: Date.now(),
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
    });

    return { success: true };
  },
});

export const getClickHeatmap = query({
  args: {
    page: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let clicks = await ctx.db
      .query("clickEvents")
      .withIndex("by_page", (q) => q.eq("page", args.page))
      .collect();

    // Filter by date range if provided
    if (args.startDate) {
      clicks = clicks.filter((c) => c.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      clicks = clicks.filter((c) => c.timestamp <= args.endDate!);
    }

    // Group clicks into grid cells for heatmap visualization
    const gridSize = 20; // pixels
    const heatmapData: Record<string, number> = {};

    for (const click of clicks) {
      const gridX = Math.floor(click.x / gridSize);
      const gridY = Math.floor(click.y / gridSize);
      const key = `${gridX},${gridY}`;
      heatmapData[key] = (heatmapData[key] || 0) + 1;
    }

    return {
      totalClicks: clicks.length,
      heatmapData,
      gridSize,
    };
  },
});

// ============ SCROLL TRACKING ============

export const trackScroll = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    page: v.string(),
    maxDepth: v.number(),
  },
  handler: async (ctx, args) => {
    // Update or insert scroll event
    const existing = await ctx.db
      .query("scrollEvents")
      .withIndex("by_page", (q) => q.eq("page", args.page))
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();

    if (existing && existing.maxDepth < args.maxDepth) {
      await ctx.db.patch(existing._id, {
        maxDepth: args.maxDepth,
        timestamp: Date.now(),
      });
    } else if (!existing) {
      await ctx.db.insert("scrollEvents", {
        userId: args.userId,
        sessionId: args.sessionId,
        page: args.page,
        maxDepth: args.maxDepth,
        timestamp: Date.now(),
      });
    }

    return { success: true };
  },
});

export const getScrollDepth = query({
  args: {
    page: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let scrollEvents = await ctx.db
      .query("scrollEvents")
      .withIndex("by_page", (q) => q.eq("page", args.page))
      .collect();

    // Filter by date range if provided
    if (args.startDate) {
      scrollEvents = scrollEvents.filter((e) => e.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      scrollEvents = scrollEvents.filter((e) => e.timestamp <= args.endDate!);
    }

    // Calculate statistics
    const depths = scrollEvents.map((e) => e.maxDepth);
    const avgDepth =
      depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;

    // Distribution buckets
    const buckets = {
      "0-25%": 0,
      "25-50%": 0,
      "50-75%": 0,
      "75-100%": 0,
    };

    for (const depth of depths) {
      if (depth < 25) buckets["0-25%"]++;
      else if (depth < 50) buckets["25-50%"]++;
      else if (depth < 75) buckets["50-75%"]++;
      else buckets["75-100%"]++;
    }

    return {
      totalSessions: scrollEvents.length,
      avgDepth: avgDepth.toFixed(2),
      distribution: buckets,
    };
  },
});

// ============ PAGE VIEWS ============

export const trackPageView = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    page: v.string(),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use existing userActivity table
    await ctx.db.insert("userActivity", {
      userId: args.userId!,
      action: "page_view",
      details: args.page,
      metadata: {
        userAgent: args.userAgent,
      },
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const getPageViews = query({
  args: {
    page: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let activities = await ctx.db
      .query("userActivity")
      .withIndex("by_action", (q) => q.eq("action", "page_view"))
      .collect();

    // Filter by page if provided
    if (args.page) {
      activities = activities.filter((a) => a.details === args.page);
    }

    // Filter by date range
    if (args.startDate) {
      activities = activities.filter((a) => a.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      activities = activities.filter((a) => a.timestamp <= args.endDate!);
    }

    // Group by page
    const pageViews: Record<string, number> = {};
    for (const activity of activities) {
      const page = activity.details || "unknown";
      pageViews[page] = (pageViews[page] || 0) + 1;
    }

    return {
      totalViews: activities.length,
      byPage: pageViews,
    };
  },
});

// ============ ANALYTICS DASHBOARD ============

export const getAnalyticsSummary = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Get all relevant data within date range
    const [clicks, scrolls, pageViews] = await Promise.all([
      ctx.db
        .query("clickEvents")
        .withIndex("by_timestamp")
        .filter(
          (q) =>
            q.gte(q.field("timestamp"), args.startDate) &&
            q.lte(q.field("timestamp"), args.endDate)
        )
        .collect(),
      ctx.db
        .query("scrollEvents")
        .withIndex("by_timestamp")
        .filter(
          (q) =>
            q.gte(q.field("timestamp"), args.startDate) &&
            q.lte(q.field("timestamp"), args.endDate)
        )
        .collect(),
      ctx.db
        .query("userActivity")
        .withIndex("by_action", (q) => q.eq("action", "page_view"))
        .filter(
          (q) =>
            q.gte(q.field("timestamp"), args.startDate) &&
            q.lte(q.field("timestamp"), args.endDate)
        )
        .collect(),
    ]);

    // Calculate unique sessions
    const uniqueSessions = new Set([
      ...clicks.map((c) => c.sessionId),
      ...scrolls.map((s) => s.sessionId),
    ]);

    // Top pages by clicks
    const pageClicks: Record<string, number> = {};
    for (const click of clicks) {
      pageClicks[click.page] = (pageClicks[click.page] || 0) + 1;
    }

    const topPages = Object.entries(pageClicks)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    return {
      totalClicks: clicks.length,
      totalPageViews: pageViews.length,
      uniqueSessions: uniqueSessions.size,
      topPages,
    };
  },
});
