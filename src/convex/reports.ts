import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";

// Create a new report
export const createReport = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("sales"),
      v.literal("inventory"),
      v.literal("user"),
      v.literal("order"),
      v.literal("doctor"),
      v.literal("prescription")
    ),
    dataSource: v.string(),
    filters: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.union(
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("contains"),
        v.literal("not_contains"),
        v.literal("gt"),
        v.literal("gte"),
        v.literal("lt"),
        v.literal("lte"),
        v.literal("between"),
        v.literal("in"),
        v.literal("not_in")
      ),
      value: v.any(),
      value2: v.optional(v.any()),
    }))),
    groupBy: v.optional(v.string()),
    aggregations: v.optional(v.array(v.object({
      field: v.string(),
      function: v.union(
        v.literal("sum"),
        v.literal("avg"),
        v.literal("count"),
        v.literal("min"),
        v.literal("max")
      ),
      label: v.optional(v.string()),
    }))),
    columns: v.array(v.string()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    chartType: v.union(
      v.literal("line"),
      v.literal("bar"),
      v.literal("pie"),
      v.literal("table")
    ),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const reportId = await ctx.db.insert("reports", {
      ...args,
      createdBy: userId,
      createdAt: Date.now(),
    });

    // Log the action
    const user = await ctx.db.get(userId as Id<"users">);
    await ctx.db.insert("auditLogs", {
      action: "report_created",
      entityId: reportId,
      entityType: "report",
      performedBy: userId,
      performedByName: user?.name,
      details: `Created report: ${args.name}`,
      timestamp: Date.now(),
    });

    return reportId;
  },
});

// Update a report
export const updateReport = mutation({
  args: {
    reportId: v.id("reports"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("sales"),
      v.literal("inventory"),
      v.literal("user"),
      v.literal("order"),
      v.literal("doctor"),
      v.literal("prescription")
    )),
    dataSource: v.optional(v.string()),
    filters: v.optional(v.array(v.object({
      field: v.string(),
      operator: v.union(
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("contains"),
        v.literal("not_contains"),
        v.literal("gt"),
        v.literal("gte"),
        v.literal("lt"),
        v.literal("lte"),
        v.literal("between"),
        v.literal("in"),
        v.literal("not_in")
      ),
      value: v.any(),
      value2: v.optional(v.any()),
    }))),
    groupBy: v.optional(v.string()),
    aggregations: v.optional(v.array(v.object({
      field: v.string(),
      function: v.union(
        v.literal("sum"),
        v.literal("avg"),
        v.literal("count"),
        v.literal("min"),
        v.literal("max")
      ),
      label: v.optional(v.string()),
    }))),
    columns: v.optional(v.array(v.string())),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    chartType: v.optional(v.union(
      v.literal("line"),
      v.literal("bar"),
      v.literal("pie"),
      v.literal("table")
    )),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const { reportId, ...updates } = args;
    const report = await ctx.db.get(reportId);

    if (!report) throw new Error("Report not found");

    await ctx.db.patch(reportId, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Log the action
    const user = await ctx.db.get(userId as Id<"users">);
    await ctx.db.insert("auditLogs", {
      action: "report_updated",
      entityId: reportId,
      entityType: "report",
      performedBy: userId,
      performedByName: user?.name,
      details: `Updated report: ${report.name}`,
      timestamp: Date.now(),
    });
  },
});

// Delete a report
export const deleteReport = mutation({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    // Delete associated schedules
    const schedules = await ctx.db
      .query("reportSchedules")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    for (const schedule of schedules) {
      await ctx.db.delete(schedule._id);
    }

    await ctx.db.delete(args.reportId);

    // Log the action
    const user = await ctx.db.get(userId as Id<"users">);
    await ctx.db.insert("auditLogs", {
      action: "report_deleted",
      entityId: args.reportId,
      entityType: "report",
      performedBy: userId,
      performedByName: user?.name,
      details: `Deleted report: ${report.name}`,
      timestamp: Date.now(),
    });
  },
});

// List all reports
export const listReports = query({
  args: {
    type: v.optional(v.union(
      v.literal("sales"),
      v.literal("inventory"),
      v.literal("user"),
      v.literal("order"),
      v.literal("doctor"),
      v.literal("prescription")
    )),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let reports;
    if (args.type) {
      reports = await ctx.db
        .query("reports")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .collect();
    } else {
      reports = await ctx.db.query("reports").order("desc").collect();
    }

    // Filter to show only user's reports or public reports
    return reports.filter(
      (report) => report.createdBy === userId || report.isPublic
    );
  },
});

// Get a single report
export const getReport = query({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    // Check access
    if (report.createdBy !== userId && !report.isPublic) {
      throw new Error("Access denied");
    }

    return report;
  },
});

// Run a report and return data
export const runReport = action({
  args: {
    reportId: v.id("reports"),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const userId = await ctx.runQuery(internal.reports.getAuthUser);
    if (!userId) throw new Error("Unauthorized");

    // Get the report configuration
    const report = await ctx.runQuery(api.reports.getReport, {
      reportId: args.reportId,
    });

    if (!report) throw new Error("Report not found");

    // Fetch data based on data source
    let data: any[] = [];

    try {
      switch (report.dataSource) {
        case "orders":
          data = await ctx.runQuery(internal.reports.queryOrders, {
            filters: report.filters || [],
            dateRange: args.dateRange,
          });
          break;
        case "products":
          data = await ctx.runQuery(internal.reports.queryProducts, {
            filters: report.filters || [],
          });
          break;
        case "users":
          data = await ctx.runQuery(internal.reports.queryUsers, {
            filters: report.filters || [],
            dateRange: args.dateRange,
          });
          break;
        case "prescriptions":
          data = await ctx.runQuery(internal.reports.queryPrescriptions, {
            filters: report.filters || [],
            dateRange: args.dateRange,
          });
          break;
        case "consultationDoctors":
          data = await ctx.runQuery(internal.reports.queryDoctors, {
            filters: report.filters || [],
          });
          break;
        default:
          throw new Error("Unsupported data source");
      }

      // Apply column selection
      if (report.columns && report.columns.length > 0) {
        data = data.map((row: any) => {
          const filteredRow: any = {};
          report.columns.forEach((col) => {
            if (row[col] !== undefined) {
              filteredRow[col] = row[col];
            }
          });
          return filteredRow;
        });
      }

      // Apply grouping and aggregations
      if (report.groupBy && report.aggregations) {
        data = applyGroupingAndAggregations(data, report.groupBy, report.aggregations);
      }

      // Apply sorting
      if (report.sortBy) {
        const order = report.sortOrder || "asc";
        data.sort((a: any, b: any) => {
          const aVal = a[report.sortBy!];
          const bVal = b[report.sortBy!];
          if (aVal < bVal) return order === "asc" ? -1 : 1;
          if (aVal > bVal) return order === "asc" ? 1 : -1;
          return 0;
        });
      }

      const executionTime = Date.now() - startTime;

      // Update last run time
      await ctx.runMutation(internal.reports.updateLastRun, {
        reportId: args.reportId,
      });

      // Log execution
      await ctx.runMutation(internal.reports.logExecution, {
        reportId: args.reportId,
        reportName: report.name,
        executedBy: userId,
        status: "success",
        recordCount: data.length,
        executionTime,
      });

      return {
        data,
        recordCount: data.length,
        executionTime,
      };
    } catch (error: any) {
      // Log failed execution
      await ctx.runMutation(internal.reports.logExecution, {
        reportId: args.reportId,
        reportName: report.name,
        executedBy: userId,
        status: "failed",
        error: error.message,
      });

      throw error;
    }
  },
});

// Helper function for grouping and aggregations
function applyGroupingAndAggregations(
  data: any[],
  groupBy: string,
  aggregations: any[]
): any[] {
  const grouped: { [key: string]: any[] } = {};

  // Group data
  data.forEach((row) => {
    const key = row[groupBy];
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(row);
  });

  // Apply aggregations
  return Object.entries(grouped).map(([key, rows]) => {
    const result: any = { [groupBy]: key };

    aggregations.forEach((agg) => {
      const values = rows.map((row) => row[agg.field]).filter((v) => v !== undefined);
      const label = agg.label || `${agg.function}(${agg.field})`;

      switch (agg.function) {
        case "sum":
          result[label] = values.reduce((sum, val) => sum + Number(val), 0);
          break;
        case "avg":
          result[label] = values.length > 0
            ? values.reduce((sum, val) => sum + Number(val), 0) / values.length
            : 0;
          break;
        case "count":
          result[label] = values.length;
          break;
        case "min":
          result[label] = values.length > 0 ? Math.min(...values.map(Number)) : 0;
          break;
        case "max":
          result[label] = values.length > 0 ? Math.max(...values.map(Number)) : 0;
          break;
      }
    });

    return result;
  });
}

// Export report to CSV format
export const exportReport = action({
  args: {
    reportId: v.id("reports"),
    format: v.union(v.literal("csv"), v.literal("excel"), v.literal("json")),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.runQuery(internal.reports.getAuthUser);
    if (!userId) throw new Error("Unauthorized");

    // Run the report to get data
    const result = await ctx.runAction(api.reports.runReport, {
      reportId: args.reportId,
      dateRange: args.dateRange,
    });

    const { data } = result;

    // Convert to requested format
    let exportData: string;
    let contentType: string;
    let fileExtension: string;

    switch (args.format) {
      case "csv":
      case "excel":
        exportData = convertToCSV(data);
        contentType = "text/csv";
        fileExtension = "csv";
        break;
      case "json":
        exportData = JSON.stringify(data, null, 2);
        contentType = "application/json";
        fileExtension = "json";
        break;
      default:
        throw new Error("Unsupported format");
    }

    return {
      data: exportData,
      contentType,
      fileExtension,
    };
  },
});

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      }).join(",")
    ),
  ].join("\n");

  return csv;
}

// Create a report schedule
export const scheduleReport = mutation({
  args: {
    reportId: v.id("reports"),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
    timeOfDay: v.string(),
    recipients: v.array(v.string()),
    exportFormat: v.union(
      v.literal("csv"),
      v.literal("excel"),
      v.literal("pdf"),
      v.literal("json")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    // Calculate next run time
    const nextRun = calculateNextRun(
      args.frequency,
      args.timeOfDay,
      args.dayOfWeek,
      args.dayOfMonth
    );

    const scheduleId = await ctx.db.insert("reportSchedules", {
      reportId: args.reportId,
      reportName: report.name,
      frequency: args.frequency,
      dayOfWeek: args.dayOfWeek,
      dayOfMonth: args.dayOfMonth,
      timeOfDay: args.timeOfDay,
      recipients: args.recipients,
      exportFormat: args.exportFormat,
      enabled: true,
      nextRun,
      createdBy: userId,
      createdAt: Date.now(),
    });

    // Log the action
    const user = await ctx.db.get(userId as Id<"users">);
    await ctx.db.insert("auditLogs", {
      action: "report_scheduled",
      entityId: scheduleId,
      entityType: "reportSchedule",
      performedBy: userId,
      performedByName: user?.name,
      details: `Scheduled report: ${report.name} (${args.frequency})`,
      timestamp: Date.now(),
    });

    return scheduleId;
  },
});

// Helper function to calculate next run time
function calculateNextRun(
  frequency: "daily" | "weekly" | "monthly",
  timeOfDay: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): number {
  const now = new Date();
  const [hours, minutes] = timeOfDay.split(":").map(Number);

  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case "daily":
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    case "weekly":
      if (dayOfWeek !== undefined) {
        const currentDay = nextRun.getDay();
        const daysUntil = (dayOfWeek - currentDay + 7) % 7;
        nextRun.setDate(nextRun.getDate() + (daysUntil || 7));
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
      }
      break;
    case "monthly":
      if (dayOfMonth !== undefined) {
        nextRun.setDate(dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }
      break;
  }

  return nextRun.getTime();
}

// Get scheduled reports
export const getScheduledReports = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("reportSchedules").order("desc").collect();
  },
});

// Update report schedule
export const updateSchedule = mutation({
  args: {
    scheduleId: v.id("reportSchedules"),
    frequency: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    )),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
    timeOfDay: v.optional(v.string()),
    recipients: v.optional(v.array(v.string())),
    exportFormat: v.optional(v.union(
      v.literal("csv"),
      v.literal("excel"),
      v.literal("pdf"),
      v.literal("json")
    )),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const { scheduleId, ...updates } = args;
    const schedule = await ctx.db.get(scheduleId);
    if (!schedule) throw new Error("Schedule not found");

    // Recalculate next run if frequency or time changed
    let nextRun = schedule.nextRun;
    if (updates.frequency || updates.timeOfDay || updates.dayOfWeek !== undefined || updates.dayOfMonth !== undefined) {
      nextRun = calculateNextRun(
        updates.frequency || schedule.frequency,
        updates.timeOfDay || schedule.timeOfDay,
        updates.dayOfWeek !== undefined ? updates.dayOfWeek : schedule.dayOfWeek,
        updates.dayOfMonth !== undefined ? updates.dayOfMonth : schedule.dayOfMonth
      );
    }

    await ctx.db.patch(scheduleId, {
      ...updates,
      nextRun,
      updatedAt: Date.now(),
    });

    // Log the action
    const user = await ctx.db.get(userId as Id<"users">);
    await ctx.db.insert("auditLogs", {
      action: "report_schedule_updated",
      entityId: scheduleId,
      entityType: "reportSchedule",
      performedBy: userId,
      performedByName: user?.name,
      details: `Updated schedule for report: ${schedule.reportName}`,
      timestamp: Date.now(),
    });
  },
});

// Delete a report schedule
export const deleteSchedule = mutation({
  args: {
    scheduleId: v.id("reportSchedules"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");

    await ctx.db.delete(args.scheduleId);

    // Log the action
    const user = await ctx.db.get(userId as Id<"users">);
    await ctx.db.insert("auditLogs", {
      action: "report_schedule_deleted",
      entityId: args.scheduleId,
      entityType: "reportSchedule",
      performedBy: userId,
      performedByName: user?.name,
      details: `Deleted schedule for report: ${schedule.reportName}`,
      timestamp: Date.now(),
    });
  },
});

// Get report execution history
export const getReportExecutions = query({
  args: {
    reportId: v.optional(v.id("reports")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let query = ctx.db.query("reportExecutions");

    if (args.reportId) {
      const executions = await query
        .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
        .order("desc")
        .take(args.limit || 50);
      return executions;
    }

    return await query.order("desc").take(args.limit || 50);
  },
});

// Internal mutations and queries

export const getAuthUser = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

export const updateLastRun = internalMutation({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      lastRun: Date.now(),
    });
  },
});

export const logExecution = internalMutation({
  args: {
    reportId: v.id("reports"),
    reportName: v.string(),
    scheduleId: v.optional(v.id("reportSchedules")),
    executedBy: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("running")
    ),
    recordCount: v.optional(v.number()),
    executionTime: v.optional(v.number()),
    exportFormat: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reportExecutions", {
      ...args,
      executedAt: Date.now(),
    });
  },
});

// Internal query functions for different data sources

export const queryOrders = internalQuery({
  args: {
    filters: v.array(v.object({
      field: v.string(),
      operator: v.union(
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("contains"),
        v.literal("not_contains"),
        v.literal("gt"),
        v.literal("gte"),
        v.literal("lt"),
        v.literal("lte"),
        v.literal("between"),
        v.literal("in"),
        v.literal("not_in")
      ),
      value: v.any(),
      value2: v.optional(v.any()),
    })),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    let orders = await ctx.db.query("orders").collect();

    // Apply date range filter
    if (args.dateRange) {
      orders = orders.filter(
        (order) =>
          order._creationTime >= args.dateRange!.start &&
          order._creationTime <= args.dateRange!.end
      );
    }

    // Apply custom filters
    orders = applyFilters(orders, args.filters);

    return orders.map((order) => ({
      _id: order._id,
      _creationTime: order._creationTime,
      userId: order.userId,
      total: order.total,
      status: order.status,
      itemCount: order.items.length,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    }));
  },
});

export const queryProducts = internalQuery({
  args: {
    filters: v.array(v.object({
      field: v.string(),
      operator: v.union(
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("contains"),
        v.literal("not_contains"),
        v.literal("gt"),
        v.literal("gte"),
        v.literal("lt"),
        v.literal("lte"),
        v.literal("between"),
        v.literal("in"),
        v.literal("not_in")
      ),
      value: v.any(),
      value2: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db.query("products").collect();

    // Apply custom filters
    products = applyFilters(products, args.filters);

    return products.map((product) => ({
      _id: product._id,
      _creationTime: product._creationTime,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      basePrice: product.basePrice,
      stock: product.stock,
      category: product.category,
      averageRating: product.averageRating,
      ratingCount: product.ratingCount,
    }));
  },
});

export const queryUsers = internalQuery({
  args: {
    filters: v.array(v.object({
      field: v.string(),
      operator: v.union(
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("contains"),
        v.literal("not_contains"),
        v.literal("gt"),
        v.literal("gte"),
        v.literal("lt"),
        v.literal("lte"),
        v.literal("between"),
        v.literal("in"),
        v.literal("not_in")
      ),
      value: v.any(),
      value2: v.optional(v.any()),
    })),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db.query("users").collect();

    // Apply date range filter
    if (args.dateRange) {
      users = users.filter(
        (user) =>
          user._creationTime >= args.dateRange!.start &&
          user._creationTime <= args.dateRange!.end
      );
    }

    // Apply custom filters
    users = applyFilters(users, args.filters);

    return users.map((user) => ({
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      emailVerified: user.emailVerified,
      suspended: user.suspended,
      lastActiveAt: user.lastActiveAt,
    }));
  },
});

export const queryPrescriptions = internalQuery({
  args: {
    filters: v.array(v.object({
      field: v.string(),
      operator: v.union(
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("contains"),
        v.literal("not_contains"),
        v.literal("gt"),
        v.literal("gte"),
        v.literal("lt"),
        v.literal("lte"),
        v.literal("between"),
        v.literal("in"),
        v.literal("not_in")
      ),
      value: v.any(),
      value2: v.optional(v.any()),
    })),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    let prescriptions = await ctx.db.query("prescriptions").collect();

    // Apply date range filter
    if (args.dateRange) {
      prescriptions = prescriptions.filter(
        (prescription) =>
          prescription._creationTime >= args.dateRange!.start &&
          prescription._creationTime <= args.dateRange!.end
      );
    }

    // Apply custom filters
    prescriptions = applyFilters(prescriptions, args.filters);

    return prescriptions.map((prescription) => ({
      _id: prescription._id,
      _creationTime: prescription._creationTime,
      userId: prescription.userId,
      patientName: prescription.patientName,
      patientPhone: prescription.patientPhone,
      status: prescription.status,
      doctorId: prescription.doctorId,
      doctorName: prescription.doctorName,
      diagnosis: prescription.diagnosis,
      medicineCount: prescription.medicines?.length || 0,
    }));
  },
});

export const queryDoctors = internalQuery({
  args: {
    filters: v.array(v.object({
      field: v.string(),
      operator: v.union(
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("contains"),
        v.literal("not_contains"),
        v.literal("gt"),
        v.literal("gte"),
        v.literal("lt"),
        v.literal("lte"),
        v.literal("between"),
        v.literal("in"),
        v.literal("not_in")
      ),
      value: v.any(),
      value2: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    let doctors = await ctx.db.query("consultationDoctors").collect();

    // Apply custom filters
    doctors = applyFilters(doctors, args.filters);

    return doctors.map((doctor) => ({
      _id: doctor._id,
      _creationTime: doctor._creationTime,
      name: doctor.name,
      specialization: doctor.specialization,
      experienceYears: doctor.experienceYears,
      rating: doctor.rating,
      totalConsultations: doctor.totalConsultations,
      clinicCity: doctor.clinicCity,
    }));
  },
});

// Helper function to apply filters
function applyFilters(data: any[], filters: any[]): any[] {
  return data.filter((item) => {
    return filters.every((filter) => {
      const value = item[filter.field];

      switch (filter.operator) {
        case "equals":
          return value === filter.value;
        case "not_equals":
          return value !== filter.value;
        case "contains":
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case "not_contains":
          return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case "gt":
          return Number(value) > Number(filter.value);
        case "gte":
          return Number(value) >= Number(filter.value);
        case "lt":
          return Number(value) < Number(filter.value);
        case "lte":
          return Number(value) <= Number(filter.value);
        case "between":
          return (
            Number(value) >= Number(filter.value) &&
            Number(value) <= Number(filter.value2)
          );
        case "in":
          return Array.isArray(filter.value) && filter.value.includes(value);
        case "not_in":
          return Array.isArray(filter.value) && !filter.value.includes(value);
        default:
          return true;
      }
    });
  });
}

// Execute scheduled reports (called by cron)
export const executeScheduledReports = action({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all enabled schedules that are due to run
    const schedules = await ctx.runQuery(internal.reports.getDueSchedules, { now });

    for (const schedule of schedules) {
      try {
        // Run the report
        const result = await ctx.runAction(api.reports.runReport, {
          reportId: schedule.reportId,
        });

        // Export the report
        const exported = await ctx.runAction(api.reports.exportReport, {
          reportId: schedule.reportId,
          format: schedule.exportFormat,
        });

        // TODO: Send email to recipients with the exported report
        // This would require email integration (e.g., SendGrid, AWS SES)
        console.log(`Report "${schedule.reportName}" executed and ready to send to:`, schedule.recipients);

        // Update schedule
        const nextRun = calculateNextRun(
          schedule.frequency,
          schedule.timeOfDay,
          schedule.dayOfWeek,
          schedule.dayOfMonth
        );

        await ctx.runMutation(internal.reports.updateScheduleAfterRun, {
          scheduleId: schedule._id,
          nextRun,
          status: "success",
        });
      } catch (error: any) {
        console.error(`Error executing scheduled report ${schedule.reportName}:`, error);

        await ctx.runMutation(internal.reports.updateScheduleAfterRun, {
          scheduleId: schedule._id,
          nextRun: schedule.nextRun!,
          status: "failed",
          error: error.message,
        });
      }
    }
  },
});

export const getDueSchedules = internalQuery({
  args: {
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const schedules = await ctx.db
      .query("reportSchedules")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();

    return schedules.filter(
      (schedule) => schedule.nextRun && schedule.nextRun <= args.now
    );
  },
});

export const updateScheduleAfterRun = internalMutation({
  args: {
    scheduleId: v.id("reportSchedules"),
    nextRun: v.number(),
    status: v.union(v.literal("success"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scheduleId, {
      lastRun: Date.now(),
      nextRun: args.nextRun,
      lastStatus: args.status,
      lastError: args.error,
    });
  },
});
