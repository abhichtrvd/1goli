import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Track user interactions for heatmap
export const trackInteraction = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    page: v.string(),
    element: v.optional(v.string()),
    action: v.union(v.literal("click"), v.literal("hover"), v.literal("scroll")),
    xPosition: v.optional(v.number()),
    yPosition: v.optional(v.number()),
    device: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pageInteractions", {
      userId: args.userId,
      sessionId: args.sessionId,
      page: args.page,
      element: args.element,
      action: args.action,
      xPosition: args.xPosition,
      yPosition: args.yPosition,
      timestamp: Date.now(),
      device: args.device,
      userAgent: args.userAgent,
    });

    return { success: true };
  },
});

// Get aggregated heatmap data for a page
export const getHeatmapData = query({
  args: {
    page: v.string(),
    action: v.optional(v.union(v.literal("click"), v.literal("hover"), v.literal("scroll"))),
    device: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { page, action, device, startDate, endDate } = args;

    // Get all interactions for the page
    let interactions = await ctx.db
      .query("pageInteractions")
      .withIndex("by_page", (q) => q.eq("page", page))
      .collect();

    // Apply filters
    if (action) {
      interactions = interactions.filter((i) => i.action === action);
    }

    if (device) {
      interactions = interactions.filter((i) => i.device === device);
    }

    if (startDate) {
      interactions = interactions.filter((i) => i.timestamp >= startDate);
    }

    if (endDate) {
      interactions = interactions.filter((i) => i.timestamp <= endDate);
    }

    // Aggregate click/hover data by position
    const heatmapPoints: Record<string, { x: number; y: number; count: number }> = {};

    interactions.forEach((interaction) => {
      if (interaction.xPosition !== undefined && interaction.yPosition !== undefined) {
        // Round positions to grid cells (20px grid)
        const gridX = Math.floor(interaction.xPosition / 20) * 20;
        const gridY = Math.floor(interaction.yPosition / 20) * 20;
        const key = `${gridX},${gridY}`;

        if (!heatmapPoints[key]) {
          heatmapPoints[key] = { x: gridX, y: gridY, count: 0 };
        }
        heatmapPoints[key].count++;
      }
    });

    return {
      points: Object.values(heatmapPoints),
      totalInteractions: interactions.length,
    };
  },
});

// Get scroll depth data for a page
export const getScrollDepth = query({
  args: {
    page: v.string(),
    device: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { page, device, startDate, endDate } = args;

    // Get scroll interactions
    let scrolls = await ctx.db
      .query("pageInteractions")
      .withIndex("by_page_action", (q) => q.eq("page", page).eq("action", "scroll"))
      .collect();

    // Apply filters
    if (device) {
      scrolls = scrolls.filter((s) => s.device === device);
    }

    if (startDate) {
      scrolls = scrolls.filter((s) => s.timestamp >= startDate);
    }

    if (endDate) {
      scrolls = scrolls.filter((s) => s.timestamp <= endDate);
    }

    // Group by session and get max scroll depth per session
    const sessionScrolls: Record<string, number> = {};
    scrolls.forEach((scroll) => {
      if (scroll.yPosition !== undefined) {
        if (!sessionScrolls[scroll.sessionId] || scroll.yPosition > sessionScrolls[scroll.sessionId]) {
          sessionScrolls[scroll.sessionId] = scroll.yPosition;
        }
      }
    });

    const depths = Object.values(sessionScrolls);
    const avgDepth = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;

    // Calculate distribution (0-25%, 25-50%, 50-75%, 75-100%)
    const distribution = {
      "0-25": 0,
      "25-50": 0,
      "50-75": 0,
      "75-100": 0,
    };

    depths.forEach((depth) => {
      if (depth <= 25) distribution["0-25"]++;
      else if (depth <= 50) distribution["25-50"]++;
      else if (depth <= 75) distribution["50-75"]++;
      else distribution["75-100"]++;
    });

    return {
      averageDepth: Math.round(avgDepth),
      distribution,
      totalSessions: depths.length,
    };
  },
});

// Get list of pages with interaction data
export const getPages = query({
  args: {},
  handler: async (ctx) => {
    const interactions = await ctx.db.query("pageInteractions").collect();

    // Get unique pages with counts
    const pageMap: Record<string, { page: string; count: number }> = {};

    interactions.forEach((interaction) => {
      if (!pageMap[interaction.page]) {
        pageMap[interaction.page] = { page: interaction.page, count: 0 };
      }
      pageMap[interaction.page].count++;
    });

    return Object.values(pageMap).sort((a, b) => b.count - a.count);
  },
});

// Get device breakdown for a page
export const getDeviceBreakdown = query({
  args: {
    page: v.string(),
  },
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("pageInteractions")
      .withIndex("by_page", (q) => q.eq("page", args.page))
      .collect();

    const deviceCounts: Record<string, number> = {};

    interactions.forEach((interaction) => {
      const device = interaction.device || "Unknown";
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    return Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count,
      percentage: Math.round((count / interactions.length) * 100),
    }));
  },
});
