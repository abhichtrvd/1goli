import { v } from "convex/values";
import { query } from "./_generated/server";

export const getStockHistory = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const history = await ctx.db
      .query("productStockHistory")
      .withIndex("by_product_timestamp", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(limit);

    return history;
  },
});

export const getAllStockHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const history = await ctx.db
      .query("productStockHistory")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    return history;
  },
});

export const getLowStockProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();

    return products.filter((product) => {
      const minStock = product.minStock || 10; // Default threshold
      return product.stock <= minStock;
    });
  },
});
