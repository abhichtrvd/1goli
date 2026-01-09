import { internalMutation } from "./_generated/server";

export const applyScheduledPrices = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const products = await ctx.db.query("products").collect();

    let updatedCount = 0;

    for (const product of products) {
      if (!product.scheduledPrices || product.scheduledPrices.length === 0) {
        continue;
      }

      let priceChanged = false;
      let newPrice = product.basePrice;

      // Check each scheduled price
      for (const scheduled of product.scheduledPrices) {
        if (!scheduled.isActive) continue;

        const isStarted = now >= scheduled.startDate;
        const isEnded = scheduled.endDate ? now >= scheduled.endDate : false;

        // If the scheduled price should be active now
        if (isStarted && !isEnded) {
          newPrice = scheduled.price;
          priceChanged = true;
        }

        // If the scheduled price has ended, deactivate it
        if (isEnded) {
          scheduled.isActive = false;
        }
      }

      // Update the product if price changed
      if (priceChanged && newPrice !== product.basePrice) {
        await ctx.db.patch(product._id, {
          basePrice: newPrice,
          scheduledPrices: product.scheduledPrices,
        });

        await ctx.db.insert("auditLogs", {
          action: "apply_scheduled_price",
          entityId: product._id,
          entityType: "product",
          performedBy: "system",
          details: `Price automatically updated from ₹${product.basePrice} to ₹${newPrice}`,
          timestamp: now,
        });

        updatedCount++;
      } else if (product.scheduledPrices.some((s) => !s.isActive)) {
        // Just update to deactivate ended scheduled prices
        await ctx.db.patch(product._id, {
          scheduledPrices: product.scheduledPrices,
        });
      }
    }

    console.log(`[Cron] Applied scheduled prices to ${updatedCount} products`);
    return { updatedCount };
  },
});
