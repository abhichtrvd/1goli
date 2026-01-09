import { v } from "convex/values";
import { mutation, query, action, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";
import { api, internal } from "./_generated/api";

// Get all scheduled reports
export const getScheduledReports = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const scheduledReports = await ctx.db.query("scheduledReports").order("desc").collect();

    // Enrich with template names
    const enriched = await Promise.all(
      scheduledReports.map(async (report) => {
        const template = await ctx.db.get(report.reportTemplateId);
        return {
          ...report,
          templateName: template?.name || "Unknown Template",
        };
      })
    );

    return enriched;
  },
});

// Get a single scheduled report
export const getScheduledReport = query({
  args: { reportId: v.id("scheduledReports") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.reportId);
  },
});

// Create a scheduled report
export const createScheduledReport = mutation({
  args: {
    reportTemplateId: v.id("reportTemplates"),
    name: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
    timeOfDay: v.string(),
    recipients: v.array(v.string()),
    deliveryMethod: v.union(v.literal("email"), v.literal("webhook"), v.literal("storage")),
    webhookUrl: v.optional(v.string()),
    exportFormat: v.union(v.literal("csv"), v.literal("json"), v.literal("pdf")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);

    // Validate template exists
    const template = await ctx.db.get(args.reportTemplateId);
    if (!template) throw new Error("Report template not found");

    // Calculate next run time
    const nextRunAt = calculateNextRun(args.frequency, args.dayOfWeek, args.dayOfMonth, args.timeOfDay);

    const reportId = await ctx.db.insert("scheduledReports", {
      reportTemplateId: args.reportTemplateId,
      name: args.name,
      frequency: args.frequency,
      dayOfWeek: args.dayOfWeek,
      dayOfMonth: args.dayOfMonth,
      timeOfDay: args.timeOfDay,
      recipients: args.recipients,
      deliveryMethod: args.deliveryMethod,
      webhookUrl: args.webhookUrl,
      exportFormat: args.exportFormat,
      isActive: true,
      nextRunAt,
      createdBy: userId || "admin",
      createdAt: Date.now(),
    });

    return reportId;
  },
});

// Update scheduled report
export const updateScheduledReport = mutation({
  args: {
    reportId: v.id("scheduledReports"),
    name: v.optional(v.string()),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
    timeOfDay: v.optional(v.string()),
    recipients: v.optional(v.array(v.string())),
    deliveryMethod: v.optional(v.union(v.literal("email"), v.literal("webhook"), v.literal("storage"))),
    webhookUrl: v.optional(v.string()),
    exportFormat: v.optional(v.union(v.literal("csv"), v.literal("json"), v.literal("pdf"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { reportId, ...updates } = args;

    const report = await ctx.db.get(reportId);
    if (!report) throw new Error("Scheduled report not found");

    // Recalculate next run if schedule changed
    let nextRunAt = report.nextRunAt;
    if (updates.frequency || updates.dayOfWeek !== undefined || updates.dayOfMonth !== undefined || updates.timeOfDay !== undefined) {
      nextRunAt = calculateNextRun(
        updates.frequency || report.frequency,
        updates.dayOfWeek !== undefined ? updates.dayOfWeek : report.dayOfWeek,
        updates.dayOfMonth !== undefined ? updates.dayOfMonth : report.dayOfMonth,
        updates.timeOfDay || report.timeOfDay
      );
    }

    await ctx.db.patch(reportId, {
      ...updates,
      nextRunAt,
    });
  },
});

// Delete scheduled report
export const deleteScheduledReport = mutation({
  args: { reportId: v.id("scheduledReports") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.reportId);
  },
});

// Toggle scheduled report active status
export const toggleScheduledReport = mutation({
  args: {
    reportId: v.id("scheduledReports"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.reportId, {
      isActive: args.isActive,
    });
  },
});

// Run scheduled reports (called by cron)
export const runScheduledReports = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all active scheduled reports that are due
    const dueReports = await ctx.runQuery(internal.scheduledReports.getDueReports, { now });

    for (const report of dueReports) {
      try {
        // Note: The report running logic would need to be adapted based on your actual report structure
        // This is a placeholder that assumes reports work with templates
        console.log(`Running scheduled report: ${report.name}`);

        // Deliver report (simulated)
        await deliverReport(report, "exported-data", {});

        // Update last run and calculate next run
        const nextRunAt = calculateNextRun(
          report.frequency,
          report.dayOfWeek,
          report.dayOfMonth,
          report.timeOfDay
        );

        await ctx.runMutation(internal.scheduledReports.updateLastRun, {
          reportId: report._id,
          lastRunAt: now,
          nextRunAt,
        });

        console.log(`Successfully ran scheduled report: ${report.name}`);
      } catch (error) {
        console.error(`Failed to run scheduled report ${report.name}:`, error);
      }
    }

    return { processed: dueReports.length };
  },
});

// Internal query to get due reports
export const getDueReports = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledReports")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => q.lte(q.field("nextRunAt"), args.now))
      .collect();
  },
});

// Internal mutation to update last run
export const updateLastRun = mutation({
  args: {
    reportId: v.id("scheduledReports"),
    lastRunAt: v.number(),
    nextRunAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      lastRunAt: args.lastRunAt,
      nextRunAt: args.nextRunAt,
    });
  },
});

// Helper function to calculate next run time
function calculateNextRun(
  frequency: "daily" | "weekly" | "monthly",
  dayOfWeek: number | undefined,
  dayOfMonth: number | undefined,
  timeOfDay: string
): number {
  const now = new Date();
  const [hours, minutes] = timeOfDay.split(":").map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours || 0, minutes || 0, 0, 0);

  switch (frequency) {
    case "daily":
      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case "weekly":
      // Schedule for specific day of week
      const targetDay = dayOfWeek !== undefined ? dayOfWeek : 1; // Default to Monday
      const currentDay = nextRun.getDay();
      let daysToAdd = targetDay - currentDay;

      if (daysToAdd < 0 || (daysToAdd === 0 && nextRun <= now)) {
        daysToAdd += 7;
      }

      nextRun.setDate(nextRun.getDate() + daysToAdd);
      break;

    case "monthly":
      // Schedule for specific day of month
      const targetDate = dayOfMonth !== undefined ? dayOfMonth : 1; // Default to 1st of month
      nextRun.setDate(targetDate);

      // If date has passed this month, schedule for next month
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }

  return nextRun.getTime();
}

// Helper function to deliver report
async function deliverReport(report: any, exportedData: string, reportData: any): Promise<void> {
  switch (report.deliveryMethod) {
    case "email":
      // In production, integrate with email service (SendGrid, etc.)
      console.log(`Email delivery to: ${report.recipients.join(", ")}`);
      console.log(`Report: ${report.name}`);
      console.log(`Data length: ${exportedData.length} characters`);
      break;

    case "webhook":
      if (report.webhookUrl !== undefined) {
        try {
          const response = await fetch(report.webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reportName: report.name,
              reportData,
              exportedData,
              timestamp: Date.now(),
            }),
          });

          if (!response.ok) {
            throw new Error(`Webhook failed: ${response.statusText}`);
          }
        } catch (error) {
          console.error("Webhook delivery failed:", error);
          throw error;
        }
      }
      break;

    case "storage":
      // Store in Convex storage or external storage
      console.log(`Storage delivery for report: ${report.name}`);
      // In production, upload to storage and store reference
      break;
  }
}

// Manual trigger for a scheduled report
export const triggerScheduledReport = action({
  args: { reportId: v.id("scheduledReports") },
  handler: async (ctx, args) => {
    const report = await ctx.runQuery(api.scheduledReports.getScheduledReport, {
      reportId: args.reportId,
    });

    if (!report) throw new Error("Scheduled report not found");

    // Note: The report running logic would need to be adapted based on your actual report structure
    console.log(`Manually triggering scheduled report: ${report.name}`);

    // Deliver report (simulated)
    await deliverReport(report, "exported-data", {});

    return { success: true, message: "Report triggered successfully" };
  },
});
