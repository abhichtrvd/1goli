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

    // Enrich with user data
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const user = await ctx.db.get(conv.userId);
        return {
          ...conv,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "",
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
      .filter((q) => q.eq(q.field("userId"), args.conversationId))
      .first();

    return conversation;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_sent", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .take(args.limit || 100);

    return messages;
  },
});

export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return conversations;
  },
});

// ============ MUTATIONS ============

export const sendMessage = mutation({
  args: {
    conversationId: v.optional(v.string()),
    userId: v.id("users"),
    content: v.string(),
    senderType: v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("system")
    ),
    senderId: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let conversationId = args.conversationId;

    // Create conversation if it doesn't exist
    if (!conversationId) {
      conversationId = `conv_${args.userId}_${now}`;

      await ctx.db.insert("conversations", {
        userId: args.userId,
        status: "open",
        lastMessageAt: now,
        unreadCount: args.senderType === "user" ? 1 : 0,
        createdAt: now,
      });
    } else {
      // Update conversation
      const conversation = await ctx.db
        .query("conversations")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (conversation) {
        await ctx.db.patch(conversation._id, {
          lastMessageAt: now,
          unreadCount:
            args.senderType === "user"
              ? (conversation.unreadCount || 0) + 1
              : conversation.unreadCount,
        });
      }
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      userId: args.userId,
      senderId: args.senderId,
      senderType: args.senderType,
      content: args.content,
      attachments: args.attachments,
      isRead: args.senderType === "user" ? false : true,
      sentAt: now,
    });

    return { messageId, conversationId };
  },
});

export const markAsRead = mutation({
  args: {
    conversationId: v.string(),
    messageIds: v.optional(v.array(v.id("messages"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.messageIds) {
      // Mark specific messages as read
      for (const messageId of args.messageIds) {
        const message = await ctx.db.get(messageId);
        if (message && !message.isRead) {
          await ctx.db.patch(messageId, {
            isRead: true,
            readAt: now,
          });
        }
      }
    } else {
      // Mark all messages in conversation as read
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", args.conversationId)
        )
        .filter((q) => q.eq(q.field("isRead"), false))
        .collect();

      for (const message of messages) {
        await ctx.db.patch(message._id, {
          isRead: true,
          readAt: now,
        });
      }
    }

    // Reset unread count in conversation
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const conversation = conversations.find(c => {
      const convId = `conv_${c.userId}_${c.createdAt}`;
      return convId === args.conversationId;
    });

    if (conversation) {
      await ctx.db.patch(conversation._id, {
        unreadCount: 0,
      });
    }

    return { success: true };
  },
});

export const updateConversationStatus = mutation({
  args: {
    conversationId: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const conversation = conversations.find(c => {
      const convId = `conv_${c.userId}_${c.createdAt}`;
      return convId === args.conversationId;
    });

    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(conversation._id, {
      status: args.status,
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

    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const conversation = conversations.find(c => {
      const convId = `conv_${c.userId}_${c.createdAt}`;
      return convId === args.conversationId;
    });

    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(conversation._id, {
      assignedTo: args.adminId,
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

    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const conversation = conversations.find(c => {
      const convId = `conv_${c.userId}_${c.createdAt}`;
      return convId === args.conversationId;
    });

    if (!conversation) throw new Error("Conversation not found");

    const currentTags = conversation.tags || [];
    const newTags = Array.from(new Set([...currentTags, ...args.tags]));

    await ctx.db.patch(conversation._id, {
      tags: newTags,
    });

    return { success: true };
  },
});
