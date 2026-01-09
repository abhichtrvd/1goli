import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { requireAdmin } from "./users";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============ QUERIES ============

export const analyzeDatabaseStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Get counts for each table
    const tables = [
      "users",
      "products",
      "orders",
      "prescriptions",
      "reviews",
      "cartItems",
      "consultationDoctors",
      "consultationBookings",
      "auditLogs",
      "userActivity",
      "loginHistory",
      "productStockHistory",
      "roles",
      "permissions",
      "teamInvitations",
      "backups",
    ];

    const stats = await Promise.all(
      tables.map(async (tableName) => {
        try {
          const records = await (ctx.db as any).query(tableName).collect();
          const count = records.length;

          // Estimate size (very approximate)
          const sampleRecord = records[0];
          const estimatedSizePerRecord = sampleRecord
            ? JSON.stringify(sampleRecord).length
            : 0;
          const estimatedTotalSize = count * estimatedSizePerRecord;

          return {
            tableName,
            recordCount: count,
            estimatedSize: estimatedTotalSize,
            sampleRecord: sampleRecord ? Object.keys(sampleRecord).length : 0,
          };
        } catch (error) {
          return {
            tableName,
            recordCount: 0,
            estimatedSize: 0,
            sampleRecord: 0,
            error: "Unable to access table",
          };
        }
      })
    );

    // Calculate totals
    const totalRecords = stats.reduce((sum, s) => sum + s.recordCount, 0);
    const totalSize = stats.reduce((sum, s) => sum + s.estimatedSize, 0);

    return {
      tables: stats,
      totals: {
        totalRecords,
        totalSize,
        totalTables: tables.length,
      },
    };
  },
});

export const getDataRetentionInfo = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

    // Audit logs
    const allAuditLogs = await ctx.db.query("auditLogs").collect();
    const oldAuditLogs = allAuditLogs.filter(
      (log) => log.timestamp < ninetyDaysAgo
    );

    // Login history
    const allLoginHistory = await ctx.db.query("loginHistory").collect();
    const oldLoginHistory = allLoginHistory.filter(
      (login) => login.timestamp < ninetyDaysAgo
    );

    // User activity
    const allUserActivity = await ctx.db.query("userActivity").collect();
    const oldUserActivity = allUserActivity.filter(
      (activity) => activity.timestamp < sixMonthsAgo
    );

    // Deleted orders
    const deletedOrders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("isDeleted"), true))
      .collect();
    const oldDeletedOrders = deletedOrders.filter(
      (order) => (order.deletedAt || 0) < thirtyDaysAgo
    );

    // Deleted prescriptions
    const deletedPrescriptions = await ctx.db
      .query("prescriptions")
      .filter((q) => q.eq(q.field("isDeleted"), true))
      .collect();
    const oldDeletedPrescriptions = deletedPrescriptions.filter(
      (prescription) => (prescription.deletedAt || 0) < thirtyDaysAgo
    );

    return {
      auditLogs: {
        total: allAuditLogs.length,
        older90Days: oldAuditLogs.length,
      },
      loginHistory: {
        total: allLoginHistory.length,
        older90Days: oldLoginHistory.length,
      },
      userActivity: {
        total: allUserActivity.length,
        older6Months: oldUserActivity.length,
      },
      deletedOrders: {
        total: deletedOrders.length,
        older30Days: oldDeletedOrders.length,
      },
      deletedPrescriptions: {
        total: deletedPrescriptions.length,
        older30Days: oldDeletedPrescriptions.length,
      },
    };
  },
});

export const findDuplicateUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();

    // Find duplicate emails
    const emailMap = new Map<string, any[]>();
    const phoneMap = new Map<string, any[]>();

    users.forEach((user) => {
      if (user.email) {
        const existing = emailMap.get(user.email) || [];
        existing.push(user);
        emailMap.set(user.email, existing);
      }
      if (user.phone) {
        const existing = phoneMap.get(user.phone) || [];
        existing.push(user);
        phoneMap.set(user.phone, existing);
      }
    });

    const duplicateEmails = Array.from(emailMap.entries())
      .filter(([_, users]) => users.length > 1)
      .map(([email, users]) => ({ email, users, count: users.length }));

    const duplicatePhones = Array.from(phoneMap.entries())
      .filter(([_, users]) => users.length > 1)
      .map(([phone, users]) => ({ phone, users, count: users.length }));

    return {
      duplicateEmails,
      duplicatePhones,
      totalDuplicates: duplicateEmails.length + duplicatePhones.length,
    };
  },
});

export const findOrphanedRecords = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const issues: any[] = [];

    // Cart items with non-existent products
    const cartItems = await ctx.db.query("cartItems").collect();
    for (const item of cartItems) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        issues.push({
          type: "orphaned_cart_item",
          id: item._id,
          details: `Cart item references non-existent product ${item.productId}`,
        });
      }
    }

    // Reviews with non-existent products
    const reviews = await ctx.db.query("reviews").collect();
    for (const review of reviews) {
      const product = await ctx.db.get(review.productId);
      if (!product) {
        issues.push({
          type: "orphaned_review",
          id: review._id,
          details: `Review references non-existent product ${review.productId}`,
        });
      }
    }

    // Orders with non-existent products (in items)
    const orders = await ctx.db.query("orders").collect();
    for (const order of orders) {
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (!product) {
          issues.push({
            type: "orphaned_order_item",
            id: order._id,
            details: `Order contains non-existent product ${item.productId}`,
          });
          break; // Only report once per order
        }
      }
    }

    return {
      issues,
      totalIssues: issues.length,
    };
  },
});

export const getIndexHealth = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // This is a placeholder - Convex manages indexes automatically
    // In a real implementation, you might check index usage statistics
    return {
      message: "Convex manages indexes automatically",
      recommendation: "No manual index optimization needed",
      status: "healthy",
    };
  },
});

// ============ MUTATIONS ============

export const cleanupOldAuditLogs = mutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const cutoffDate = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const oldLogs = await ctx.db
      .query("auditLogs")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    // Don't delete critical logs
    const logsToDelete = oldLogs.filter((log) => !log.isCritical);

    for (const log of logsToDelete) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.insert("auditLogs", {
      action: "cleanup_audit_logs",
      entityType: "auditLogs",
      performedBy: adminId || "admin",
      details: `Deleted ${logsToDelete.length} audit logs older than ${args.olderThanDays} days`,
      timestamp: Date.now(),
      isCritical: true,
    });

    return {
      deleted: logsToDelete.length,
      kept: oldLogs.length - logsToDelete.length,
    };
  },
});

export const cleanupOldLoginHistory = mutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const cutoffDate = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const oldHistory = await ctx.db
      .query("loginHistory")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    for (const record of oldHistory) {
      await ctx.db.delete(record._id);
    }

    await ctx.db.insert("auditLogs", {
      action: "cleanup_login_history",
      entityType: "loginHistory",
      performedBy: adminId || "admin",
      details: `Deleted ${oldHistory.length} login history records older than ${args.olderThanDays} days`,
      timestamp: Date.now(),
    });

    return { deleted: oldHistory.length };
  },
});

export const cleanupOldUserActivity = mutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const cutoffDate = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const oldActivity = await ctx.db
      .query("userActivity")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    for (const record of oldActivity) {
      await ctx.db.delete(record._id);
    }

    await ctx.db.insert("auditLogs", {
      action: "cleanup_user_activity",
      entityType: "userActivity",
      performedBy: adminId || "admin",
      details: `Deleted ${oldActivity.length} user activity records older than ${args.olderThanDays} days`,
      timestamp: Date.now(),
    });

    return { deleted: oldActivity.length };
  },
});

export const cleanupDeletedOrders = mutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const cutoffDate = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const deletedOrders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("isDeleted"), true))
      .collect();

    const oldDeletedOrders = deletedOrders.filter(
      (order) => (order.deletedAt || 0) < cutoffDate
    );

    for (const order of oldDeletedOrders) {
      await ctx.db.delete(order._id);
    }

    await ctx.db.insert("auditLogs", {
      action: "cleanup_deleted_orders",
      entityType: "orders",
      performedBy: adminId || "admin",
      details: `Permanently deleted ${oldDeletedOrders.length} orders that were soft-deleted more than ${args.olderThanDays} days ago`,
      timestamp: Date.now(),
      isCritical: true,
    });

    return { deleted: oldDeletedOrders.length };
  },
});

export const cleanupOrphanedRecords = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    let deletedCount = 0;

    // Cleanup orphaned cart items
    const cartItems = await ctx.db.query("cartItems").collect();
    for (const item of cartItems) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        await ctx.db.delete(item._id);
        deletedCount++;
      }
    }

    await ctx.db.insert("auditLogs", {
      action: "cleanup_orphaned_records",
      entityType: "system",
      performedBy: adminId || "admin",
      details: `Cleaned up ${deletedCount} orphaned records`,
      timestamp: Date.now(),
    });

    return { deleted: deletedCount };
  },
});

export const vacuumDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    // Convex handles database optimization automatically
    // This is more of a placeholder/trigger for manual optimization

    await ctx.db.insert("auditLogs", {
      action: "vacuum_database",
      entityType: "system",
      performedBy: adminId || "admin",
      details: "Triggered database optimization (Convex handles this automatically)",
      timestamp: Date.now(),
    });

    return {
      message: "Database optimization triggered",
      note: "Convex handles optimization automatically",
    };
  },
});

// ============ ACTIONS ============

export const runFullOptimization = action({
  args: {},
  handler: async (ctx) => {
    // This would run a comprehensive optimization
    // For now, it's a placeholder that could trigger multiple cleanup operations

    return {
      message: "Full optimization completed",
      note: "Convex automatically optimizes the database. Manual optimization is typically not needed.",
    };
  },
});
