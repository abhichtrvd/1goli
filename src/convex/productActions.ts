"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const syncProductImage = action({
  args: { id: v.id("products"), imageUrl: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const storageId = await ctx.storage.store(blob);

      await ctx.runMutation(internal.products_internal.updateProductImage, {
        id: args.id,
        storageId,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Image sync failed:", error);
      return { success: false, error: error.message };
    }
  },
});

export const bulkSyncImages = action({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.runQuery(internal.products_internal.getProductsMissingImages);
    let syncedCount = 0;
    let failedCount = 0;

    for (const product of products) {
      if (product.imageUrl && !product.imageStorageId) {
        try {
           const response = await fetch(product.imageUrl);
           if (response.ok) {
             const blob = await response.blob();
             const storageId = await ctx.storage.store(blob);
             await ctx.runMutation(internal.products_internal.updateProductImage, {
               id: product._id,
               storageId,
             });
             syncedCount++;
           } else {
             failedCount++;
           }
        } catch (e) {
          failedCount++;
          console.error(`Failed to sync image for product ${product._id}:`, e);
        }
      }
    }
    return { syncedCount, failedCount };
  }
});
