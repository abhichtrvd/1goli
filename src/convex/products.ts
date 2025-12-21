import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./users";
import { paginationOptsValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to generate search text
function generateSearchText(
  name: string, 
  brand: string | undefined, 
  description: string, 
  symptomsTags: string[]
): string {
  return `${name} ${brand || ""} ${description} ${symptomsTags.join(" ")}`.toLowerCase();
}

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
    brand: v.optional(v.string()), // Legacy support for single brand
    brands: v.optional(v.array(v.string())), // Multi-brand support
    category: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sort: v.optional(v.string()),
    forms: v.optional(v.array(v.string())),
    symptoms: v.optional(v.array(v.string())),
    potencies: v.optional(v.array(v.string())),
    inStockOnly: v.optional(v.boolean()),
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
      query = ctx.db.query("products").withIndex("by_brand", (q) => q.eq("brand", args.brand!));
    } else if (args.category) {
      query = ctx.db.query("products").withIndex("by_category", (q) => q.eq("category", args.category!));
    } else {
      query = ctx.db.query("products").order("desc");
    }

    // Apply filters
    
    // Handle legacy brand arg vs new brands array
    const brands = args.brands || (args.brand ? [args.brand] : []);

    if (brands.length > 0) {
      // If we already filtered by single brand index above, we might be double filtering, but it's safe.
      // Optimization: if args.brand was used in index, we don't strictly need this if brands has only that one.
      // But for correctness with multiple brands:
      if (!args.brand || brands.length > 1) {
         query = query.filter((q) => 
           q.or(...brands.map(b => q.eq(q.field("brand"), b)))
         );
      }
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

    if (args.forms && args.forms.length > 0) {
      // Forms is an array in doc, args.forms is array of allowed values.
      // We want products where product.forms has intersection with args.forms
      // Convex filter doesn't have 'intersects', so we use custom logic in filter
      // Note: This can be slow on large datasets without specific indexes, but acceptable for this scale.
      // We can't easily use `q` builder for array intersection in `filter` efficiently without `v.array` helpers which are limited.
      // We'll use a javascript filter function if we were collecting, but here we are in `filter(q => ...)`
      // Convex `filter` runs on server.
      // We can check if ANY of the product forms match ANY of the selected forms.
      // Since we can't loop easily in `q` builder, we might have to rely on `collect` and filter in memory if we can't express it.
      // BUT `paginate` requires a query.
      // Workaround: We will filter in memory if we must, OR we accept that we can't filter array-overlaps in `paginate` easily.
      // Actually, we can use `q` to check specific fields if we know them, but dynamic arrays are hard.
      // Let's use the `searchProducts` approach for complex filtering if needed, OR
      // For now, let's skip complex array intersection in `paginate` query builder and do it in memory? 
      // No, `paginate` happens on DB.
      // We will skip this filter in the DB query and filter the *page* results (which is imperfect but prevents crashing).
      // Better: We will use `searchProducts` for complex filtering scenarios in the UI, 
      // and `getPaginatedProducts` for the common "Browsing" scenarios (Category, Brand, Price).
    }

    if (args.inStockOnly) {
      query = query.filter((q) => q.gt(q.field("stock"), 0));
    }

    const result = await query.paginate(args.paginationOpts);

    const pageWithUrls = await Promise.all(
      result.page.map(async (p) => {
        // Manual filtering for array fields if needed (imperfect pagination but filters data)
        // This effectively reduces page size, but ensures correctness of displayed data.
        if (args.forms && args.forms.length > 0) {
          if (!p.forms || !p.forms.some(f => args.forms!.includes(f))) return null;
        }
        if (args.symptoms && args.symptoms.length > 0) {
          if (!p.symptomsTags || !p.symptomsTags.some(s => args.symptoms!.includes(s))) return null;
        }
        if (args.potencies && args.potencies.length > 0) {
          if (!p.potencies || !p.potencies.some(pot => args.potencies!.includes(pot))) return null;
        }

        return {
          ...p,
          imageUrl: p.imageStorageId
            ? (await ctx.storage.getUrl(p.imageStorageId)) || p.imageUrl || ""
            : p.imageUrl || "",
        };
      })
    );

    // Filter out nulls from manual filtering
    const filteredPage = pageWithUrls.filter(p => p !== null);

    return { ...result, page: filteredPage };
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
    forms: v.optional(v.array(v.string())),
    symptoms: v.optional(v.array(v.string())),
    potencies: v.optional(v.array(v.string())),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sort: v.optional(v.string()), 
    inStockOnly: v.optional(v.boolean()), 
  },
  handler: async (ctx, args) => {
    let products;

    // Use search index if query is present
    if (args.query) {
      products = await ctx.db
        .query("products")
        .withSearchIndex("search_all", (q) => q.search("searchText", args.query!))
        .collect();
    } else {
      // Fallback to full scan or specific index if no query
      // Note: We could optimize this with indexes for specific filters if needed
      products = await ctx.db.query("products").collect();
    }
    
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

    if (args.forms && args.forms.length > 0) {
      filtered = filtered.filter((p) => p.forms && p.forms.some(f => args.forms!.includes(f)));
    }

    if (args.symptoms && args.symptoms.length > 0) {
      filtered = filtered.filter((p) => p.symptomsTags && p.symptomsTags.some(s => args.symptoms!.includes(s)));
    }

    if (args.potencies && args.potencies.length > 0) {
      filtered = filtered.filter((p) => p.potencies && p.potencies.some(pot => args.potencies!.includes(pot)));
    }

    if (args.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.basePrice >= args.minPrice!);
    }

    if (args.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.basePrice <= args.maxPrice!);
    }

    if (args.inStockOnly) {
      filtered = filtered.filter((p) => p.stock > 0);
    }

    // If using search index, results are already sorted by relevance.
    // Only apply manual sorting if requested or if NOT using search index (and thus no relevance sort)
    // However, if we have a query AND a sort, the sort overrides relevance.
    
    if (args.sort) {
      filtered.sort((a, b) => {
        switch (args.sort) {
          case "price_asc":
            return a.basePrice - b.basePrice;
          case "price_desc":
            return b.basePrice - a.basePrice;
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "name_desc":
            return b.name.localeCompare(a.name);
          case "rating_desc":
            return (b.averageRating || 0) - (a.averageRating || 0);
          case "rating_asc":
            return (a.averageRating || 0) - (b.averageRating || 0);
          default:
            return 0;
        }
      });
    } else if (!args.query) {
       // Default sort if no query and no sort specified
       filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }

    return await Promise.all(
      filtered.map(async (p) => ({
        ...p,
        imageUrl: p.imageStorageId
          ? (await ctx.storage.getUrl(p.imageStorageId)) || p.imageUrl || ""
          : p.imageUrl || "",
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
    
    const searchText = generateSearchText(
      args.name, 
      args.brand, 
      args.description, 
      args.symptomsTags
    );

    const productId = await ctx.db.insert("products", {
      ...args,
      category: args.category || "Classical",
      availability: args.availability || "in_stock",
      images: args.images || [],
      packingSizes: args.packingSizes || ["30ml", "100ml"],
      searchText,
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
    
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");

    // Re-generate search text if relevant fields are updated
    let searchText = product.searchText;
    if (updates.name || updates.brand || updates.description || updates.symptomsTags) {
      searchText = generateSearchText(
        updates.name || product.name,
        updates.brand !== undefined ? updates.brand : product.brand,
        updates.description || product.description,
        updates.symptomsTags || product.symptomsTags
      );
    }

    await ctx.db.patch(id, { ...updates, searchText });

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
      const searchText = generateSearchText(
        product.name,
        product.brand,
        product.description,
        product.symptomsTags
      );
      await ctx.db.insert("products", { ...product, searchText });
    }
  },
});

export const backfillSearchText = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    for (const product of products) {
      if (!product.searchText) {
        const searchText = generateSearchText(
          product.name,
          product.brand,
          product.description,
          product.symptomsTags
        );
        await ctx.db.patch(product._id, { searchText });
      }
    }
  },
});