import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";

// Helper to update product rating stats
async function updateProductRating(ctx: any, productId: any) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_product", (q: any) => q.eq("productId", productId))
    .collect();
  
  const ratingCount = reviews.length;
  const averageRating = ratingCount > 0 
    ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / ratingCount 
    : 0;

  await ctx.db.patch(productId, {
    ratingCount,
    averageRating,
  });
}

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

    await updateProductRating(ctx, args.productId);
  },
});

export const editReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");
    if (review.userId !== userId) throw new Error("Unauthorized to edit this review");

    await ctx.db.patch(args.reviewId, {
      rating: args.rating,
      title: args.title,
      comment: args.comment,
      isEdited: true,
      lastEditedAt: Date.now(),
    });

    await updateProductRating(ctx, review.productId);
  },
});

export const markHelpful = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("reviewInteractions")
      .withIndex("by_review_user", (q) => q.eq("reviewId", args.reviewId).eq("userId", userId))
      .first();

    if (existing) {
      if (existing.type === "helpful") {
        // Toggle off
        await ctx.db.delete(existing._id);
        const review = await ctx.db.get(args.reviewId);
        if (review) {
          await ctx.db.patch(args.reviewId, { helpfulCount: Math.max(0, (review.helpfulCount || 0) - 1) });
        }
        return false; // Not helpful anymore
      } else {
        // Change from report to helpful (unlikely but possible)
        await ctx.db.patch(existing._id, { type: "helpful" });
        const review = await ctx.db.get(args.reviewId);
        if (review) {
          await ctx.db.patch(args.reviewId, { helpfulCount: (review.helpfulCount || 0) + 1 });
        }
        return true;
      }
    } else {
      await ctx.db.insert("reviewInteractions", {
        userId,
        reviewId: args.reviewId,
        type: "helpful",
      });
      const review = await ctx.db.get(args.reviewId);
      if (review) {
        await ctx.db.patch(args.reviewId, { helpfulCount: (review.helpfulCount || 0) + 1 });
      }
      return true;
    }
  },
});

export const reportReview = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("reviewInteractions")
      .withIndex("by_review_user", (q) => q.eq("reviewId", args.reviewId).eq("userId", userId))
      .first();

    if (!existing) {
      await ctx.db.insert("reviewInteractions", {
        userId,
        reviewId: args.reviewId,
        type: "report",
      });
    } else if (existing.type === "helpful") {
      // Switch to report? Or just ignore. Let's switch.
      await ctx.db.patch(existing._id, { type: "report" });
      const review = await ctx.db.get(args.reviewId);
      if (review) {
        await ctx.db.patch(args.reviewId, { helpfulCount: Math.max(0, (review.helpfulCount || 0) - 1) });
      }
    }
  },
});

export const getReviews = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .collect();

    // If user is logged in, get their interactions
    let userInteractions = new Map();
    if (userId) {
      const interactions = await ctx.db
        .query("reviewInteractions")
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();
      interactions.forEach((i) => userInteractions.set(i.reviewId, i.type));
    }

    return reviews.map((r) => ({
      ...r,
      currentUserInteraction: userInteractions.get(r._id),
      isCurrentUser: r.userId === userId,
    }));
  },
});

export const getAllReviews = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const reviews = await ctx.db.query("reviews").order("desc").take(100);
    
    // Enrich with product names
    return await Promise.all(reviews.map(async (r) => {
      const product = await ctx.db.get(r.productId);
      const reports = await ctx.db
        .query("reviewInteractions")
        .withIndex("by_review_type", (q) => q.eq("reviewId", r._id).eq("type", "report"))
        .collect();
        
      return {
        ...r,
        productName: product?.name || "Unknown Product",
        reportCount: reports.length,
      };
    }));
  },
});

export const deleteReview = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review) return;

    await ctx.db.delete(args.reviewId);
    
    // Clean up interactions
    const interactions = await ctx.db
      .query("reviewInteractions")
      .withIndex("by_review_user", (q) => q.eq("reviewId", args.reviewId))
      .collect();
      
    for (const i of interactions) {
      await ctx.db.delete(i._id);
    }

    await updateProductRating(ctx, review.productId);
  },
});

export const dismissReports = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const reports = await ctx.db
      .query("reviewInteractions")
      .withIndex("by_review_type", (q) => q.eq("reviewId", args.reviewId).eq("type", "report"))
      .collect();
      
    for (const report of reports) {
      await ctx.db.delete(report._id);
    }
  },
});