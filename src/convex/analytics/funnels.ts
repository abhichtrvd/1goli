import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { api } from "../_generated/api";

// Create a funnel
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
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const funnelId = await ctx.db.insert("funnels", {
      name: args.name,
      description: args.description,
      steps: args.steps,
      isActive: true,
      createdBy: args.userId,
      createdAt: Date.now(),
    });

    return funnelId;
  },
});

// Get all funnels
export const getFunnels = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let funnels = await ctx.db.query("funnels").collect();

    if (args.activeOnly) {
      funnels = funnels.filter((f) => f.isActive);
    }

    return funnels.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get funnel by ID
export const getFunnel = query({
  args: { funnelId: v.id("funnels") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.funnelId);
  },
});

// Track funnel step
export const trackFunnelStep = mutation({
  args: {
    funnelId: v.id("funnels"),
    userId: v.optional(v.id("users")),
    sessionId: v.string(),
    stepIndex: v.number(),
    stepName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("funnelEvents", {
      funnelId: args.funnelId,
      userId: args.userId,
      sessionId: args.sessionId,
      stepIndex: args.stepIndex,
      stepName: args.stepName,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Get funnel data with drop-offs
export const getFunnelData = action({
  args: {
    funnelId: v.id("funnels"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const funnel = await ctx.runQuery(api.analytics.funnels.getFunnel, {
      funnelId: args.funnelId,
    });

    if (!funnel) return null;

    // Get all events for this funnel
    const events = await ctx.runQuery(api.analytics.funnels.getFunnelEvents, {
      funnelId: args.funnelId,
      startDate: args.startDate ?? undefined,
      endDate: args.endDate ?? undefined,
    });

    // Group by session
    const sessionSteps: Record<string, Set<number>> = {};

    events.forEach((event) => {
      if (!sessionSteps[event.sessionId]) {
        sessionSteps[event.sessionId] = new Set();
      }
      sessionSteps[event.sessionId].add(event.stepIndex);
    });

    // Calculate step completion
    const stepData = funnel.steps.map((step) => {
      const completedSessions = Object.values(sessionSteps).filter((steps) =>
        steps.has(step.order)
      ).length;

      return {
        stepName: step.name,
        stepIndex: step.order,
        count: completedSessions,
      };
    });

    // Calculate drop-off rates
    const stepsWithDropoff = stepData.map((step, index) => {
      const nextStep = stepData[index + 1];
      const dropoff = nextStep ? step.count - nextStep.count : 0;
      const dropoffRate = step.count > 0 ? (dropoff / step.count) * 100 : 0;

      return {
        ...step,
        dropoff,
        dropoffRate: Math.round(dropoffRate * 10) / 10,
        conversionRate:
          stepData[0].count > 0
            ? Math.round((step.count / stepData[0].count) * 1000) / 10
            : 0,
      };
    });

    // Calculate overall conversion rate
    const overallConversion =
      stepData[0].count > 0
        ? (stepData[stepData.length - 1].count / stepData[0].count) * 100
        : 0;

    return {
      funnel,
      steps: stepsWithDropoff,
      totalSessions: Object.keys(sessionSteps).length,
      conversionRate: Math.round(overallConversion * 10) / 10,
      completedSessions: stepData[stepData.length - 1].count,
    };
  },
});

// Helper query to get funnel events
export const getFunnelEvents = query({
  args: {
    funnelId: v.id("funnels"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_funnel", (q) => q.eq("funnelId", args.funnelId))
      .collect();

    if (args.startDate !== undefined) {
      events = events.filter((e) => e.timestamp >= args.startDate!);
    }

    if (args.endDate !== undefined) {
      events = events.filter((e) => e.timestamp <= args.endDate!);
    }

    return events;
  },
});

// Get funnel conversions (completed all steps)
export const getFunnelConversions = query({
  args: {
    funnelId: v.id("funnels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const funnel = await ctx.db.get(args.funnelId);
    if (!funnel) return [];

    const events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_funnel", (q) => q.eq("funnelId", args.funnelId))
      .collect();

    // Group by session
    const sessionSteps: Record<
      string,
      { steps: Set<number>; userId?: string; firstEvent: number; lastEvent: number }
    > = {};

    events.forEach((event) => {
      if (!sessionSteps[event.sessionId]) {
        sessionSteps[event.sessionId] = {
          steps: new Set(),
          userId: event.userId !== undefined ? event.userId.toString() : undefined,
          firstEvent: event.timestamp,
          lastEvent: event.timestamp,
        };
      }
      sessionSteps[event.sessionId].steps.add(event.stepIndex);
      sessionSteps[event.sessionId].lastEvent = Math.max(
        sessionSteps[event.sessionId].lastEvent,
        event.timestamp
      );
    });

    // Find sessions that completed all steps
    const totalSteps = funnel.steps.length;
    const conversions = Object.entries(sessionSteps)
      .filter(([_, data]) => data.steps.size === totalSteps)
      .map(([sessionId, data]) => ({
        sessionId,
        userId: data.userId,
        completedAt: data.lastEvent,
        timeToConvert: data.lastEvent - data.firstEvent,
      }))
      .sort((a, b) => b.completedAt - a.completedAt);

    const limit = args.limit || 50;
    return conversions.slice(0, limit);
  },
});

// Get time-to-convert metrics
export const getTimeToConvert = query({
  args: {
    funnelId: v.id("funnels"),
  },
  handler: async (ctx, args) => {
    const funnel = await ctx.db.get(args.funnelId);
    if (!funnel) return null;

    const events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_funnel", (q) => q.eq("funnelId", args.funnelId))
      .collect();

    // Group by session
    const sessionTimes: number[] = [];
    const sessionSteps: Record<string, { first: number; last: number; count: number }> = {};

    events.forEach((event) => {
      if (!sessionSteps[event.sessionId]) {
        sessionSteps[event.sessionId] = {
          first: event.timestamp,
          last: event.timestamp,
          count: 1,
        };
      } else {
        sessionSteps[event.sessionId].last = Math.max(
          sessionSteps[event.sessionId].last,
          event.timestamp
        );
        sessionSteps[event.sessionId].count++;
      }
    });

    // Filter only completed funnels
    const totalSteps = funnel.steps.length;
    Object.values(sessionSteps).forEach((data) => {
      if (data.count >= totalSteps) {
        const duration = data.last - data.first;
        sessionTimes.push(duration);
      }
    });

    if (sessionTimes.length === 0) {
      return {
        avgTime: 0,
        medianTime: 0,
        minTime: 0,
        maxTime: 0,
        count: 0,
      };
    }

    sessionTimes.sort((a, b) => a - b);
    const avgTime = sessionTimes.reduce((sum, time) => sum + time, 0) / sessionTimes.length;
    const medianTime = sessionTimes[Math.floor(sessionTimes.length / 2)];

    return {
      avgTime: Math.round(avgTime),
      medianTime,
      minTime: sessionTimes[0],
      maxTime: sessionTimes[sessionTimes.length - 1],
      count: sessionTimes.length,
    };
  },
});

// Update funnel
export const updateFunnel = mutation({
  args: {
    funnelId: v.id("funnels"),
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
    const { funnelId, ...updates } = args;
    await ctx.db.patch(funnelId, updates);
    return { success: true };
  },
});

// Delete funnel
export const deleteFunnel = mutation({
  args: { funnelId: v.id("funnels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.funnelId);
    return { success: true };
  },
});
