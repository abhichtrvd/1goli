import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Campaign types
export const campaignTypeValidator = v.union(
  v.literal("email"),
  v.literal("sms"),
  v.literal("push")
);

export const segmentValidator = v.union(
  v.literal("all"),
  v.literal("vip"),
  v.literal("new_users"),
  v.literal("inactive"),
  v.literal("custom")
);

export const campaignStatusValidator = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("sending"),
  v.literal("sent"),
  v.literal("failed")
);

// ============ QUERIES ============

export const getCampaigns = query({
  args: {
    status: v.optional(campaignStatusValidator),
    type: v.optional(campaignTypeValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let campaigns = await ctx.db.query("campaigns").order("desc").collect();

    if (args.status) {
      campaigns = campaigns.filter((c) => c.status === args.status);
    }

    if (args.type) {
      campaigns = campaigns.filter((c) => c.type === args.type);
    }

    return campaigns;
  },
});

export const getCampaign = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getCampaignStats = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) throw new Error("Campaign not found");

    const recipients = campaign.recipientCount || 0;
    const delivered = campaign.deliveredCount || 0;
    const opened = campaign.openedCount || 0;
    const clicked = campaign.clickedCount || 0;
    const failed = campaign.failedCount || 0;

    const deliveryRate = recipients > 0 ? (delivered / recipients) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const failureRate = recipients > 0 ? (failed / recipients) * 100 : 0;

    return {
      recipients,
      delivered,
      opened,
      clicked,
      failed,
      deliveryRate: deliveryRate.toFixed(2),
      openRate: openRate.toFixed(2),
      clickRate: clickRate.toFixed(2),
      failureRate: failureRate.toFixed(2),
    };
  },
});

// ============ MUTATIONS ============

export const createCampaign = mutation({
  args: {
    name: v.string(),
    subject: v.optional(v.string()),
    content: v.string(),
    previewText: v.optional(v.string()),
    type: campaignTypeValidator,
    segment: segmentValidator,
    customRecipients: v.optional(v.array(v.string())), // User IDs or emails
    scheduledFor: v.optional(v.number()),
    abTestEnabled: v.optional(v.boolean()),
    abTestVariantB: v.optional(
      v.object({
        subject: v.optional(v.string()),
        content: v.string(),
        previewText: v.optional(v.string()),
      })
    ),
    abTestSplitPercent: v.optional(v.number()), // % for variant A
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const campaignId = await ctx.db.insert("campaigns", {
      name: args.name,
      subject: args.subject,
      content: args.content,
      previewText: args.previewText,
      type: args.type,
      segment: args.segment,
      customRecipients: args.customRecipients,
      scheduledFor: args.scheduledFor,
      status: args.scheduledFor ? "scheduled" : "draft",
      abTestEnabled: args.abTestEnabled || false,
      abTestVariantB: args.abTestVariantB,
      abTestSplitPercent: args.abTestSplitPercent || 50,
      recipientCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      failedCount: 0,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    return { campaignId };
  },
});

export const updateCampaign = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    previewText: v.optional(v.string()),
    segment: v.optional(segmentValidator),
    customRecipients: v.optional(v.array(v.string())),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const campaign = await ctx.db.get(args.id);
    if (!campaign) throw new Error("Campaign not found");

    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      throw new Error("Cannot edit campaign that is already sent or sending");
    }

    const updates: any = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.content !== undefined) updates.content = args.content;
    if (args.previewText !== undefined) updates.previewText = args.previewText;
    if (args.segment !== undefined) updates.segment = args.segment;
    if (args.customRecipients !== undefined)
      updates.customRecipients = args.customRecipients;
    if (args.scheduledFor !== undefined) {
      updates.scheduledFor = args.scheduledFor;
      updates.status = "scheduled";
    }

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

export const deleteCampaign = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const campaign = await ctx.db.get(args.id);
    if (!campaign) throw new Error("Campaign not found");

    if (campaign.status === "sending") {
      throw new Error("Cannot delete campaign that is currently sending");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const scheduleCampaign = mutation({
  args: {
    id: v.id("campaigns"),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const campaign = await ctx.db.get(args.id);
    if (!campaign) throw new Error("Campaign not found");

    if (args.scheduledFor <= Date.now()) {
      throw new Error("Scheduled time must be in the future");
    }

    await ctx.db.patch(args.id, {
      scheduledFor: args.scheduledFor,
      status: "scheduled",
    });

    return { success: true };
  },
});

// ============ ACTIONS ============

export const sendCampaign = action({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    // Verify admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const campaign = await ctx.runQuery(internal.campaigns.getCampaignInternal, {
      id: args.campaignId,
    });

    if (!campaign) throw new Error("Campaign not found");

    if (campaign.status === "sent") {
      throw new Error("Campaign already sent");
    }

    // Update status to sending
    await ctx.runMutation(internal.campaigns.updateCampaignStatus, {
      id: args.campaignId,
      status: "sending",
    });

    try {
      // Get recipients based on segment
      const recipients = await ctx.runQuery(
        internal.campaigns.getRecipientsBySegment,
        {
          segment: campaign.segment,
          customRecipients: campaign.customRecipients,
        }
      );

      // Update recipient count
      await ctx.runMutation(internal.campaigns.updateCampaignCounts, {
        id: args.campaignId,
        recipientCount: recipients.length,
      });

      // Send campaign (in real implementation, integrate with email/SMS service)
      // For now, we'll simulate the send
      let delivered = 0;
      let failed = 0;

      for (const recipient of recipients) {
        try {
          // Simulate send (replace with actual API call)
          // await sendEmail/SMS/Push based on campaign.type
          delivered++;
        } catch (error) {
          failed++;
        }
      }

      // Update final counts
      await ctx.runMutation(internal.campaigns.updateCampaignCounts, {
        id: args.campaignId,
        deliveredCount: delivered,
        failedCount: failed,
      });

      // Update status to sent
      await ctx.runMutation(internal.campaigns.updateCampaignStatus, {
        id: args.campaignId,
        status: "sent",
        sentAt: Date.now(),
      });

      return {
        success: true,
        delivered,
        failed,
      };
    } catch (error) {
      // Update status to failed
      await ctx.runMutation(internal.campaigns.updateCampaignStatus, {
        id: args.campaignId,
        status: "failed",
      });

      throw error;
    }
  },
});

export const trackCampaignOpen = mutation({
  args: {
    campaignId: v.id("campaigns"),
    recipientId: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return;

    await ctx.db.patch(args.campaignId, {
      openedCount: (campaign.openedCount || 0) + 1,
    });
  },
});

export const trackCampaignClick = mutation({
  args: {
    campaignId: v.id("campaigns"),
    recipientId: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) return;

    await ctx.db.patch(args.campaignId, {
      clickedCount: (campaign.clickedCount || 0) + 1,
    });
  },
});

// ============ INTERNAL FUNCTIONS ============

export const getCampaignInternal = internalMutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateCampaignStatus = internalMutation({
  args: {
    id: v.id("campaigns"),
    status: campaignStatusValidator,
    sentAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };
    if (args.sentAt) updates.sentAt = args.sentAt;

    await ctx.db.patch(args.id, updates);
  },
});

export const updateCampaignCounts = internalMutation({
  args: {
    id: v.id("campaigns"),
    recipientCount: v.optional(v.number()),
    deliveredCount: v.optional(v.number()),
    failedCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.recipientCount !== undefined)
      updates.recipientCount = args.recipientCount;
    if (args.deliveredCount !== undefined)
      updates.deliveredCount = args.deliveredCount;
    if (args.failedCount !== undefined)
      updates.failedCount = args.failedCount;

    await ctx.db.patch(args.id, updates);
  },
});

export const getRecipientsBySegment = query({
  args: {
    segment: segmentValidator,
    customRecipients: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    if (args.segment === "custom" && args.customRecipients) {
      // Get specific users
      const users = [];
      for (const userId of args.customRecipients) {
        const user = await ctx.db.get(userId as Id<"users">);
        if (user && user.email) {
          users.push({
            id: user._id,
            email: user.email,
            name: user.name,
          });
        }
      }
      return users;
    }

    // Get users based on segment
    const allUsers = await ctx.db.query("users").collect();
    const now = Date.now();

    let filteredUsers = allUsers;

    switch (args.segment) {
      case "vip":
        // Users with role admin or member, or users with high order count
        filteredUsers = allUsers.filter(
          (u) => u.role === "admin" || u.role === "member"
        );
        break;

      case "new_users":
        // Users created in last 30 days
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        filteredUsers = allUsers.filter(
          (u) => u._creationTime > thirtyDaysAgo
        );
        break;

      case "inactive":
        // Users who haven't been active in 60 days
        const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
        filteredUsers = allUsers.filter(
          (u) => (u.lastActiveAt || u._creationTime) < sixtyDaysAgo
        );
        break;

      case "all":
      default:
        filteredUsers = allUsers;
    }

    return filteredUsers
      .filter((u) => u.email && !u.suspended)
      .map((u) => ({
        id: u._id,
        email: u.email!,
        name: u.name,
      }));
  },
});
