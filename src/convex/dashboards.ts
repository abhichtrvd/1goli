import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";

// ============ QUERIES ============

export const getDashboards = query({
  args: {
    includePublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    let dashboards = await ctx.db
      .query("customDashboards")
      .order("desc")
      .collect();

    if (!args.includePublic) {
      // Show user's own dashboards
      dashboards = dashboards.filter((d) => d.createdBy === admin._id);
    } else {
      // Show user's own + public dashboards
      dashboards = dashboards.filter(
        (d) => d.createdBy === admin._id || d.isPublic
      );
    }

    return dashboards;
  },
});

export const getDashboard = query({
  args: { id: v.id("customDashboards") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

// ============ MUTATIONS ============

export const saveDashboard = mutation({
  args: {
    id: v.optional(v.id("customDashboards")),
    name: v.string(),
    description: v.optional(v.string()),
    layout: v.array(
      v.object({
        widgetId: v.string(),
        type: v.union(
          v.literal("metric_card"),
          v.literal("line_chart"),
          v.literal("bar_chart"),
          v.literal("pie_chart"),
          v.literal("table"),
          v.literal("heatmap")
        ),
        dataSource: v.string(),
        config: v.any(),
        position: v.object({
          x: v.number(),
          y: v.number(),
          w: v.number(),
          h: v.number(),
        }),
      })
    ),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (args.id) {
      // Update existing dashboard
      const dashboard = await ctx.db.get(args.id);
      if (!dashboard) throw new Error("Dashboard not found");

      if (dashboard.createdBy !== admin._id) {
        throw new Error("Cannot edit dashboard created by another user");
      }

      await ctx.db.patch(args.id, {
        name: args.name,
        description: args.description,
        layout: args.layout,
        isPublic: args.isPublic ?? dashboard.isPublic,
        updatedAt: Date.now(),
      });

      return { dashboardId: args.id };
    } else {
      // Create new dashboard
      const dashboardId = await ctx.db.insert("customDashboards", {
        name: args.name,
        description: args.description,
        layout: args.layout,
        isPublic: args.isPublic ?? false,
        createdBy: admin._id,
        createdAt: Date.now(),
      });

      return { dashboardId };
    }
  },
});

export const deleteDashboard = mutation({
  args: { id: v.id("customDashboards") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const dashboard = await ctx.db.get(args.id);
    if (!dashboard) throw new Error("Dashboard not found");

    if (dashboard.createdBy !== admin._id) {
      throw new Error("Cannot delete dashboard created by another user");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

export const cloneDashboard = mutation({
  args: {
    id: v.id("customDashboards"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const dashboard = await ctx.db.get(args.id);
    if (!dashboard) throw new Error("Dashboard not found");

    // Create new dashboard with same layout
    const newDashboardId = await ctx.db.insert("customDashboards", {
      name: args.newName,
      description: dashboard.description,
      layout: dashboard.layout,
      isPublic: false, // Cloned dashboards are private by default
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    return { dashboardId: newDashboardId };
  },
});

export const updateDashboardVisibility = mutation({
  args: {
    id: v.id("customDashboards"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const dashboard = await ctx.db.get(args.id);
    if (!dashboard) throw new Error("Dashboard not found");

    if (dashboard.createdBy !== admin._id) {
      throw new Error("Cannot modify dashboard created by another user");
    }

    await ctx.db.patch(args.id, {
      isPublic: args.isPublic,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Widget types and their data sources
export const WIDGET_TYPES = {
  METRIC_CARD: "metric_card",
  LINE_CHART: "line_chart",
  BAR_CHART: "bar_chart",
  PIE_CHART: "pie_chart",
  TABLE: "table",
  HEATMAP: "heatmap",
} as const;

export const DATA_SOURCES = {
  ORDERS: "orders",
  USERS: "users",
  PRODUCTS: "products",
  REVENUE: "revenue",
  CONVERSIONS: "conversions",
  PAGE_VIEWS: "page_views",
  CLICK_EVENTS: "click_events",
  FUNNEL_STATS: "funnel_stats",
  COHORT_RETENTION: "cohort_retention",
  AB_TEST_RESULTS: "ab_test_results",
} as const;

// Default dashboard templates
export const DEFAULT_DASHBOARDS = {
  OVERVIEW: {
    name: "Business Overview",
    description: "High-level metrics for business performance",
    layout: [
      {
        widgetId: "total-revenue",
        type: "metric_card" as const,
        dataSource: "revenue",
        config: {
          metric: "total",
          label: "Total Revenue",
          period: "30d",
        },
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
      {
        widgetId: "total-orders",
        type: "metric_card" as const,
        dataSource: "orders",
        config: {
          metric: "count",
          label: "Total Orders",
          period: "30d",
        },
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
      {
        widgetId: "total-users",
        type: "metric_card" as const,
        dataSource: "users",
        config: {
          metric: "count",
          label: "Total Users",
          period: "30d",
        },
        position: { x: 6, y: 0, w: 3, h: 2 },
      },
      {
        widgetId: "conversion-rate",
        type: "metric_card" as const,
        dataSource: "conversions",
        config: {
          metric: "rate",
          label: "Conversion Rate",
          period: "30d",
        },
        position: { x: 9, y: 0, w: 3, h: 2 },
      },
      {
        widgetId: "revenue-chart",
        type: "line_chart" as const,
        dataSource: "revenue",
        config: {
          title: "Revenue Trend",
          period: "30d",
          interval: "day",
        },
        position: { x: 0, y: 2, w: 6, h: 4 },
      },
      {
        widgetId: "orders-chart",
        type: "bar_chart" as const,
        dataSource: "orders",
        config: {
          title: "Orders by Status",
          groupBy: "status",
        },
        position: { x: 6, y: 2, w: 6, h: 4 },
      },
    ],
  },
  ANALYTICS: {
    name: "User Analytics",
    description: "User behavior and engagement metrics",
    layout: [
      {
        widgetId: "page-views",
        type: "metric_card" as const,
        dataSource: "page_views",
        config: {
          metric: "count",
          label: "Page Views",
          period: "7d",
        },
        position: { x: 0, y: 0, w: 4, h: 2 },
      },
      {
        widgetId: "unique-visitors",
        type: "metric_card" as const,
        dataSource: "page_views",
        config: {
          metric: "unique",
          label: "Unique Visitors",
          period: "7d",
        },
        position: { x: 4, y: 0, w: 4, h: 2 },
      },
      {
        widgetId: "avg-session",
        type: "metric_card" as const,
        dataSource: "page_views",
        config: {
          metric: "avg_duration",
          label: "Avg. Session Duration",
          period: "7d",
        },
        position: { x: 8, y: 0, w: 4, h: 2 },
      },
      {
        widgetId: "click-heatmap",
        type: "heatmap" as const,
        dataSource: "click_events",
        config: {
          page: "/",
          period: "7d",
        },
        position: { x: 0, y: 2, w: 12, h: 6 },
      },
    ],
  },
} as const;
