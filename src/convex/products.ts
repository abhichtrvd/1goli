import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./users";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
          // ratingCount and averageRating are now on the document
        };
      })
    );
  },
});

export const getPaginatedProducts = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    brand: v.optional(v.string()),
    category: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sort: v.optional(v.string()), // "price_asc", "price_desc", "name_asc", "name_desc"
  },
  handler: async (ctx, args) => {
    let query;
    
    // Base query selection based on sort or primary filter
    if (args.sort === "price_asc") {
      query = ctx.db.query("products").withIndex("by_price").order("asc");
    } else if (args.sort === "price_desc") {
      query = ctx.db.query("products").withIndex("by_price").order("desc");
    } else if (args.sort === "name_asc") {
      query = ctx.db.query("products").withIndex("by_name").order("asc");
    } else if (args.sort === "name_desc") {
      query = ctx.db.query("products").withIndex("by_name").order("desc");
    } else if (args.sort === "rating_desc") {
      query = ctx.db.query("products").withIndex("by_rating").order("desc");
    } else if (args.sort === "rating_asc") {
      query = ctx.db.query("products").withIndex("by_rating").order("asc");
    } else if (args.sort === "reviews_desc") {
      query = ctx.db.query("products").withIndex("by_rating_count").order("desc");
    } else if (args.brand) {
      query = ctx.db.query("products").withIndex("by_brand", (q) => q.eq("brand", args.brand));
    } else if (args.category) {
      query = ctx.db.query("products").withIndex("by_category", (q) => q.eq("category", args.category));
    } else {
      query = ctx.db.query("products").order("desc");
    }

    // Apply filters
    // Note: In Convex, we can't chain .filter() after .withIndex() if we want to use pagination efficiently 
    // unless we accept scanning. For this scale, scanning is acceptable.
    // However, if we used a specific index above (like by_brand), we don't need to filter by it again.
    
    if (args.brand && !args.sort) {
      // Already filtered by index
    } else if (args.brand) {
      query = query.filter((q) => q.eq(q.field("brand"), args.brand));
    }

    if (args.category && !args.sort && !args.brand) {
      // Already filtered by index
    } else if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    if (args.minPrice !== undefined) {
      query = query.filter((q) => q.gte(q.field("basePrice"), args.minPrice!));
    }

    if (args.maxPrice !== undefined) {
      query = query.filter((q) => q.lte(q.field("basePrice"), args.maxPrice!));
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

    // Fallback calculation if fields are missing (migration support)
    let ratingCount = product.ratingCount;
    let averageRating = product.averageRating;

    if (ratingCount === undefined) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .collect();
      
      ratingCount = reviews.length;
      averageRating = ratingCount > 0 
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / ratingCount 
        : 0;
    }

    return {
      ...product,
      imageUrl: product.imageStorageId
        ? (await ctx.storage.getUrl(product.imageStorageId)) || product.imageUrl || ""
        : product.imageUrl || "",
      images: gallery,
      ratingCount,
      averageRating,
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
      
      // Calculate relevance score
      const scoredProducts = filtered.map((product) => {
        let score = 0;
        const name = product.name.toLowerCase();
        const brand = product.brand?.toLowerCase() || "";
        const category = product.category?.toLowerCase() || "";
        const description = product.description.toLowerCase();
        
        // Exact name match gets highest priority
        if (name === lowerQuery) score += 100;
        // Starts with query
        else if (name.startsWith(lowerQuery)) score += 50;
        // Name contains query
        else if (name.includes(lowerQuery)) score += 25;
        
        // Brand match
        if (brand.includes(lowerQuery)) score += 15;
        
        // Category match
        if (category.includes(lowerQuery)) score += 15;
        
        // Tag match
        if (product.symptomsTags.some(tag => tag.toLowerCase().includes(lowerQuery))) score += 10;
        
        // Description match (lowest priority)
        if (description.includes(lowerQuery)) score += 5;
        
        // Form match
        if (product.forms?.some(f => f.toLowerCase().includes(lowerQuery))) score += 5;

        return { product, score };
      });

      // Filter out non-matches and sort by score
      filtered = scoredProducts
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.product);
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
    // New fields
    keyBenefits: v.optional(v.array(v.string())),
    directionsForUse: v.optional(v.string()),
    safetyInformation: v.optional(v.string()),
    ingredients: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    
    const productId = await ctx.db.insert("products", {
      ...args,
      category: args.category || "Classical",
      availability: args.availability || "in_stock",
      images: args.images || [],
      packingSizes: args.packingSizes || ["30ml", "100ml"],
    });

    await ctx.db.insert("auditLogs", {
      action: "create_product",
      entityId: productId,
      entityType: "product",
      performedBy: userId || "admin",
      details: `Created product: ${args.name}`,
      timestamp: Date.now(),
    });
    
    return productId;
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
    // New fields
    keyBenefits: v.optional(v.array(v.string())),
    directionsForUse: v.optional(v.string()),
    safetyInformation: v.optional(v.string()),
    ingredients: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);

    await ctx.db.insert("auditLogs", {
      action: "update_product",
      entityId: id,
      entityType: "product",
      performedBy: userId || "admin",
      details: `Updated product: ${id}`,
      timestamp: Date.now(),
    });
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    await ctx.db.delete(args.id);

    await ctx.db.insert("auditLogs", {
      action: "delete_product",
      entityId: args.id,
      entityType: "product",
      performedBy: userId || "admin",
      details: `Deleted product: ${args.id}`,
      timestamp: Date.now(),
    });
  },
});

export const bulkDeleteProducts = mutation({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }

    await ctx.db.insert("auditLogs", {
      action: "bulk_delete_products",
      entityType: "product",
      performedBy: userId || "admin",
      details: `Deleted ${args.ids.length} products`,
      timestamp: Date.now(),
    });
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
        keyBenefits: [
          "Helps in reducing pain and swelling from injuries",
          "Effective for muscle soreness and stiffness",
          "Promotes healing of bruises and sprains"
        ],
        directionsForUse: "Take 5 drops in half cup of water three times a day or as prescribed by the physician.",
        safetyInformation: "Read the label carefully before use. Do not exceed the recommended dosage. Keep out of reach of children.",
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
        keyBenefits: [
          "Relieves indigestion and acidity",
          "Helps with bloating and constipation",
          "Calms irritability and stress-related symptoms"
        ],
        directionsForUse: "Take 5 drops in half cup of water twice daily.",
        safetyInformation: "Avoid strong smelling substances like coffee, onion, hing, mint, camphor, garlic etc while taking the medicine.",
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
        keyBenefits: [
          "Reduces hair fall and promotes hair growth",
          "Prevents premature graying of hair",
          "Strengthens hair roots"
        ],
        directionsForUse: "20-30 drops after meals, 3 times daily.",
        safetyInformation: "For external use only. Store in a cool and dry place.",
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

    for (const product of [...products, ...products.slice(3)]) {
      await ctx.db.insert("products", product);
    }
  },
});