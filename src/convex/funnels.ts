import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";

// ============ QUERIES ============

export const getFunnels = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const funnels = await ctx.db
      .query("funnels")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return funnels;
  },
});

export const getFunnel = query({
  args: { id: v.id("funnels") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getFunnelStats = query({
  args: {
    funnelId: v.id("funnels"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const funnel = await ctx.db.get(args.funnelId);
    if (!funnel) throw new Error("Funnel not found");

    // Get all events for this funnel
    let events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_funnel", (q) => q.eq("funnelId", args.funnelId))
      .collect();

    // Filter by date range
    if (args.startDate) {
      events = events.filter((e) => e.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.timestamp <= args.endDate!);
    }

    // Group events by session
    const sessionEvents = new Map<string, typeof events>();
    for (const event of events) {
      const session = sessionEvents.get(event.sessionId) || [];
      session.push(event);
      sessionEvents.set(event.sessionId, session);
    }

    // Calculate stats for each step
    const stepStats: Array<{
      stepIndex: number;
      stepName: string;
      sessions: number;
      conversionFromPrevious: number;
      conversionFromStart: number;
      avgTimeFromPrevious: number;
    }> = [];

    const totalSessions = sessionEvents.size;

    for (let i = 0; i < funnel.steps.length; i++) {
      const step = funnel.steps[i];

      // Count sessions that reached this step
      const sessionsReached = Array.from(sessionEvents.values()).filter(
        (sessionEvts) => sessionEvts.some((e) => e.stepIndex === i)
      ).length;

      // Calculate conversion rates
      const conversionFromStart =
        totalSessions > 0 ? (sessionsReached / totalSessions) * 100 : 0;

      const previousStepSessions =
        i > 0
          ? Array.from(sessionEvents.values()).filter((sessionEvts) =>
              sessionEvts.some((e) => e.stepIndex === i - 1)
            ).length
          : totalSessions;

      const conversionFromPrevious =
        previousStepSessions > 0
          ? (sessionsReached / previousStepSessions) * 100
          : 0;

      // Calculate average time from previous step
      let avgTime = 0;
      if (i > 0) {
        const times: number[] = [];

        for (const sessionEvts of sessionEvents.values()) {
          const currentEvent = sessionEvts.find((e) => e.stepIndex === i);
          const previousEvent = sessionEvts.find((e) => e.stepIndex === i - 1);

          if (currentEvent && previousEvent) {
            times.push(currentEvent.timestamp - previousEvent.timestamp);
          }
        }

        if (times.length > 0) {
          avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        }
      }

      stepStats.push({
        stepIndex: i,
        stepName: step.name,
        sessions: sessionsReached,
        conversionFromPrevious: parseFloat(conversionFromPrevious.toFixed(2)),
        conversionFromStart: parseFloat(conversionFromStart.toFixed(2)),
        avgTimeFromPrevious: Math.round(avgTime / 1000), // Convert to seconds
      });
    }

    return {
      funnelName: funnel.name,
      totalSessions,
      steps: stepStats,
    };
  },
});

export const getDropoffAnalysis = query({
  args: {
    funnelId: v.id("funnels"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const funnel = await ctx.db.get(args.funnelId);
    if (!funnel) throw new Error("Funnel not found");

    // Get all events for this funnel
    let events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_funnel", (q) => q.eq("funnelId", args.funnelId))
      .collect();

    // Filter by date range
    if (args.startDate) {
      events = events.filter((e) => e.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.timestamp <= args.endDate!);
    }

    // Group events by session
    const sessionEvents = new Map<string, typeof events>();
    for (const event of events) {
      const session = sessionEvents.get(event.sessionId) || [];
      session.push(event);
      sessionEvents.set(event.sessionId, session);
    }

    // Analyze drop-off points
    const dropoffs: Array<{
      fromStep: string;
      toStep: string;
      dropoffCount: number;
      dropoffRate: number;
    }> = [];

    for (let i = 0; i < funnel.steps.length - 1; i++) {
      const currentStep = funnel.steps[i];
      const nextStep = funnel.steps[i + 1];

      let reachedCurrent = 0;
      let completedNext = 0;

      for (const sessionEvts of sessionEvents.values()) {
        const hasCurrentStep = sessionEvts.some((e) => e.stepIndex === i);
        const hasNextStep = sessionEvts.some((e) => e.stepIndex === i + 1);

        if (hasCurrentStep) {
          reachedCurrent++;
          if (hasNextStep) {
            completedNext++;
          }
        }
      }

      const dropoffCount = reachedCurrent - completedNext;
      const dropoffRate =
        reachedCurrent > 0 ? (dropoffCount / reachedCurrent) * 100 : 0;

      dropoffs.push({
        fromStep: currentStep.name,
        toStep: nextStep.name,
        dropoffCount,
        dropoffRate: parseFloat(dropoffRate.toFixed(2)),
      });
    }

    // Sort by drop-off rate to find biggest issues
    dropoffs.sort((a, b) => b.dropoffRate - a.dropoffRate);

    return {
      funnelName: funnel.name,
      dropoffs,
    };
  },
});

// ============ MUTATIONS ============

export const createFunnel = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    steps: v.array(
      v.object({
        name: v.string(),
        eventType: v.string(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const funnelId = await ctx.db.insert("funnels", {
      name: args.name,
      description: args.description,
      steps: args.steps,
      isActive: true,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    return { funnelId };
  },
});

export const updateFunnel = mutation({
  args: {
    id: v.id("funnels"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    steps: v.optional(
      v.array(
        v.object({
          name: v.string(),
          eventType: v.string(),
          order: v.number(),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const updates: any = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.steps !== undefined) updates.steps = args.steps;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

export const deleteFunnel = mutation({
  args: { id: v.id("funnels") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Delete all events
    const events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_funnel", (q) => q.eq("funnelId", args.id))
      .collect();

    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    // Delete funnel
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

export const trackFunnelStep = mutation({
  args: {
    funnelId: v.id("funnels"),
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    stepIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const funnel = await ctx.db.get(args.funnelId);
    if (!funnel) throw new Error("Funnel not found");

    const step = funnel.steps[args.stepIndex];
    if (!step) throw new Error("Invalid step index");

    await ctx.db.insert("funnelEvents", {
      funnelId: args.funnelId,
      userId: args.userId,
      sessionId: args.sessionId,
      stepIndex: args.stepIndex,
      stepName: step.name,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Predefined funnels
export const PREDEFINED_FUNNELS = {
  CHECKOUT: {
    name: "Checkout Funnel",
    steps: [
      { name: "Product View", eventType: "product_view", order: 1 },
      { name: "Add to Cart", eventType: "add_to_cart", order: 2 },
      { name: "View Cart", eventType: "view_cart", order: 3 },
      { name: "Checkout", eventType: "checkout_start", order: 4 },
      { name: "Payment", eventType: "payment_submit", order: 5 },
      { name: "Order Complete", eventType: "order_complete", order: 6 },
    ],
  },
  SIGNUP: {
    name: "User Signup Funnel",
    steps: [
      { name: "Landing Page", eventType: "landing_view", order: 1 },
      { name: "Signup Form", eventType: "signup_start", order: 2 },
      { name: "Email Entered", eventType: "email_entered", order: 3 },
      { name: "Password Entered", eventType: "password_entered", order: 4 },
      { name: "Signup Complete", eventType: "signup_complete", order: 5 },
    ],
  },
} as const;
