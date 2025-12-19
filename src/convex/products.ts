import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./users";
import { paginationOptsValidator } from "convex/server";

export const getProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return await Promise.all(
      products.map(async (p) => {
        const gallery = p.images ? await Promise.all(p.images.map(async (img) => ({
          ...img,
          url: img.storageId ? (await ctx.storage.getUrl(img.storageId)) || img.url : img.url
        }))) : [];

        return {
          ...p,
          imageUrl: p.imageStorageId
            ? (await ctx.storage.getUrl(p.imageStorageId)) || p.imageUrl || ""
            : p.imageUrl || "",
          images: gallery,
        };
      })
    );
  },
});

export const getPaginatedProducts = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    brand: v.optional(v.string()),
    sort: v.optional(v.string()), // "price_asc", "price_desc", "name_asc", "name_desc"
  },
  handler: async (ctx, args) => {
    let query;
    if (args.brand) {
      query = ctx.db
        .query("products")
        .withIndex("by_brand", (q) => q.eq("brand", args.brand));
    } else {
      if (args.sort === "price_asc") {
        query = ctx.db.query("products").withIndex("by_price").order("asc");
      } else if (args.sort === "price_desc") {
        query = ctx.db.query("products").withIndex("by_price").order("desc");
      } else if (args.sort === "name_asc") {
        query = ctx.db.query("products").withIndex("by_name").order("asc");
      } else if (args.sort === "name_desc") {
        query = ctx.db.query("products").withIndex("by_name").order("desc");
      } else {
        query = ctx.db.query("products").order("desc");
      }
    }

    const result = await query.paginate(args.paginationOpts);

    const pageWithUrls = await Promise.all(
      result.page.map(async (p) => ({
        ...p,
        imageUrl: p.imageStorageId
          ? (await ctx.storage.getUrl(p.imageStorageId)) || p.imageUrl || ""
          : p.imageUrl || "",
      }))
    );

    return { ...result, page: pageWithUrls };
  },
});

export const getWholesaleProducts = query({
  args: {},
  handler: async (ctx) => {
    // Lightweight query for wholesale - no image URL generation needed
    // This significantly speeds up the load time by avoiding storage calls
    return await ctx.db.query("products").collect();
  },
});

export const getProduct = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    
    const gallery = product.images ? await Promise.all(product.images.map(async (img) => ({
      ...img,
      url: img.storageId ? (await ctx.storage.getUrl(img.storageId)) || img.url : img.url
    }))) : [];

    return {
      ...product,
      imageUrl: product.imageStorageId
        ? (await ctx.storage.getUrl(product.imageStorageId)) || product.imageUrl || ""
        : product.imageUrl || "",
      images: gallery,
    };
  },
});

export const searchProducts = query({
  args: { 
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    brands: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Simple search implementation
    // In a real app, we would use ctx.db.query("products").withSearchIndex(...)
    // But for "Intelligent Symptom Search" filtering by tags, we can do a scan if data is small
    // or use the search index.
    
    const products = await ctx.db.query("products").collect();
    
    let filtered = products;

    if (args.category) {
      filtered = filtered.filter((p) => {
        if (args.category === "Cosmetics") {
          return p.category === "Cosmetics" || p.category === "Personal Care";
        }
        return p.category === args.category;
      });
    }

    if (args.brands && args.brands.length > 0) {
      filtered = filtered.filter((p) => p.brand && args.brands!.includes(p.brand));
    }

    if (args.query) {
      const lowerQuery = args.query.toLowerCase();
      filtered = filtered.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(lowerQuery);
        const tagMatch = product.symptomsTags.some(tag => tag.toLowerCase().includes(lowerQuery));
        const descMatch = product.description.toLowerCase().includes(lowerQuery);
        return nameMatch || tagMatch || descMatch;
      });
    }

    return await Promise.all(
      filtered.map(async (p) => ({
        ...p,
        imageUrl: p.imageStorageId
          ? (await ctx.storage.getUrl(p.imageStorageId)) || p.imageUrl || ""
          : p.imageUrl || "",
        // We don't need gallery for search results usually, keeping it light
      }))
    );
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    brand: v.optional(v.string()),
    imageUrl: v.optional(v.union(v.string(), v.null())),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    images: v.optional(v.array(v.object({ 
      storageId: v.optional(v.id("_storage")),
      url: v.string() 
    }))),
    videoUrl: v.optional(v.string()),
    videoThumbnail: v.optional(v.string()),
    potencies: v.array(v.string()),
    forms: v.array(v.string()),
    packingSizes: v.optional(v.array(v.string())),
    basePrice: v.number(),
    stock: v.number(),
    symptomsTags: v.array(v.string()),
    category: v.optional(v.string()),
    availability: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.insert("products", {
      ...args,
      category: args.category || "Classical",
      availability: args.availability || "in_stock",
      images: args.images || [],
      packingSizes: args.packingSizes || ["30ml", "100ml"], // Default if not provided
    });
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    brand: v.optional(v.string()),
    imageUrl: v.optional(v.union(v.string(), v.null())),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    images: v.optional(v.array(v.object({ 
      storageId: v.optional(v.id("_storage")),
      url: v.string() 
    }))),
    videoUrl: v.optional(v.string()),
    videoThumbnail: v.optional(v.string()),
    potencies: v.optional(v.array(v.string())),
    forms: v.optional(v.array(v.string())),
    packingSizes: v.optional(v.array(v.string())),
    basePrice: v.optional(v.number()),
    stock: v.optional(v.number()),
    symptomsTags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    availability: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

export const seedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const totalProducts = await ctx.db.query("products").collect();
    if (totalProducts.length > 0) return;

    const products = [
      {
        name: "Arnica Montana",
        description: "Effective for bruises, sprains, and muscle soreness. A must-have for every first aid kit.",
        brand: "Dr. Reckeweg",
        potencies: ["30C", "200C", "1M", "Mother Tincture"],
        forms: ["Dilution", "Drops", "Tablets"],
        basePrice: 150,
        stock: 50,
        symptomsTags: ["Injury", "Pain", "Bruises"],
        category: "Classical",
        imageUrl: "https://images.unsplash.com/photo-1624454002302-36b824d7bd52?q=80&w=500&auto=format&fit=crop",
      },
      {
        name: "Nux Vomica",
        description: "Relief from indigestion, bloating, and irritability caused by modern lifestyle.",
        brand: "SBL World Class",
        potencies: ["30C", "200C"],
        forms: ["Dilution", "Tablets"],
        basePrice: 120,
        stock: 45,
        symptomsTags: ["Digestion", "Stress", "Headache"],
        category: "Classical",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=500&auto=format&fit=crop",
      },
      {
        name: "R89 Hair Care Drops",
        description: "Specialized formulation for hair fall, premature graying, and weak roots.",
        brand: "Dr. Reckeweg",
        potencies: ["Mother Tincture"],
        forms: ["Drops"],
        basePrice: 280,
        stock: 30,
        symptomsTags: ["Hair Fall", "Scalp"],
        category: "Patent",
        imageUrl: "https://images.unsplash.com/photo-1626806749963-2c709d771e43?q=80&w=500&auto=format&fit=crop",
      },
      {
        name: "Belladonna",
        description: "Quick relief for sudden high fever, throbbing headaches, and inflammation.",
        brand: "Schwabe India",
        potencies: ["30C", "200C", "1M"],
        forms: ["Dilution"],
        basePrice: 140,
        stock: 60,
        symptomsTags: ["Fever", "Inflammation", "Pain"],
        category: "Classical",
        imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=500&auto=format&fit=crop",
      },
      {
        name: "Rhus Tox",
        description: "Excellent for joint pains that improve with motion. Helpful in arthritis.",
        brand: "Dr. Reckeweg",
        potencies: ["30C", "200C"],
        forms: ["Dilution", "Ointment"],
        basePrice: 160,
        stock: 40,
        symptomsTags: ["Joint Pain", "Arthritis"],
        category: "Classical",
        imageUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?q=80&w=500&auto=format&fit=crop",
      },
      {
        name: "Calendula Officinalis",
        description: "Natural antiseptic for cuts, wounds, and burns. Promotes rapid healing.",
        brand: "SBL World Class",
        potencies: ["Mother Tincture"],
        forms: ["Cream", "Liquid"],
        basePrice: 110,
        stock: 100,
        symptomsTags: ["Skin", "Wounds", "Antiseptic"],
        category: "Personal Care",
        imageUrl: "https://images.unsplash.com/photo-1556228552-cabd363226e3?q=80&w=500&auto=format&fit=crop",
      },
    ];

    for (const product of products) {
      await ctx.db.insert("products", product);
    }
  },
});