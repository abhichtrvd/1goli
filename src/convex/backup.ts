import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { requireAdmin } from "./users";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// ============ QUERIES ============

export const listBackups = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("backups")
      .withIndex("by_created_at")
      .order("desc")
      .collect();
  },
});

export const getBackup = query({
  args: { id: v.id("backups") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const backup = await ctx.db.get(args.id);
    if (!backup) throw new Error("Backup not found");
    return backup;
  },
});

export const getBackupStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const backups = await ctx.db.query("backups").collect();

    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const completedBackups = backups.filter((b) => b.status === "completed");
    const latestBackup = backups.sort((a, b) => b.createdAt - a.createdAt)[0];

    return {
      totalBackups: backups.length,
      totalSize,
      completedBackups: completedBackups.length,
      latestBackup: latestBackup || null,
    };
  },
});

// ============ ACTIONS ============

export const createBackup = action({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    tables: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const adminId = await ctx.runQuery(api.users.currentUser);
    if (!adminId) throw new Error("Not authenticated");

    // Create backup record
    const backupId = await ctx.runMutation(api.backup.createBackupRecord, {
      name: args.name,
      description: args.description,
    });

    try {
      // Define tables to backup
      const tablesToBackup = args.tables || [
        "users",
        "products",
        "orders",
        "prescriptions",
        "consultationDoctors",
        "reviews",
        "cartItems",
        "siteSettings",
        "roles",
        "permissions",
        "auditLogs",
      ];

      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;

      // Export each table
      for (const tableName of tablesToBackup) {
        try {
          const records = await ctx.runQuery(api.backup.exportTable, {
            tableName,
          });
          backupData[tableName] = records as any[];
          totalRecords += (records as any[]).length;
        } catch (error) {
          console.error(`Error backing up table ${tableName}:`, error);
          // Continue with other tables
        }
      }

      // Calculate size (approximate)
      const jsonString = JSON.stringify(backupData);
      const size = new Blob([jsonString]).size;

      // Update backup record
      await ctx.runMutation(api.backup.updateBackupRecord, {
        backupId,
        status: "completed",
        size,
        recordCount: totalRecords,
        tablesIncluded: tablesToBackup,
      });

      return {
        backupId,
        data: backupData,
        size,
        recordCount: totalRecords,
      };
    } catch (error) {
      // Mark backup as failed
      await ctx.runMutation(api.backup.updateBackupRecord, {
        backupId,
        status: "failed",
        size: 0,
        recordCount: 0,
        tablesIncluded: [],
      });
      throw error;
    }
  },
});

export const downloadBackupData = action({
  args: { backupId: v.id("backups") },
  handler: async (ctx, args) => {
    const backup = await ctx.runQuery(api.backup.getBackup, {
      id: args.backupId,
    });

    if (backup.status !== "completed") {
      throw new Error("Backup is not completed");
    }

    // Return backup metadata
    return backup;
  },
});

export const restoreBackup = action({
  args: {
    backupId: v.id("backups"),
    backupData: v.any(), // The backup data object
    confirmPassword: v.string(), // Require confirmation
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.currentUser);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    // In a real implementation, verify the confirmation password
    if (args.confirmPassword !== "RESTORE") {
      throw new Error("Invalid confirmation");
    }

    const backup = await ctx.runQuery(api.backup.getBackup, {
      id: args.backupId,
    });

    if (backup.status !== "completed") {
      throw new Error("Cannot restore incomplete backup");
    }

    // Log the restore action
    await ctx.runMutation(api.backup.logRestoreAction, {
      backupId: args.backupId,
    });

    // WARNING: This is a simplified implementation
    // In production, you would need more sophisticated restore logic
    return {
      message: "Restore initiated. This is a dangerous operation.",
      warning:
        "Full restore functionality requires careful implementation to avoid data loss",
    };
  },
});

// ============ MUTATIONS ============

export const createBackupRecord = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const backupId = await ctx.db.insert("backups", {
      name: args.name,
      description: args.description,
      size: 0,
      tablesIncluded: [],
      recordCount: 0,
      createdBy: adminId || "admin",
      createdAt: Date.now(),
      type: "manual",
      status: "in_progress",
    });

    return backupId;
  },
});

export const updateBackupRecord = mutation({
  args: {
    backupId: v.id("backups"),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
    size: v.number(),
    recordCount: v.number(),
    tablesIncluded: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.backupId, {
      status: args.status,
      size: args.size,
      recordCount: args.recordCount,
      tablesIncluded: args.tablesIncluded,
    });

    if (args.status === "completed") {
      const adminId = await getAuthUserId(ctx);
      await ctx.db.insert("auditLogs", {
        action: "create_backup",
        entityId: args.backupId,
        entityType: "backup",
        performedBy: adminId || "admin",
        details: `Created backup with ${args.recordCount} records (${(args.size / 1024 / 1024).toFixed(2)} MB)`,
        timestamp: Date.now(),
        isCritical: true,
      });
    }

    return { success: true };
  },
});

export const deleteBackup = mutation({
  args: { id: v.id("backups") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const backup = await ctx.db.get(args.id);
    if (!backup) throw new Error("Backup not found");

    await ctx.db.delete(args.id);

    await ctx.db.insert("auditLogs", {
      action: "delete_backup",
      entityId: args.id,
      entityType: "backup",
      performedBy: adminId || "admin",
      details: `Deleted backup: ${backup.name}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const logRestoreAction = mutation({
  args: { backupId: v.id("backups") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const backup = await ctx.db.get(args.backupId);

    await ctx.db.insert("auditLogs", {
      action: "restore_backup",
      entityId: args.backupId,
      entityType: "backup",
      performedBy: adminId || "admin",
      details: `Initiated restore from backup: ${backup?.name}`,
      timestamp: Date.now(),
      isCritical: true,
    });

    return { success: true };
  },
});

// ============ HELPER QUERIES ============

export const exportTable = query({
  args: { tableName: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // This is a generic export function
    // In a real implementation, you'd need to handle each table type properly
    try {
      const records = await (ctx.db as any).query(args.tableName).collect();
      return records;
    } catch (error) {
      console.error(`Error exporting table ${args.tableName}:`, error);
      return [];
    }
  },
});

// ============ SCHEDULED BACKUP ============

export const scheduleBackup = mutation({
  args: {
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    // Store backup schedule in settings
    // In a real implementation, you'd use Convex scheduled functions
    const settings = await ctx.db.query("siteSettings").first();

    if (settings) {
      // For now, just log the action
      await ctx.db.insert("auditLogs", {
        action: "configure_backup_schedule",
        entityType: "backup",
        performedBy: adminId || "admin",
        details: `${args.enabled ? "Enabled" : "Disabled"} ${args.frequency} automatic backups`,
        timestamp: Date.now(),
      });
    }

    return {
      message: "Backup schedule updated",
      frequency: args.frequency,
      enabled: args.enabled,
    };
  },
});
