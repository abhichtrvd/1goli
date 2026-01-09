import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";

// ============ QUERIES ============

export const getConversations = query({
  args: {
    status: v.optional(
      v.union(v.literal("open"), v.literal("closed"), v.literal("archived"))
    ),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let conversations = await ctx.db
      .query("conversations")
      .withIndex("by_last_message")
      .order("desc")
      .collect();

    if (args.status) {
      conversations = conversations.filter((c) => c.status === args.status);
    }

    if (args.assignedTo) {
      conversations = conversations.filter(
        (c) => c.assignedTo === args.assignedTo
      );
    }

    // Enrich with user details
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const user = await ctx.db.get(conv.userId);
        return {
          ...conv,
          user: user
            ? {
                id: user._id,
                name: user.name || "Unknown User",
                email: user.email || "No email",
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

export const getConversation = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) return null;

    const user = await ctx.db.get(conversation.userId);

    return {
      ...conversation,
      user: user
        ? {
            id: user._id,
            name: user.name || "Unknown User",
            email: user.email || "No email",
          }
        : null,
    };
  },
});

export const getMessages = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_sent", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Enrich with sender details
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        let senderName = "System";

        if (msg.senderType === "user") {
          const user = await ctx.db.get(msg.userId);
          senderName = user?.name || "Unknown User";
        } else if (msg.senderType === "admin" && msg.senderId) {
          const admin = await ctx.db.get(msg.senderId as Id<"users">);
          senderName = admin?.name || "Admin";
        }

        return {
          ...msg,
          senderName,
        };
      })
    );

    return enriched;
  },
});

export const getUnreadConversationsCount = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    return conversations.filter((c) => (c.unreadCount || 0) > 0).length;
  },
});

// ============ MUTATIONS ============

export const createConversation = mutation({
  args: {
    userId: v.id("users"),
    subject: v.optional(v.string()),
    initialMessage: v.string(),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();

    // Create conversation
    const conversationId = await ctx.db.insert("conversations", {
      userId: args.userId,
      subject: args.subject,
      status: "open",
      priority: args.priority || "medium",
      lastMessageAt: now,
      unreadCount: 0,
      createdAt: now,
    });

    // Create initial message
    await ctx.db.insert("messages", {
      conversationId: conversationId as unknown as string,
      userId: args.userId,
      senderId: identity.subject,
      senderType: "admin",
      content: args.initialMessage,
      isRead: false,
      sentAt: now,
    });

    // Log activity
    await ctx.db.insert("activityFeed", {
      entityType: "user",
      entityId: args.userId,
      action: "conversation_created",
      description: `New conversation started with user`,
      performedBy: identity.subject,
      timestamp: now,
    });

    return { conversationId };
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.string(),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          storageId: v.optional(v.id("_storage")),
          type: v.string(),
          size: v.number(),
        })
      )
    ),
    senderType: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get conversation
    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) throw new Error("Conversation not found");

    const now = Date.now();

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: conversation.userId,
      senderId: args.senderType === "admin" ? identity.subject : undefined,
      senderType: args.senderType,
      content: args.content,
      attachments: args.attachments,
      isRead: args.senderType === "admin", // Auto-mark admin messages as read
      sentAt: now,
    });

    // Update conversation
    await ctx.db.patch(conversation._id, {
      lastMessageAt: now,
      unreadCount:
        args.senderType === "user"
          ? (conversation.unreadCount || 0) + 1
          : conversation.unreadCount,
    });

    return { messageId };
  },
});

export const markAsRead = mutation({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Get conversation
    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) throw new Error("Conversation not found");

    // Mark all unread messages as read
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    const now = Date.now();
    for (const message of messages) {
      await ctx.db.patch(message._id, {
        isRead: true,
        readAt: now,
      });
    }

    // Reset unread count
    await ctx.db.patch(conversation._id, {
      unreadCount: 0,
    });

    return { success: true };
  },
});

export const closeConversation = mutation({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(conversation._id, {
      status: "closed",
    });

    return { success: true };
  },
});

export const reopenConversation = mutation({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(conversation._id, {
      status: "open",
    });

    return { success: true };
  },
});

export const assignConversation = mutation({
  args: {
    conversationId: v.string(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(conversation._id, {
      assignedTo: args.adminId,
    });

    return { success: true };
  },
});

export const updateConversationPriority = mutation({
  args: {
    conversationId: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(conversation._id, {
      priority: args.priority,
    });

    return { success: true };
  },
});

export const addConversationTags = mutation({
  args: {
    conversationId: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) throw new Error("Conversation not found");

    const existingTags = conversation.tags || [];
    const newTags = [...new Set([...existingTags, ...args.tags])];

    await ctx.db.patch(conversation._id, {
      tags: newTags,
    });

    return { success: true };
  },
});

export const deleteConversation = mutation({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await requireAdmin(ctx);

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (!conversation) throw new Error("Conversation not found");

    // Delete all messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete conversation
    await ctx.db.delete(conversation._id);

    // Log activity
    await ctx.db.insert("activityFeed", {
      entityType: "user",
      entityId: conversation.userId,
      action: "conversation_deleted",
      description: `Conversation deleted`,
      performedBy: identity.subject,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
