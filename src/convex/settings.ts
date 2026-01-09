import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./users";

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("siteSettings").first();
    return settings;
  },
});

export const updateSettings = mutation({
  args: {
    siteName: v.string(),
    supportEmail: v.string(),
    supportPhone: v.string(),
    shippingFee: v.number(),
    freeShippingThreshold: v.number(),
    maintenanceMode: v.boolean(),
    bannerMessage: v.optional(v.string()),

    // New fields
    heroHeadline: v.optional(v.string()),
    heroDescription: v.optional(v.string()),
    address: v.optional(v.string()),
    facebookUrl: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    featuredBrands: v.optional(v.array(v.string())),
    quickActions: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.string(),
          href: v.string(),
          icon: v.string(),
          accent: v.string(),
        })
      )
    ),
    healthConcerns: v.optional(
      v.array(
        v.object({
          title: v.string(),
          query: v.string(),
          icon: v.string(),
          color: v.string(),
        })
      )
    ),
    featureCards: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.string(),
          href: v.string(),
          theme: v.string(),
        })
      )
    ),

    // Payment settings
    paymentGateway: v.optional(v.string()),
    razorpayKeyId: v.optional(v.string()),
    razorpayKeySecret: v.optional(v.string()),
    stripePublishableKey: v.optional(v.string()),
    stripeSecretKey: v.optional(v.string()),
    enableCOD: v.optional(v.boolean()),
    enableUPI: v.optional(v.boolean()),
    enableCard: v.optional(v.boolean()),

    // Tax settings
    taxEnabled: v.optional(v.boolean()),
    taxName: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    taxNumber: v.optional(v.string()),

    // Currency settings
    currency: v.optional(v.string()),
    currencySymbol: v.optional(v.string()),

    // Logo/Branding
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),

    // Email Server Configuration
    smtpHost: v.optional(v.string()),
    smtpPort: v.optional(v.number()),
    smtpUsername: v.optional(v.string()),
    smtpPassword: v.optional(v.string()),
    smtpFromAddress: v.optional(v.string()),
    smtpFromName: v.optional(v.string()),

    // API Key Management
    apiKeys: v.optional(v.array(v.object({
      label: v.string(),
      key: v.string(),
      createdAt: v.number(),
    }))),

    // Webhook Configuration
    webhooks: v.optional(v.object({
      orderCreated: v.optional(v.string()),
      orderShipped: v.optional(v.string()),
      orderDelivered: v.optional(v.string()),
      userRegistered: v.optional(v.string()),
    })),

    // Security Settings
    enable2FA: v.optional(v.boolean()),
    ipWhitelist: v.optional(v.array(v.string())),
    sessionTimeout: v.optional(v.number()),
    passwordChangeInterval: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("siteSettings").first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("siteSettings", args);
    }
  },
});

// Generate upload URL for logo
export const generateUploadUrl = mutation(async (ctx) => {
  await requireAdmin(ctx);
  return await ctx.storage.generateUploadUrl();
});

// Send test email
export const sendTestEmail = mutation({
  args: {
    to: v.string(),
    smtpHost: v.string(),
    smtpPort: v.number(),
    smtpUsername: v.string(),
    smtpPassword: v.string(),
    smtpFromAddress: v.string(),
    smtpFromName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Note: In a production app, you would use a library like nodemailer
    // For now, we'll just return a success message
    // This would typically be implemented as an action that can use external libraries
    return {
      success: true,
      message: "Test email configuration saved. Email sending would be implemented in production.",
    };
  },
});

// Test webhook
export const testWebhook = mutation({
  args: {
    url: v.string(),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Note: In a production app, you would make an HTTP request to the webhook URL
    // This would typically be implemented as an action
    return {
      success: true,
      message: `Webhook test for ${args.event} would be sent to ${args.url} in production.`,
    };
  },
});