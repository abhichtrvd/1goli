import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Create a new A/B test
export const createTest = mutation({
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
    trafficSplit: v.number(), // % for variant A
    goalMetric: v.union(
      v.literal("conversion"),
      v.literal("revenue"),
      v.literal("engagement"),
      v.literal("retention")
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const testId = await ctx.db.insert("abTests", {
      name: args.name,
      description: args.description,
      type: args.type,
      status: "draft",
      variantA: args.variantA,
      variantB: args.variantB,
      trafficSplit: args.trafficSplit,
      goalMetric: args.goalMetric,
      startDate: args.startDate,
      endDate: args.endDate,
      winner: undefined,
      createdBy: args.userId,
      createdAt: Date.now(),
    });

    return testId;
  },
});

// Get all A/B tests
export const getTests = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("archived")
    )),
  },
  handler: async (ctx, args) => {
    let tests = await ctx.db.query("abTests").collect();

    if (args.status) {
      tests = tests.filter((test) => test.status === args.status);
    }

    return tests.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get active tests
export const getActiveTests = query({
  args: {},
  handler: async (ctx) => {
    const tests = await ctx.db
      .query("abTests")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();

    return tests;
  },
});

// Get test by ID with results
export const getTest = query({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) return null;

    // Get assignments
    const assignments = await ctx.db
      .query("abTestAssignments")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    // Get conversions
    const conversions = await ctx.db
      .query("abTestConversions")
      .withIndex("by_test", (q) => q.eq("testId", args.testId))
      .collect();

    // Calculate stats
    const variantAAssignments = assignments.filter((a) => a.variant === "A").length;
    const variantBAssignments = assignments.filter((a) => a.variant === "B").length;

    const variantAConversions = conversions.filter((c) => c.variant === "A");
    const variantBConversions = conversions.filter((c) => c.variant === "B");

    const variantAConversionRate = variantAAssignments > 0
      ? (variantAConversions.length / variantAAssignments) * 100
      : 0;

    const variantBConversionRate = variantBAssignments > 0
      ? (variantBConversions.length / variantBAssignments) * 100
      : 0;

    // Calculate revenue if applicable
    const variantARevenue = variantAConversions.reduce((sum, c) => sum + (c.value || 0), 0);
    const variantBRevenue = variantBConversions.reduce((sum, c) => sum + (c.value || 0), 0);

    // Simple statistical significance check (Z-test)
    const pooledRate = (variantAConversions.length + variantBConversions.length) /
                       (variantAAssignments + variantBAssignments);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) *
                        (1 / variantAAssignments + 1 / variantBAssignments));
    const zScore = Math.abs((variantAConversionRate / 100 - variantBConversionRate / 100) / se);
    const isSignificant = zScore > 1.96; // 95% confidence

    return {
      test,
      stats: {
        variantA: {
          assignments: variantAAssignments,
          conversions: variantAConversions.length,
          conversionRate: variantAConversionRate,
          revenue: variantARevenue,
        },
        variantB: {
          assignments: variantBAssignments,
          conversions: variantBConversions.length,
          conversionRate: variantBConversionRate,
          revenue: variantBRevenue,
        },
        isSignificant,
        zScore,
        sampleSize: variantAAssignments + variantBAssignments,
      },
    };
  },
});

// Start a test
export const startTest = mutation({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.testId, {
      status: "running",
      startDate: Date.now(),
    });

    return { success: true };
  },
});

// Track variant view/assignment
export const trackVariantView = mutation({
  args: {
    testId: v.id("abTests"),
    userId: v.id("users"),
    variant: v.union(v.literal("A"), v.literal("B")),
  },
  handler: async (ctx, args) => {
    // Check if user already assigned
    const existing = await ctx.db
      .query("abTestAssignments")
      .withIndex("by_test_user", (q) =>
        q.eq("testId", args.testId).eq("userId", args.userId)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("abTestAssignments", {
        testId: args.testId,
        userId: args.userId,
        variant: args.variant,
        assignedAt: Date.now(),
      });
    }

    return { variant: existing?.variant || args.variant };
  },
});

// Track conversion
export const trackConversion = mutation({
  args: {
    testId: v.id("abTests"),
    userId: v.id("users"),
    variant: v.union(v.literal("A"), v.literal("B")),
    value: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("abTestConversions", {
      testId: args.testId,
      userId: args.userId,
      variant: args.variant,
      value: args.value,
      convertedAt: Date.now(),
    });

    return { success: true };
  },
});

// Declare winner and end test
export const declareWinner = mutation({
  args: {
    testId: v.id("abTests"),
    winner: v.union(v.literal("A"), v.literal("B"), v.literal("none")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.testId, {
      status: "completed",
      winner: args.winner,
      endDate: Date.now(),
    });

    return { success: true };
  },
});

// Update test
export const updateTest = mutation({
  args: {
    testId: v.id("abTests"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    trafficSplit: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { testId, ...updates } = args;

    const test = await ctx.db.get(testId);
    if (!test) throw new Error("Test not found");
    if (test.status === "running") {
      throw new Error("Cannot update a running test");
    }

    await ctx.db.patch(testId, updates);
    return { success: true };
  },
});

// Delete test
export const deleteTest = mutation({
  args: { testId: v.id("abTests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    if (test.status === "running") {
      throw new Error("Cannot delete a running test. Stop it first.");
    }

    await ctx.db.delete(args.testId);
    return { success: true };
  },
});
