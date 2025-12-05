import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const itemsWithDetails = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          ...item,
          product,
        };
      })
    );

    return itemsWithDetails.filter((item) => item.product !== null);
  },
});

export const addToCart = mutation({
  args: {
    productId: v.id("products"),
    potency: v.string(),
    form: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if item already exists with same potency and form
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("productId"), args.productId),
          q.eq(q.field("potency"), args.potency),
          q.eq(q.field("form"), args.form)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
      });
    } else {
      await ctx.db.insert("cartItems", {
        userId,
        productId: args.productId,
        potency: args.potency,
        form: args.form,
        quantity: args.quantity,
      });
    }
  },
});

export const updateQuantity = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.quantity <= 0) {
      await ctx.db.delete(args.cartItemId);
    } else {
      await ctx.db.patch(args.cartItemId, { quantity: args.quantity });
    }
  },
});

export const removeFromCart = mutation({
  args: {
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.cartItemId);
  },
});

export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});