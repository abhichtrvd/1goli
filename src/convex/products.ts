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
        description: "The premier remedy for trauma, bruising, and muscle soreness. Essential for any first aid kit to reduce swelling and pain.",
        imageUrl: "https://images.unsplash.com/photo-1625591342274-013866180475?w=800&auto=format&fit=crop&q=60",
        potencies: ["30C", "200C", "1M", "Mother Tincture"],
        forms: ["Dilution", "Globules", "Ointment"],
        basePrice: 12.99,
        symptomsTags: ["injury", "bruise", "trauma", "muscle pain", "swelling"],
      },
      {
        name: "Nux Vomica",
        description: "Effective for digestive issues, stress, and irritability. Often used for 'modern life' excesses like overeating or overworking.",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=60",
        potencies: ["30C", "200C", "1M"],
        forms: ["Dilution", "Globules", "Drops"],
        basePrice: 14.50,
        symptomsTags: ["indigestion", "stress", "hangover", "irritability", "constipation"],
      },
      {
        name: "Oscillococcinum",
        description: "Clinically proven for flu-like symptoms. Reduces the duration and severity of body aches, headache, fever, and chills.",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60",
        potencies: ["200K"],
        forms: ["Tube"],
        basePrice: 29.99,
        symptomsTags: ["flu", "body ache", "fever", "chills"],
      },
      {
        name: "Rhus Toxicodendron",
        description: "Indicated for joint pain, arthritis, and rheumatic conditions that improve with motion and warmth.",
        imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=60",
        potencies: ["30C", "200C", "1M"],
        forms: ["Dilution", "Globules"],
        basePrice: 13.50,
        symptomsTags: ["joint pain", "arthritis", "stiffness", "back pain"],
      },
      {
        name: "Belladonna",
        description: "For sudden high fever, throbbing headaches, and inflammation with redness and heat.",
        imageUrl: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=800&auto=format&fit=crop&q=60",
        potencies: ["30C", "200C"],
        forms: ["Dilution", "Globules", "Drops"],
        basePrice: 12.99,
        symptomsTags: ["fever", "headache", "inflammation", "sore throat"],
      },
      {
        name: "Calendula Officinalis",
        description: "A powerful antiseptic healing agent for open wounds, cuts, and burns. Promotes rapid healing of skin.",
        imageUrl: "https://images.unsplash.com/photo-1496857239036-1fb137683000?w=800&auto=format&fit=crop&q=60",
        potencies: ["Mother Tincture", "30C"],
        forms: ["Ointment", "Dilution", "Spray"],
        basePrice: 15.00,
        symptomsTags: ["wounds", "cuts", "burns", "skin", "antiseptic"],
      },
    ];

    for (const p of products) {
      // Check if product already exists to avoid duplicates on re-seed
      const existingProduct = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("name"), p.name))
        .first();
        
      if (!existingProduct) {
        await ctx.db.insert("products", p);
      }
    }
  },
});