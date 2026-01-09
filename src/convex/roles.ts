import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { requireAdmin } from "./users";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// ============ QUERIES ============

export const getAllRoles = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("roles").order("desc").collect();
  },
});

export const getRole = query({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const role = await ctx.db.get(args.id);
    if (!role) throw new Error("Role not found");

    // Get member count
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("roleId"), args.id))
      .collect();

    return {
      ...role,
      memberCount: users.length,
    };
  },
});

export const getRolePermissions = query({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");

    // Get all permissions
    const allPermissions = await ctx.db.query("permissions").collect();

    return {
      role,
      permissions: allPermissions.map((p) => ({
        ...p,
        granted: role.permissions.includes(p.key),
      })),
    };
  },
});

export const getAllPermissions = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("permissions").collect();
  },
});

export const getRolesWithMemberCount = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const roles = await ctx.db.query("roles").order("desc").collect();

    // Get member count for each role
    const rolesWithCount = await Promise.all(
      roles.map(async (role) => {
        const users = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("roleId"), role._id))
          .collect();

        return {
          ...role,
          memberCount: users.length,
        };
      })
    );

    return rolesWithCount;
  },
});

// ============ MUTATIONS ============

export const createRole = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    // Check if role name already exists
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existing) {
      throw new Error("Role with this name already exists");
    }

    const roleId = await ctx.db.insert("roles", {
      name: args.name,
      description: args.description,
      permissions: args.permissions,
      isSystem: false,
      createdBy: adminId || "admin",
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "create_role",
      entityId: roleId,
      entityType: "role",
      performedBy: adminId || "admin",
      details: `Created role: ${args.name}`,
      timestamp: Date.now(),
    });

    return roleId;
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("roles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const role = await ctx.db.get(args.id);
    if (!role) throw new Error("Role not found");

    if (role.isSystem) {
      throw new Error("Cannot modify system roles");
    }

    // Check for duplicate name if name is being changed
    if (args.name && args.name !== role.name) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", args.name))
        .unique();

      if (existing) {
        throw new Error("Role with this name already exists");
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.name && { name: args.name }),
      ...(args.description && { description: args.description }),
      ...(args.permissions && { permissions: args.permissions }),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "update_role",
      entityId: args.id,
      entityType: "role",
      performedBy: adminId || "admin",
      details: `Updated role: ${role.name}`,
      timestamp: Date.now(),
    });

    return args.id;
  },
});

export const deleteRole = mutation({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const role = await ctx.db.get(args.id);
    if (!role) throw new Error("Role not found");

    if (role.isSystem) {
      throw new Error("Cannot delete system roles");
    }

    // Check if any users have this role
    const usersWithRole = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("roleId"), args.id))
      .collect();

    if (usersWithRole.length > 0) {
      throw new Error(
        `Cannot delete role. ${usersWithRole.length} user(s) still have this role`
      );
    }

    await ctx.db.delete(args.id);

    await ctx.db.insert("auditLogs", {
      action: "delete_role",
      entityId: args.id,
      entityType: "role",
      performedBy: adminId || "admin",
      details: `Deleted role: ${role.name}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// ============ INITIALIZATION ============

export const initializeDefaultRoles = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    // Check if roles already exist
    const existingRoles = await ctx.db.query("roles").collect();
    if (existingRoles.length > 0) {
      return { message: "Roles already initialized" };
    }

    // Define default permissions
    const defaultPermissions = [
      // Users
      { resource: "users", action: "create", description: "Create new users", category: "Users", key: "users.create" },
      { resource: "users", action: "read", description: "View user information", category: "Users", key: "users.read" },
      { resource: "users", action: "update", description: "Update user information", category: "Users", key: "users.update" },
      { resource: "users", action: "delete", description: "Delete users", category: "Users", key: "users.delete" },
      { resource: "users", action: "suspend", description: "Suspend/activate users", category: "Users", key: "users.suspend" },

      // Orders
      { resource: "orders", action: "create", description: "Create new orders", category: "Orders", key: "orders.create" },
      { resource: "orders", action: "read", description: "View orders", category: "Orders", key: "orders.read" },
      { resource: "orders", action: "update", description: "Update order status", category: "Orders", key: "orders.update" },
      { resource: "orders", action: "delete", description: "Delete orders", category: "Orders", key: "orders.delete" },
      { resource: "orders", action: "refund", description: "Process refunds", category: "Orders", key: "orders.refund" },

      // Products
      { resource: "products", action: "create", description: "Create new products", category: "Products", key: "products.create" },
      { resource: "products", action: "read", description: "View products", category: "Products", key: "products.read" },
      { resource: "products", action: "update", description: "Update product information", category: "Products", key: "products.update" },
      { resource: "products", action: "delete", description: "Delete products", category: "Products", key: "products.delete" },
      { resource: "products", action: "manage_stock", description: "Manage product inventory", category: "Products", key: "products.manage_stock" },

      // Doctors
      { resource: "doctors", action: "create", description: "Add new doctors", category: "Doctors", key: "doctors.create" },
      { resource: "doctors", action: "read", description: "View doctor information", category: "Doctors", key: "doctors.read" },
      { resource: "doctors", action: "update", description: "Update doctor information", category: "Doctors", key: "doctors.update" },
      { resource: "doctors", action: "delete", description: "Remove doctors", category: "Doctors", key: "doctors.delete" },

      // Prescriptions
      { resource: "prescriptions", action: "create", description: "Create prescriptions", category: "Prescriptions", key: "prescriptions.create" },
      { resource: "prescriptions", action: "read", description: "View prescriptions", category: "Prescriptions", key: "prescriptions.read" },
      { resource: "prescriptions", action: "update", description: "Update prescription status", category: "Prescriptions", key: "prescriptions.update" },
      { resource: "prescriptions", action: "delete", description: "Delete prescriptions", category: "Prescriptions", key: "prescriptions.delete" },

      // Settings
      { resource: "settings", action: "read", description: "View system settings", category: "Settings", key: "settings.read" },
      { resource: "settings", action: "update", description: "Modify system settings", category: "Settings", key: "settings.update" },

      // Reports
      { resource: "reports", action: "view", description: "View analytics and reports", category: "Reports", key: "reports.view" },
      { resource: "reports", action: "export", description: "Export reports", category: "Reports", key: "reports.export" },

      // Roles
      { resource: "roles", action: "manage", description: "Manage roles and permissions", category: "Roles", key: "roles.manage" },

      // Backup
      { resource: "backup", action: "create", description: "Create backups", category: "Backup", key: "backup.create" },
      { resource: "backup", action: "restore", description: "Restore from backup", category: "Backup", key: "backup.restore" },
    ];

    // Insert permissions
    const permissionIds = await Promise.all(
      defaultPermissions.map((perm) => ctx.db.insert("permissions", perm))
    );

    // Define default roles
    const superAdminPerms = defaultPermissions.map((p) => p.key);
    const adminPerms = defaultPermissions
      .filter((p) => !p.key.includes("roles.manage") && !p.key.includes("backup.restore"))
      .map((p) => p.key);
    const managerPerms = defaultPermissions
      .filter((p) =>
        p.key.includes("read") ||
        p.key.includes("update") ||
        p.key.includes("orders") ||
        p.key.includes("prescriptions") ||
        p.category === "Reports"
      )
      .map((p) => p.key);
    const staffPerms = defaultPermissions
      .filter((p) => p.key.includes("read") || p.key === "orders.update" || p.key === "prescriptions.update")
      .map((p) => p.key);
    const customerPerms = ["orders.read", "prescriptions.read", "products.read"];

    const roles = [
      {
        name: "Super Admin",
        description: "Full system access with all permissions",
        permissions: superAdminPerms,
        isSystem: true,
      },
      {
        name: "Admin",
        description: "Administrative access without role and backup management",
        permissions: adminPerms,
        isSystem: true,
      },
      {
        name: "Manager",
        description: "Can manage orders, products, and view reports",
        permissions: managerPerms,
        isSystem: true,
      },
      {
        name: "Staff",
        description: "Can view and update orders and prescriptions",
        permissions: staffPerms,
        isSystem: true,
      },
      {
        name: "Customer",
        description: "Basic customer access",
        permissions: customerPerms,
        isSystem: true,
      },
    ];

    const roleIds = await Promise.all(
      roles.map((role) =>
        ctx.db.insert("roles", {
          ...role,
          createdBy: adminId || "system",
          createdAt: Date.now(),
        })
      )
    );

    await ctx.db.insert("auditLogs", {
      action: "initialize_roles",
      entityType: "role",
      performedBy: adminId || "admin",
      details: `Initialized ${roles.length} default roles and ${defaultPermissions.length} permissions`,
      timestamp: Date.now(),
    });

    return {
      message: "Default roles and permissions initialized successfully",
      rolesCreated: roleIds.length,
      permissionsCreated: permissionIds.length,
    };
  },
});

// ============ PERMISSION CHECK HELPERS ============

export const checkPermission = query({
  args: {
    userId: v.id("users"),
    permissionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;

    // Admin role has all permissions
    if (user.role === "admin") return true;

    // Check role-based permissions
    if (user.roleId) {
      const role = await ctx.db.get(user.roleId);
      if (role) {
        return role.permissions.includes(args.permissionKey);
      }
    }

    return false;
  },
});
