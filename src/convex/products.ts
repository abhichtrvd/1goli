import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

export const getProduct = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const searchProducts = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    // Simple search implementation
    // In a real app, we would use ctx.db.query("products").withSearchIndex(...)
    // But for "Intelligent Symptom Search" filtering by tags, we can do a scan if data is small
    // or use the search index.
    
    const products = await ctx.db.query("products").collect();
    
    if (!args.query) return products;

    const lowerQuery = args.query.toLowerCase();
    
    return products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(lowerQuery);
      const tagMatch = product.symptomsTags.some(tag => tag.toLowerCase().includes(lowerQuery));
      const descMatch = product.description.toLowerCase().includes(lowerQuery);
      return nameMatch || tagMatch || descMatch;
    });
  },
});

export const seedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").take(1);
    if (existing.length > 0) return; // Already seeded

    const products = [
      {
        name: "Arnica Montana",
        description: "A top remedy for trauma, bruising, and muscle soreness. Essential for any first aid kit.",
        imageUrl: "https://images.unsplash.com/photo-1625591342274-013866180475?w=800&auto=format&fit=crop&q=60", // Placeholder flower image
        potencies: ["30C", "200C"],
        forms: ["Dilution", "Globules"],
        basePrice: 12.99,
        symptomsTags: ["injury", "bruise", "trauma", "muscle pain"],
      },
      {
        name: "Nux Vomica",
        description: "The 'hangover' remedy. Great for indigestion, stress, and irritability caused by overindulgence.",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=60", // Placeholder seeds/plant
        potencies: ["30C", "200C"],
        forms: ["Dilution", "Globules", "Drops"],
        basePrice: 14.50,
        symptomsTags: ["indigestion", "stress", "hangover", "irritability"],
      },
      {
        name: "Oscillococcinum",
        description: "World-famous homeopathic medicine for flu-like symptoms. Best taken at the first sign of illness.",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60", // Placeholder medicine
        potencies: ["200K"], // Standard for Oscillo
        forms: ["Tube"],
        basePrice: 29.99,
        symptomsTags: ["flu", "body ache", "fever", "chills"],
      },
    ];

    for (const p of products) {
      await ctx.db.insert("products", p);
    }
  },
});
