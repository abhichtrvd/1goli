import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const updateProductImage = internalMutation({
  args: { id: v.id("products"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { imageStorageId: args.storageId });
  },
});

export const getProductsMissingImages = internalQuery({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products.filter(p => !!p.imageUrl && !p.imageStorageId);
  },
});
