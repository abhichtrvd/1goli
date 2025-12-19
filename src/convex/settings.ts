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
