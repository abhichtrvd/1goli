import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";

// ============ QUERIES ============

export const getABTests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let tests = await ctx.db.query("abTests").order("desc").collect();

    if (args.status) {
      tests = tests.filter((t) => t.status === args.status);
    }

    return tests;
  },
});

export const getABTest = query({
  args: { id: v.id("abTests") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getABTestResults = query({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    // Get assignments
    const assignments = await ctx.db
      .query("abTestAssignments")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    const variantACount = assignments.filter((a) => a.variant === "A").length;
    const variantBCount = assignments.filter((a) => a.variant === "B").length;

    // Get conversions
    const conversions = await ctx.db
      .query("abTestConversions")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    const variantAConversions = conversions.filter((c) => c.variant === "A");
    const variantBConversions = conversions.filter((c) => c.variant === "B");

    const variantAConversionRate =
      variantACount > 0
        ? (variantAConversions.length / variantACount) * 100
        : 0;
    const variantBConversionRate =
      variantBCount > 0
        ? (variantBConversions.length / variantBCount) * 100
        : 0;

    // Calculate revenue if applicable
    const variantARevenue = variantAConversions.reduce(
      (sum, c) => sum + (c.value || 0),
      0
    );
    const variantBRevenue = variantBConversions.reduce(
      (sum, c) => sum + (c.value || 0),
      0
    );

    const variantAAvgRevenue =
      variantAConversions.length > 0
        ? variantARevenue / variantAConversions.length
        : 0;
    const variantBAvgRevenue =
      variantBConversions.length > 0
        ? variantBRevenue / variantBConversions.length
        : 0;

    // Simple statistical significance calculation (z-test for proportions)
    const pooledConversionRate =
      (variantAConversions.length + variantBConversions.length) /
      (variantACount + variantBCount);
    const standardError = Math.sqrt(
      pooledConversionRate *
        (1 - pooledConversionRate) *
        (1 / variantACount + 1 / variantBCount)
    );

    const zScore =
      standardError > 0
        ? (variantAConversionRate / 100 - variantBConversionRate / 100) /
          standardError
        : 0;

    const isSignificant = Math.abs(zScore) > 1.96; // 95% confidence level

    return {
      variantA: {
        assignments: variantACount,
        conversions: variantAConversions.length,
        conversionRate: variantAConversionRate.toFixed(2) + "%",
        totalRevenue: variantARevenue,
        avgRevenue: variantAAvgRevenue.toFixed(2),
      },
      variantB: {
        assignments: variantBCount,
        conversions: variantBConversions.length,
        conversionRate: variantBConversionRate.toFixed(2) + "%",
        totalRevenue: variantBRevenue,
        avgRevenue: variantBAvgRevenue.toFixed(2),
      },
      isSignificant,
      zScore: zScore.toFixed(2),
      winner:
        isSignificant
          ? variantAConversionRate > variantBConversionRate
            ? "A"
            : "B"
          : "none",
    };
  },
});

// ============ MUTATIONS ============

export const createABTest = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("pricing"),
      v.literal("layout"),
      v.literal("messaging"),
      v.literal("feature")
    ),
    variantA: v.object({
      name: v.string(),
      config: v.any(),
    }),
    variantB: v.object({
      name: v.string(),
      config: v.any(),
    }),
    trafficSplit: v.number(),
    goalMetric: v.union(
      v.literal("conversion"),
      v.literal("revenue"),
      v.literal("engagement"),
      v.literal("retention")
    ),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const testId = await ctx.db.insert("abTests", {
      name: args.name,
      description: args.description,
      type: args.type,
      status: args.startDate ? "running" : "draft",
      variantA: args.variantA,
      variantB: args.variantB,
      trafficSplit: args.trafficSplit,
      goalMetric: args.goalMetric,
      startDate: args.startDate || Date.now(),
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    return { testId };
  },
});

export const updateABTest = mutation({
  args: {
    id: v.id("abTests"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
    endDate: v.optional(v.number()),
    winner: v.optional(
      v.union(v.literal("A"), v.literal("B"), v.literal("none"))
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const updates: any = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.winner !== undefined) updates.winner = args.winner;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

export const deleteABTest = mutation({
  args: { id: v.id("abTests") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Delete all assignments
    const assignments = await ctx.db
      .query("abTestAssignments")
      .withIndex("by_test", (q) => q.eq("testId", args.id))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    // Delete all conversions
    const conversions = await ctx.db
      .query("abTestConversions")
      .withIndex("by_test", (q) => q.eq("testId", args.id))
      .collect();

    for (const conversion of conversions) {
      await ctx.db.delete(conversion._id);
    }

    // Delete test
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// ============ ACTIONS ============

export const assignVariant = action({
  args: {
    testId: v.id("abTests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user already assigned
    const existing = await ctx.runQuery(
      (api) => api.abTests.getUserAssignment,
      {
        testId: args.testId,
        userId: args.userId,
      }
    );

    if (existing) {
      return { variant: existing.variant };
    }

    // Get test details
    const test = await ctx.runQuery((api) => api.abTests.getABTest, {
      id: args.testId,
    });

    if (!test || test.status !== "running") {
      throw new Error("Test is not running");
    }

    // Assign variant based on traffic split
    const random = Math.random() * 100;
    const variant = random < test.trafficSplit ? "A" : "B";

    // Save assignment
    await ctx.runMutation((api) => api.abTests.saveAssignment, {
      testId: args.testId,
      userId: args.userId,
      variant,
    });

    return { variant };
  },
});

export const getUserAssignment = query({
  args: {
    testId: v.id("abTests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("abTestAssignments")
      .withIndex("by_test_user", (q) =>
        q.eq("testId", args.testId).eq("userId", args.userId)
      )
      .first();

    return assignment;
  },
});

export const saveAssignment = mutation({
  args: {
    testId: v.id("abTests"),
    userId: v.id("users"),
    variant: v.union(v.literal("A"), v.literal("B")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("abTestAssignments", {
      testId: args.testId,
      userId: args.userId,
      variant: args.variant,
      assignedAt: Date.now(),
    });
  },
});

export const trackConversion = mutation({
  args: {
    testId: v.id("abTests"),
    userId: v.id("users"),
    value: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get user's assignment
    const assignment = await ctx.db
      .query("abTestAssignments")
      .withIndex("by_test_user", (q) =>
        q.eq("testId", args.testId).eq("userId", args.userId)
      )
      .first();

    if (!assignment) {
      throw new Error("User not assigned to this test");
    }

    // Record conversion
    await ctx.db.insert("abTestConversions", {
      testId: args.testId,
      userId: args.userId,
      variant: assignment.variant,
      value: args.value,
      convertedAt: Date.now(),
    });

    return { success: true };
  },
});
