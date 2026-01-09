import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// ============ QUERIES ============

export const getTeamMembers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Get all non-customer users
    const allUsers = await ctx.db.query("users").collect();
    const teamMembers = allUsers.filter(
      (user) => user.role === "admin" || user.role === "member"
    );

    // Enrich with role information
    const enrichedMembers = await Promise.all(
      teamMembers.map(async (member) => {
        let roleInfo = null;
        if (member.roleId) {
          roleInfo = await ctx.db.get(member.roleId);
        }

        return {
          ...member,
          roleInfo,
        };
      })
    );

    return enrichedMembers;
  },
});

export const getTeamInvitations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const invitations = await ctx.db
      .query("teamInvitations")
      .order("desc")
      .collect();

    return invitations;
  },
});

export const getPendingInvitations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const invitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return invitations;
  },
});

export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Check if expired
    if (invitation.expiresAt < Date.now()) {
      if (invitation.status === "pending") {
        await ctx.db.patch(invitation._id, { status: "expired" });
      }
      throw new Error("Invitation has expired");
    }

    return invitation;
  },
});

// ============ MUTATIONS ============

export const inviteTeamMember = mutation({
  args: {
    email: v.string(),
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email format");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Check if pending invitation exists
    const existingInvitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .unique();

    if (existingInvitation) {
      throw new Error("Pending invitation already exists for this email");
    }

    // Get role information
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Generate invitation token
    const token =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Create invitation (expires in 7 days)
    const invitationId = await ctx.db.insert("teamInvitations", {
      email: args.email,
      roleId: args.roleId,
      roleName: role.name,
      invitedBy: adminId || "admin",
      invitedAt: Date.now(),
      status: "pending",
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      token,
    });

    await ctx.db.insert("auditLogs", {
      action: "invite_team_member",
      entityId: invitationId,
      entityType: "teamInvitation",
      performedBy: adminId || "admin",
      details: `Invited ${args.email} as ${role.name}`,
      timestamp: Date.now(),
    });

    return {
      invitationId,
      token,
      invitationUrl: `/team/accept-invitation?token=${token}`,
    };
  },
});

export const cancelInvitation = mutation({
  args: { invitationId: v.id("teamInvitations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Can only cancel pending invitations");
    }

    await ctx.db.patch(args.invitationId, { status: "cancelled" });

    await ctx.db.insert("auditLogs", {
      action: "cancel_invitation",
      entityId: args.invitationId,
      entityType: "teamInvitation",
      performedBy: adminId || "admin",
      details: `Cancelled invitation for ${invitation.email}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const resendInvitation = mutation({
  args: { invitationId: v.id("teamInvitations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Generate new token and extend expiry
    const newToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    await ctx.db.patch(args.invitationId, {
      token: newToken,
      status: "pending",
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      invitedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "resend_invitation",
      entityId: args.invitationId,
      entityType: "teamInvitation",
      performedBy: adminId || "admin",
      details: `Resent invitation to ${invitation.email}`,
      timestamp: Date.now(),
    });

    return {
      token: newToken,
      invitationUrl: `/team/accept-invitation?token=${newToken}`,
    };
  },
});

export const acceptInvitation = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error("Invitation is no longer valid");
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    // Get user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify email matches
    if (user.email !== invitation.email) {
      throw new Error("Email mismatch");
    }

    // Update user with role
    await ctx.db.patch(args.userId, {
      roleId: invitation.roleId,
      role: "member", // Set to member role
    });

    // Update invitation status
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "accept_invitation",
      entityId: invitation._id,
      entityType: "teamInvitation",
      performedBy: args.userId,
      details: `${user.email} accepted team invitation as ${invitation.roleName}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const updateTeamMemberRole = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    // Prevent self-modification
    if (args.userId === adminId) {
      throw new Error("You cannot change your own role");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    await ctx.db.patch(args.userId, {
      roleId: args.roleId,
    });

    await ctx.db.insert("auditLogs", {
      action: "update_team_member_role",
      entityId: args.userId,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Updated ${user.name || user.email}'s role to ${role.name}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const deactivateTeamMember = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    // Prevent self-deactivation
    if (args.userId === adminId) {
      throw new Error("You cannot deactivate yourself");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      suspended: true,
      suspensionReason: args.reason || "Account deactivated by admin",
      suspendedAt: Date.now(),
      suspendedBy: adminId || "admin",
    });

    await ctx.db.insert("auditLogs", {
      action: "deactivate_team_member",
      entityId: args.userId,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Deactivated team member ${user.name || user.email}. ${args.reason ? `Reason: ${args.reason}` : ""}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const activateTeamMember = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      suspended: false,
      suspensionReason: undefined,
      suspendedAt: undefined,
      suspendedBy: undefined,
    });

    await ctx.db.insert("auditLogs", {
      action: "activate_team_member",
      entityId: args.userId,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Activated team member ${user.name || user.email}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const removeTeamMember = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    // Prevent self-removal
    if (args.userId === adminId) {
      throw new Error("You cannot remove yourself from the team");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Change role to user (customer)
    await ctx.db.patch(args.userId, {
      role: "user",
      roleId: undefined,
    });

    await ctx.db.insert("auditLogs", {
      action: "remove_team_member",
      entityId: args.userId,
      entityType: "user",
      performedBy: adminId || "admin",
      details: `Removed ${user.name || user.email} from team`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
