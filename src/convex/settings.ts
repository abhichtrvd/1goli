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