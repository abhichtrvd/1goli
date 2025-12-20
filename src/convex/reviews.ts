import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const submitReview = mutation({
  args: {
    productId: v.id("products"),
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Check if user already reviewed this product
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .first();

    if (existing) {
      throw new Error("You have already reviewed this product");
    }

    await ctx.db.insert("reviews", {
      userId,
      userName: user.name || "Anonymous",
      productId: args.productId,
      rating: args.rating,
      title: args.title,
      comment: args.comment,
      verifiedPurchase: true, // In a real app, we would verify against orders
      helpfulCount: 0,
    });
  },
});

export const getReviews = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .collect();
    return reviews;
  },
});
