import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// ============ QUERIES ============

export const getTemplates = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("order"),
        v.literal("user"),
        v.literal("product"),
        v.literal("system")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let templates = await ctx.db
      .query("notificationTemplates")
      .filter((q) => q.eq(q.field("parentTemplateId"), undefined))
      .order("desc")
      .collect();

    if (args.category) {
      templates = templates.filter((t) => t.category === args.category);
    }

    return templates;
  },
});

export const getTemplate = query({
  args: { id: v.id("notificationTemplates") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getTemplateVersions = query({
  args: { templateId: v.id("notificationTemplates") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const versions = await ctx.db
      .query("notificationTemplates")
      .withIndex("by_parent", (q) => q.eq("parentTemplateId", args.templateId))
      .order("desc")
      .collect();

    return versions;
  },
});

// ============ MUTATIONS ============

export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("order"),
      v.literal("user"),
      v.literal("product"),
      v.literal("system")
    ),
    channels: v.array(
      v.union(v.literal("email"), v.literal("sms"), v.literal("push"))
    ),
    subject: v.optional(v.string()),
    content: v.string(),
    variables: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const templateId = await ctx.db.insert("notificationTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      channels: args.channels,
      subject: args.subject,
      content: args.content,
      variables: args.variables,
      isActive: true,
      version: 1,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    return { templateId };
  },
});

export const updateTemplate = mutation({
  args: {
    id: v.id("notificationTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    channels: v.optional(
      v.array(v.union(v.literal("email"), v.literal("sms"), v.literal("push")))
    ),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    createVersion: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    // Create new version if requested
    if (args.createVersion) {
      const newVersion = (template.version || 1) + 1;

      await ctx.db.insert("notificationTemplates", {
        name: template.name,
        description: template.description,
        category: template.category,
        channels: args.channels || template.channels,
        subject: args.subject !== undefined ? args.subject : template.subject,
        content: args.content || template.content,
        variables: args.variables || template.variables,
        isActive: template.isActive,
        version: newVersion,
        parentTemplateId: args.id,
        createdBy: admin._id,
        createdAt: Date.now(),
      });
    }

    // Update current template
    const updates: any = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.channels !== undefined) updates.channels = args.channels;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.content !== undefined) updates.content = args.content;
    if (args.variables !== undefined) updates.variables = args.variables;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

export const deleteTemplate = mutation({
  args: { id: v.id("notificationTemplates") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Delete all versions
    const versions = await ctx.db
      .query("notificationTemplates")
      .withIndex("by_parent", (q) => q.eq("parentTemplateId", args.id))
      .collect();

    for (const version of versions) {
      await ctx.db.delete(version._id);
    }

    // Delete main template
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

export const cloneTemplate = mutation({
  args: {
    id: v.id("notificationTemplates"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    const newTemplateId = await ctx.db.insert("notificationTemplates", {
      name: args.newName,
      description: template.description,
      category: template.category,
      channels: template.channels,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      isActive: false, // Cloned templates start as inactive
      version: 1,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    return { templateId: newTemplateId };
  },
});

// ============ ACTIONS ============

export const renderTemplate = action({
  args: {
    templateId: v.id("notificationTemplates"),
    data: v.any(), // Dynamic data to merge with template
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const template = await ctx.runQuery(
      api.notificationTemplates.getTemplate,
      { id: args.templateId }
    );

    if (!template) throw new Error("Template not found");

    let renderedContent = template.content;
    let renderedSubject = template.subject;

    // Replace variables with actual data
    if (template.variables && args.data) {
      for (const variable of template.variables) {
        const value = args.data[variable] || "";
        const regex = new RegExp(`\\{${variable}\\}`, "g");
        renderedContent = renderedContent.replace(regex, value);
        if (renderedSubject !== undefined) {
          renderedSubject = renderedSubject.replace(regex, value);
        }
      }
    }

    return {
      subject: renderedSubject,
      content: renderedContent,
    };
  },
});

// Predefined template variables
export const TEMPLATE_VARIABLES = {
  ORDER: ["name", "order_id", "total", "status", "date", "tracking_number"],
  USER: ["name", "email", "phone", "registration_date"],
  PRODUCT: ["product_name", "price", "stock", "category"],
  SYSTEM: ["message", "date", "time", "support_email", "support_phone"],
} as const;
