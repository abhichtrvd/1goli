import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";
import { Doc } from "./_generated/dataModel";
import {
  detectSpam,
  analyzeSentiment,
  checkDuplicate,
  verifyPurchase
} from "./reviewUtils";

// Helper to update product rating stats
async function updateProductRating(ctx: any, productId: any) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_product", (q: any) => q.eq("productId", productId))
    .collect();
  
  // Filter for approved reviews only
  const approvedReviews = reviews.filter((r: any) => 
    r.status === "approved" || r.status === undefined
  );
  
  const ratingCount = approvedReviews.length;
  const averageRating = ratingCount > 0 
    ? approvedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / ratingCount 
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

    // Spam detection
    const reviewText = `${args.title} ${args.comment}`;
    const spamResult = detectSpam(reviewText);

    // Sentiment analysis
    const sentimentResult = analyzeSentiment(args.comment, args.rating);

    // Duplicate detection - get other reviews from this user
    const userReviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const duplicateCheck = checkDuplicate(
      { userId, comment: args.comment, title: args.title },
      userReviews
    );

    // Verify purchase - get user's orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const isVerifiedPurchase = verifyPurchase(userId, args.productId, orders);

    // Auto-reject obvious spam (score > 80)
    let initialStatus: "pending" | "approved" | "rejected" = "pending";
    if (spamResult.score > 80) {
      initialStatus = "rejected";
    }

    await ctx.db.insert("reviews", {
      userId,
      userName: user.name || "Anonymous",
      productId: args.productId,
      rating: args.rating,
      title: args.title,
      comment: args.comment,
      verifiedPurchase: isVerifiedPurchase,
      helpfulCount: 0,
      status: initialStatus,
      suspiciousScore: spamResult.score,
      spamFlags: spamResult.flags,
      sentiment: sentimentResult.sentiment,
      isDuplicate: duplicateCheck.isDuplicate,
      duplicateOf: duplicateCheck.duplicateOf as any,
      similarityScore: duplicateCheck.similarityScore,
    });

    // We don't update product rating immediately if it's pending
  },
});

export const updateReviewStatus = mutation({
  args: {
    reviewId: v.id("reviews"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    await ctx.db.patch(args.reviewId, { status: args.status });

    // Update product rating
    await updateProductRating(ctx, review.productId);
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
      status: "pending", // Reset to pending on edit
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
    
    // Use the new index if available, or fallback to filtering
    // Since we just added the index, we can use it for approved reviews
    // But we also want to show the user's own reviews even if pending
    
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .collect();

    // Filter for approved reviews + user's own reviews (even if pending)
    const visibleReviews = reviews.filter(r => 
      r.status === "approved" || 
      r.status === undefined || 
      (userId && r.userId === userId)
    );

    // If user is logged in, get their interactions
    let userInteractions = new Map();
    if (userId) {
      const interactions = await ctx.db
        .query("reviewInteractions")
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();
      interactions.forEach((i) => userInteractions.set(i.reviewId, i.type));
    }

    return visibleReviews.map((r) => ({
      ...r,
      currentUserInteraction: userInteractions.get(r._id),
      isCurrentUser: r.userId === userId,
    }));
  },
});

export const getAllReviews = query({
  args: { 
    status: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    let query: any = ctx.db.query("reviews");
    
    if (args.status && args.status !== "all") {
       query = query.withIndex("by_status", (q: any) => q.eq("status", args.status));
    } else {
       query = query.order("desc");
    }
    
    const reviews = await query.take(100);
    
    // Enrich with product names
    return await Promise.all(reviews.map(async (r: any) => {
      const product = await ctx.db.get(r.productId) as Doc<"products"> | null;
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

export const replyToReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    reply: v.string()
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    await ctx.db.patch(args.reviewId, {
      adminReply: args.reply,
      adminRepliedAt: Date.now(),
    });
  },
});

// Bulk Actions
export const bulkApproveReviews = mutation({
  args: {
    reviewIds: v.array(v.id("reviews")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    for (const reviewId of args.reviewIds) {
      const review = await ctx.db.get(reviewId);
      if (review) {
        await ctx.db.patch(reviewId, { status: "approved" });
        await updateProductRating(ctx, review.productId);
      }
    }
  },
});

export const bulkRejectReviews = mutation({
  args: {
    reviewIds: v.array(v.id("reviews")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    for (const reviewId of args.reviewIds) {
      const review = await ctx.db.get(reviewId);
      if (review) {
        await ctx.db.patch(reviewId, { status: "rejected" });
        await updateProductRating(ctx, review.productId);
      }
    }
  },
});

export const bulkDeleteReviews = mutation({
  args: {
    reviewIds: v.array(v.id("reviews")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    for (const reviewId of args.reviewIds) {
      const review = await ctx.db.get(reviewId);
      if (!review) continue;

      await ctx.db.delete(reviewId);

      // Clean up interactions
      const interactions = await ctx.db
        .query("reviewInteractions")
        .withIndex("by_review_user", (q) => q.eq("reviewId", reviewId))
        .collect();

      for (const i of interactions) {
        await ctx.db.delete(i._id);
      }

      await updateProductRating(ctx, review.productId);
    }
  },
});

export const markAsDuplicate = mutation({
  args: {
    reviewId: v.id("reviews"),
    originalReviewId: v.id("reviews"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.reviewId, {
      isDuplicate: true,
      duplicateOf: args.originalReviewId,
    });
  },
});

// Enhanced query with filters
export const getAllReviewsWithFilters = query({
  args: {
    status: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    verifiedOnly: v.optional(v.boolean()),
    suspiciousOnly: v.optional(v.boolean()),
    duplicatesOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let reviews = await ctx.db.query("reviews").order("desc").take(200);

    // Apply filters
    if (args.status && args.status !== "all") {
      reviews = reviews.filter((r) => r.status === args.status);
    }

    if (args.sentiment && args.sentiment !== "all") {
      reviews = reviews.filter((r) => r.sentiment === args.sentiment);
    }

    if (args.verifiedOnly) {
      reviews = reviews.filter((r) => r.verifiedPurchase === true);
    }

    if (args.suspiciousOnly) {
      reviews = reviews.filter((r) => (r.suspiciousScore || 0) > 50);
    }

    if (args.duplicatesOnly) {
      reviews = reviews.filter((r) => r.isDuplicate === true);
    }

    // Enrich with product names
    return await Promise.all(reviews.map(async (r: any) => {
      const product = await ctx.db.get(r.productId) as Doc<"products"> | null;
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

// Review Metrics
export const getReviewMetrics = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const reviews = await ctx.db.query("reviews").collect();

    // Calculate metrics
    const totalReviews = reviews.length;
    const approvedReviews = reviews.filter((r) => r.status === "approved").length;
    const pendingReviews = reviews.filter((r) => r.status === "pending").length;
    const rejectedReviews = reviews.filter((r) => r.status === "rejected").length;

    // Average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

    // Sentiment distribution
    const positiveReviews = reviews.filter((r) => r.sentiment === "positive").length;
    const neutralReviews = reviews.filter((r) => r.sentiment === "neutral").length;
    const negativeReviews = reviews.filter((r) => r.sentiment === "negative").length;

    // Verified purchase percentage
    const verifiedReviews = reviews.filter((r) => r.verifiedPurchase).length;
    const verifiedPercentage = totalReviews > 0
      ? (verifiedReviews / totalReviews) * 100
      : 0;

    // Response rate (reviews with admin reply)
    const repliedReviews = reviews.filter((r) => r.adminReply).length;
    const responseRate = totalReviews > 0
      ? (repliedReviews / totalReviews) * 100
      : 0;

    // Suspicious reviews
    const suspiciousReviews = reviews.filter((r) => (r.suspiciousScore || 0) > 50).length;

    // Duplicate reviews
    const duplicateReviews = reviews.filter((r) => r.isDuplicate).length;

    // Top reviewed products
    const productReviewCounts: Record<string, { count: number; avgRating: number; productId: string }> = {};

    for (const review of reviews.filter((r) => r.status === "approved")) {
      const productId = review.productId;
      if (!productReviewCounts[productId]) {
        productReviewCounts[productId] = { count: 0, avgRating: 0, productId };
      }
      productReviewCounts[productId].count++;
      productReviewCounts[productId].avgRating += review.rating;
    }

    const topProducts = await Promise.all(
      Object.entries(productReviewCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5)
        .map(async ([productId, data]) => {
          const product = await ctx.db.get(productId as any) as Doc<"products"> | null;
          return {
            productId,
            productName: product?.name || "Unknown",
            reviewCount: data.count,
            averageRating: data.avgRating / data.count,
          };
        })
    );

    // Review volume by date (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentReviews = reviews.filter((r) => r._creationTime >= thirtyDaysAgo);

    // Group by day
    const volumeByDay: Record<string, number> = {};
    for (const review of recentReviews) {
      const date = new Date(review._creationTime).toISOString().split("T")[0];
      volumeByDay[date] = (volumeByDay[date] || 0) + 1;
    }

    const volumeTrend = Object.entries(volumeByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      averageRating: Math.round(avgRating * 10) / 10,
      sentimentDistribution: {
        positive: positiveReviews,
        neutral: neutralReviews,
        negative: negativeReviews,
      },
      verifiedPercentage: Math.round(verifiedPercentage * 10) / 10,
      responseRate: Math.round(responseRate * 10) / 10,
      suspiciousReviews,
      duplicateReviews,
      topProducts,
      volumeTrend,
    };
  },
});