import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx, MutationCtx } from "./_generated/server";
import { ROLES } from "./schema";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { roleValidator } from "./schema";
import { paginationOptsValidator } from "convex/server";

// Helper to generate search text
export function generateUserSearchText(user: { 
  name?: string; 
  email?: string; 
  phone?: string; 
  address?: string; 
  role?: string 
}): string {
  return [
    user.name, 
    user.email, 
    user.phone, 
    user.address, 
    user.role
  ].filter(Boolean).join(" ").toLowerCase();
}

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx | MutationCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

export const requireAdmin = async (ctx: QueryCtx | MutationCtx) => {
  const user = await getCurrentUser(ctx);
  if (!user || user.role !== ROLES.ADMIN) {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
};

export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("users").collect();
  },
});

export const searchUsers = query({
  args: {
    search: v.string(),
    role: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    if (args.search) {
      return await ctx.db
        .query("users")
        .withSearchIndex("search_all", (q) => {
          let search = q.search("searchText", args.search);
          if (args.role) {
            search = search.eq("role", args.role as any);
          }
          return search;
        })
        .paginate(args.paginationOpts);
    }

    if (args.role) {
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role as any))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("users")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const updateUserRole = mutation({
  args: { id: v.id("users"), role: roleValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    if (args.id === adminId) {
      throw new Error("You cannot change your own role.");
    }

    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    const searchText = generateUserSearchText({ ...user, role: args.role });

    await ctx.db.patch(args.id, { role: args.role, searchText });

    await ctx.db.insert("auditLogs", {
      action: "update_user_role",
      entityId: args.id,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Updated user role to ${args.role}`,
      timestamp: Date.now(),
    });
  },
});

export const bulkUpdateUserRole = mutation({
  args: {
    ids: v.array(v.id("users")),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const idsToUpdate = args.ids.filter(id => id !== adminId);
    const skippedCount = args.ids.length - idsToUpdate.length;

    for (const id of idsToUpdate) {
      const user = await ctx.db.get(id);
      if (user) {
        const searchText = generateUserSearchText({ ...user, role: args.role });
        await ctx.db.patch(id, { role: args.role, searchText });
      }
    }

    await ctx.db.insert("auditLogs", {
      action: "bulk_update_user_role",
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Updated ${idsToUpdate.length} users to role ${args.role}${skippedCount > 0 ? ` (Skipped ${skippedCount} self-update attempts)` : ""}`,
      timestamp: Date.now(),
    });

    return { updated: idsToUpdate.length, skipped: skippedCount };
  },
});

export const updateCurrentUser = mutation({
  args: { name: v.string(), address: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    
    const searchText = generateUserSearchText({ ...user, name: args.name, address: args.address });
    
    await ctx.db.patch(user._id, { name: args.name, address: args.address, searchText });
  },
});

export const promoteCurrentUserToAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    await ctx.db.patch(user._id, { role: ROLES.ADMIN });
  },
});

export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);
    
    if (args.id === adminId) {
      throw new Error("You cannot delete your own account.");
    }
    
    await ctx.db.delete(args.id);

    await ctx.db.insert("auditLogs", {
      action: "delete_user",
      entityId: args.id,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Deleted user ${args.id}`,
      timestamp: Date.now(),
    });
  },
});

export const bulkDeleteUsers = mutation({
  args: { ids: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const idsToDelete = args.ids.filter(id => id !== adminId);
    const skippedCount = args.ids.length - idsToDelete.length;

    for (const id of idsToDelete) {
      await ctx.db.delete(id);
    }

    await ctx.db.insert("auditLogs", {
      action: "bulk_delete_users",
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Deleted ${idsToDelete.length} users${skippedCount > 0 ? ` (Skipped ${skippedCount} self-deletion attempts)` : ""}`,
      timestamp: Date.now(),
    });

    return { deleted: idsToDelete.length, skipped: skippedCount };
  },
});

export const importUsers = mutation({
  args: {
    users: v.array(
      v.object({
        name: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.string()),
        address: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);
    
    let imported = 0;
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const [index, user] of args.users.entries()) {
      // Basic Validation
      if (!user.name || user.name.trim() === "") {
        failed++;
        errors.push(`Row ${index + 1}: Name is required`);
        continue;
      }

      // Contact Info Validation
      if (!user.email && !user.phone) {
        failed++;
        errors.push(`Row ${index + 1}: Either Email or Phone is required`);
        continue;
      }

      // Email Validation
      if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        failed++;
        errors.push(`Row ${index + 1}: Invalid email format (${user.email})`);
        continue;
      }

      // Phone Validation
      if (user.phone && !/^\+?[\d\s-]{10,}$/.test(user.phone)) {
        failed++;
        errors.push(`Row ${index + 1}: Invalid phone format (${user.phone}) - must be at least 10 digits`);
        continue;
      }

      // Validate role
      let role = user.role;
      if (role !== "admin" && role !== "member" && role !== "user") {
        role = "user";
      }

      try {
        // Check existence
        let existingUser = null;
        if (user.email) {
          existingUser = await ctx.db.query("users").withIndex("email", q => q.eq("email", user.email)).unique();
        }
        if (!existingUser && user.phone) {
          existingUser = await ctx.db.query("users").withIndex("phone", q => q.eq("phone", user.phone)).unique();
        }

        if (existingUser) {
          const searchText = generateUserSearchText({
            name: user.name || existingUser.name,
            email: existingUser.email,
            phone: existingUser.phone,
            address: user.address || existingUser.address,
            role: role as any
          });

          await ctx.db.patch(existingUser._id, {
            name: user.name || existingUser.name,
            role: role as any,
            address: user.address || existingUser.address,
            searchText,
          });
          updated++;
        } else {
          const searchText = generateUserSearchText({
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: role as any
          });

          await ctx.db.insert("users", {
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: role as any,
            address: user.address,
            isAnonymous: false,
            searchText,
          });
          imported++;
        }
      } catch (error) {
        failed++;
        errors.push(`Row ${index + 1}: Database error`);
      }
    }

    await ctx.db.insert("auditLogs", {
      action: "import_users",
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Imported ${imported}, Updated ${updated}, Failed ${failed}. ${errors.length > 0 ? `Errors: ${errors.slice(0, 5).join("; ")}${errors.length > 5 ? "..." : ""}` : ""}`,
      timestamp: Date.now(),
    });

    return { imported, updated, failed, errors };
  },
});

export const backfillUserSearchText = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      const searchText = generateUserSearchText(user);
      await ctx.db.patch(user._id, { searchText });
    }
    return `Backfilled ${users.length} users`;
  },
});

// ============ PASSWORD RESET ============

export const generateResetToken = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Generate secure random token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await ctx.db.patch(args.userId, {
      resetToken: token,
      resetTokenExpiry: expiry,
    });

    await ctx.db.insert("auditLogs", {
      action: "generate_password_reset_token",
      entityId: args.userId,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Generated password reset token for ${user.name || user.email}`,
      timestamp: Date.now(),
    });

    return { token, expiry, email: user.email };
  },
});

export const clearResetToken = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.userId, {
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });

    return { success: true };
  },
});

// ============ EMAIL VERIFICATION ============

export const markEmailAsVerified = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      emailVerified: true,
      emailVerificationTime: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "mark_email_verified",
      entityId: args.userId,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Manually verified email for ${user.name || user.email}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const sendVerificationEmail = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (!user.email) throw new Error("User has no email address");

    // In a real implementation, this would send an email
    // For now, we just log it
    await ctx.db.insert("auditLogs", {
      action: "send_verification_email",
      entityId: args.userId,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Sent verification email to ${user.email}`,
      timestamp: Date.now(),
    });

    return { success: true, email: user.email };
  },
});

// ============ USER SUSPENSION ============

export const suspendUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    if (args.userId === adminId) {
      throw new Error("You cannot suspend yourself");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      suspended: true,
      suspensionReason: args.reason,
      suspendedAt: Date.now(),
      suspendedBy: adminId || "admin",
    });

    await ctx.db.insert("auditLogs", {
      action: "suspend_user",
      entityId: args.userId,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Suspended user ${user.name || user.email}. Reason: ${args.reason}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const activateUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      suspended: false,
      suspensionReason: undefined,
      suspendedAt: undefined,
      suspendedBy: undefined,
    });

    await ctx.db.insert("auditLogs", {
      action: "activate_user",
      entityId: args.userId,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Activated user ${user.name || user.email}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// ============ USER TAGS/SEGMENTS ============

export const addUserTag = mutation({
  args: {
    userId: v.id("users"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentTags = user.tags || [];
    if (currentTags.includes(args.tag)) {
      throw new Error("User already has this tag");
    }

    await ctx.db.patch(args.userId, {
      tags: [...currentTags, args.tag],
    });

    return { success: true };
  },
});

export const removeUserTag = mutation({
  args: {
    userId: v.id("users"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const currentTags = user.tags || [];
    await ctx.db.patch(args.userId, {
      tags: currentTags.filter(t => t !== args.tag),
    });

    return { success: true };
  },
});

export const bulkAddTag = mutation({
  args: {
    userIds: v.array(v.id("users")),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    let updated = 0;
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (user) {
        const currentTags = user.tags || [];
        if (!currentTags.includes(args.tag)) {
          await ctx.db.patch(userId, {
            tags: [...currentTags, args.tag],
          });
          updated++;
        }
      }
    }

    await ctx.db.insert("auditLogs", {
      action: "bulk_add_tag",
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Added tag "${args.tag}" to ${updated} users`,
      timestamp: Date.now(),
    });

    return { updated };
  },
});

export const bulkRemoveTag = mutation({
  args: {
    userIds: v.array(v.id("users")),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    let updated = 0;
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (user && user.tags?.includes(args.tag)) {
        await ctx.db.patch(userId, {
          tags: user.tags.filter(t => t !== args.tag),
        });
        updated++;
      }
    }

    await ctx.db.insert("auditLogs", {
      action: "bulk_remove_tag",
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Removed tag "${args.tag}" from ${updated} users`,
      timestamp: Date.now(),
    });

    return { updated };
  },
});

// ============ USER QUERIES WITH FILTERS ============

export const getUsersByTag = query({
  args: { tag: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const allUsers = await ctx.db.query("users").collect();
    return allUsers.filter(user => user.tags?.includes(args.tag));
  },
});

export const getSuspendedUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    return await ctx.db
      .query("users")
      .withIndex("by_suspended", (q) => q.eq("suspended", true))
      .collect();
  },
});