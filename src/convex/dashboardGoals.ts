import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

export const getGoals = query({
  args: {},
  handler: async (ctx) => {
    const goals = await ctx.db
      .query("dashboardGoals")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return goals;
  },
});

export const createGoal = mutation({
  args: {
    goalType: v.union(
      v.literal("revenue"),
      v.literal("orders"),
      v.literal("users"),
      v.literal("conversion_rate")
    ),
    targetValue: v.number(),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx);

    const goalId = await ctx.db.insert("dashboardGoals", {
      ...args,
      isActive: true,
      createdBy: identity.subject,
    });

    return goalId;
  },
});

export const updateGoal = mutation({
  args: {
    id: v.id("dashboardGoals"),
    targetValue: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;

    await ctx.db.patch(id, updates);
  },
});

export const deleteGoal = mutation({
  args: {
    id: v.id("dashboardGoals"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
