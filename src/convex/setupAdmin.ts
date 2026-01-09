import { mutation } from "./_generated/server";
import { ROLES } from "./schema";

/**
 * This is a one-time setup script to promote the first user to admin.
 * Run this with: npx convex run setupAdmin:promoteFirstUser
 */
export const promoteFirstUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Get the first user in the database
    const user = await ctx.db.query("users").first();

    if (!user) {
      throw new Error("No users found in the database. Please sign up first.");
    }

    if (user.role === ROLES.ADMIN) {
      return {
        success: true,
        message: `User ${user.name || user.email} is already an admin.`,
        userId: user._id,
      };
    }

    // Promote to admin
    await ctx.db.patch(user._id, { role: ROLES.ADMIN });

    return {
      success: true,
      message: `Successfully promoted ${user.name || user.email || user.phone} to admin.`,
      userId: user._id,
    };
  },
});

/**
 * Check if there are any admin users
 */
export const checkAdminUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", ROLES.ADMIN))
      .collect();

    const totalUsers = await ctx.db.query("users").collect();

    return {
      totalUsers: totalUsers.length,
      adminCount: admins.length,
      admins: admins.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
      })),
    };
  },
});
