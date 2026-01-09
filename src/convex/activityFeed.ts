import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";

// ============ QUERIES ============

export const getActivityFeed = query({
  args: {
    entityType: v.optional(
      v.union(
        v.literal("order"),
        v.literal("user"),
        v.literal("product"),
        v.literal("prescription"),
        v.literal("review"),
        v.literal("campaign"),
        v.literal("system")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit || 50;

    let query = ctx.db.query("activityFeed").withIndex("by_timestamp").order("desc");

    if (args.entityType) {
      query = ctx.db
        .query("activityFeed")
        .withIndex("by_entity_type_timestamp", (q) =>
          q.eq("entityType", args.entityType!)
        )
        .order("desc");
    }

    const activities = await query.take(limit);

    // Enrich with user details
    const enriched = await Promise.all(
      activities.map(async (activity) => {
        let performerName = "System";
        let performerEmail: string | undefined = undefined;

        if (activity.performedBy !== "system") {
          try {
            const user = await ctx.db.get(activity.performedBy as any);
            if (user && "name" in user && "email" in user) {
              performerName = (user.name as string) || "Unknown User";
              performerEmail = user.email as string | undefined;
            }
          } catch {
            performerName = "Unknown User";
          }
        }

        return {
          ...activity,
          performedByName: performerName,
          performedByEmail: performerEmail,
        };
      })
    );

    return enriched;
  },
});

export const getEntityActivity = query({
  args: {
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit || 20;

    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_entity_id", (q) => q.eq("entityId", args.entityId))
      .order("desc")
      .take(limit);

    // Enrich with user details
    const enriched = await Promise.all(
      activities.map(async (activity) => {
        let performerName = "System";
        let performerEmail: string | undefined = undefined;

        if (activity.performedBy !== "system") {
          try {
            const user = await ctx.db.get(activity.performedBy as any);
            if (user && "name" in user && "email" in user) {
              performerName = (user.name as string) || "Unknown User";
              performerEmail = user.email as string | undefined;
            }
          } catch {
            performerName = "Unknown User";
          }
        }

        return {
          ...activity,
          performedByName: performerName,
          performedByEmail: performerEmail,
        };
      })
    );

    return enriched;
  },
});

export const searchActivityFeed = query({
  args: {
    searchTerm: v.string(),
    entityType: v.optional(
      v.union(
        v.literal("order"),
        v.literal("user"),
        v.literal("product"),
        v.literal("prescription"),
        v.literal("review"),
        v.literal("campaign"),
        v.literal("system")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let activities = await ctx.db.query("activityFeed").order("desc").collect();

    // Filter by entity type
    if (args.entityType) {
      activities = activities.filter((a) => a.entityType === args.entityType);
    }

    // Filter by date range
    if (args.startDate) {
      activities = activities.filter((a) => a.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      activities = activities.filter((a) => a.timestamp <= args.endDate!);
    }

    // Filter by search term
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      activities = activities.filter(
        (a) =>
          a.description.toLowerCase().includes(searchLower) ||
          a.action.toLowerCase().includes(searchLower) ||
          (a.entityId && a.entityId.toLowerCase().includes(searchLower))
      );
    }

    // Enrich with user details
    const enriched = await Promise.all(
      activities.slice(0, 100).map(async (activity) => {
        let performerName = "System";
        let performerEmail = undefined;

        if (activity.performedBy !== "system") {
          const user = await ctx.db.get(activity.performedBy as any);
          if (user) {
            performerName = user.name || "Unknown User";
            performerEmail = user.email;
          }
        }

        return {
          ...activity,
          performedByName: performerName,
          performedByEmail: performerEmail,
        };
      })
    );

    return enriched;
  },
});

export const getActivityStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const days = args.days || 7;
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), startDate))
      .collect();

    // Count by entity type
    const countsByType: Record<string, number> = {};
    activities.forEach((a) => {
      countsByType[a.entityType] = (countsByType[a.entityType] || 0) + 1;
    });

    // Count by action
    const countsByAction: Record<string, number> = {};
    activities.forEach((a) => {
      countsByAction[a.action] = (countsByAction[a.action] || 0) + 1;
    });

    // Count by performer
    const countsByPerformer: Record<string, number> = {};
    activities.forEach((a) => {
      countsByPerformer[a.performedBy] = (countsByPerformer[a.performedBy] || 0) + 1;
    });

    return {
      total: activities.length,
      byType: countsByType,
      byAction: countsByAction,
      byPerformer: countsByPerformer,
      period: `Last ${days} days`,
    };
  },
});

// ============ MUTATIONS ============

export const logActivity = mutation({
  args: {
    entityType: v.union(
      v.literal("order"),
      v.literal("user"),
      v.literal("product"),
      v.literal("prescription"),
      v.literal("review"),
      v.literal("campaign"),
      v.literal("system")
    ),
    entityId: v.optional(v.string()),
    action: v.string(),
    description: v.string(),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const performedBy = args.performedBy || identity?.subject || "system";

    let performedByName = args.performedByName;
    if (!performedByName && identity) {
      const user = await ctx.db.get(identity.subject as any);
      performedByName = user?.name || "Unknown User";
    }

    await ctx.db.insert("activityFeed", {
      entityType: args.entityType,
      entityId: args.entityId,
      action: args.action,
      description: args.description,
      performedBy,
      performedByName,
      metadata: args.metadata,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const deleteActivity = mutation({
  args: {
    activityId: v.id("activityFeed"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.delete(args.activityId);

    return { success: true };
  },
});

export const clearOldActivities = mutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const cutoffDate = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const oldActivities = await ctx.db
      .query("activityFeed")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    let deletedCount = 0;
    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

// Helper function to create formatted activity descriptions
export const formatActivityDescription = (
  action: string,
  entityType: string,
  details?: Record<string, any>
): string => {
  const actionMap: Record<string, string> = {
    created: "created",
    updated: "updated",
    deleted: "deleted",
    status_changed: "changed status of",
    approved: "approved",
    rejected: "rejected",
    assigned: "assigned",
    completed: "completed",
    cancelled: "cancelled",
    refunded: "refunded",
    shipped: "shipped",
    delivered: "delivered",
  };

  const entityMap: Record<string, string> = {
    order: "order",
    user: "user",
    product: "product",
    prescription: "prescription",
    review: "review",
    campaign: "campaign",
    system: "system setting",
  };

  const actionText = actionMap[action] || action;
  const entityText = entityMap[entityType] || entityType;

  let description = `${actionText} ${entityText}`;

  if (details) {
    if (details.name) description += ` "${details.name}"`;
    if (details.id) description += ` (ID: ${details.id})`;
    if (details.from && details.to)
      description += ` from "${details.from}" to "${details.to}"`;
  }

  return description;
};
