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
  },
  handler: async (ctx, args) => {
    let query;
    if (args.brand) {
      query = ctx.db
        .query("products")
        .withIndex("by_brand", (q) => q.eq("brand", args.brand));
    } else {
      query = ctx.db.query("products").order("desc");
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
    // Check if we need to backfill brands or packingSizes for existing products
    const allProducts = await ctx.db.query("products").collect();
    for (const p of allProducts) {
      let updates: any = {};
      if (!p.brand) {
        const brands = ["Dr. Reckeweg", "SBL World Class", "Schwabe India", "Adel Pekana", "Bakson's", "Bjain Pharma"];
        updates.brand = brands[Math.floor(Math.random() * brands.length)];
      }
      if (!p.packingSizes) {
        // Assign default packing sizes based on form/category guess
        if (p.forms.includes("Tablets") || p.category === "Biochemics") {
            updates.packingSizes = ["25g", "450g"];
        } else if (p.forms.includes("Ointment")) {
            updates.packingSizes = ["25g", "50g"];
        } else {
            updates.packingSizes = ["30ml", "100ml", "450ml"];
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(p._id, updates);
      }
    }

    const existing = await ctx.db.query("products").take(1);
    if (existing.length > 0) return; // Already seeded

    const products = [
      {
        name: "Arnica Montana",
        description: "The premier remedy for trauma, bruising, and muscle soreness. Essential for any first aid kit to reduce swelling and pain.",
        imageUrl: "https://images.unsplash.com/photo-1625591342274-013866180475?w=800&auto=format&fit=crop&q=60",
        potencies: ["30C", "200C", "1M", "Mother Tincture"],
        forms: ["Dilution", "Globules", "Ointment"],
        packingSizes: ["30ml", "100ml", "450ml"],
        basePrice: 12.99,
        symptomsTags: ["injury", "bruise", "trauma", "muscle pain", "swelling"],
        category: "Classical",
        availability: "in_stock",
        brand: "Dr. Reckeweg"
      },
      {
        name: "Nux Vomica",
        description: "Effective for digestive issues, stress, and irritability. Often used for 'modern life' excesses like overeating or overworking.",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=60",
        potencies: ["30C", "200C", "1M"],
        forms: ["Dilution", "Globules", "Drops"],
        packingSizes: ["30ml", "100ml"],
        basePrice: 14.50,
        symptomsTags: ["indigestion", "stress", "hangover", "irritability", "constipation"],
        category: "Classical",
        availability: "in_stock",
        brand: "SBL World Class"
      },
      {
        name: "Oscillococcinum",
        description: "Clinically proven for flu-like symptoms. Reduces the duration and severity of body aches, headache, fever, and chills.",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60",
        potencies: ["200K"],
        forms: ["Tube"],
        packingSizes: ["6 Doses", "12 Doses", "30 Doses"],
        basePrice: 29.99,
        symptomsTags: ["flu", "body ache", "fever", "chills"],
        category: "Patent",
        availability: "in_stock",
        brand: "Boiron"
      },
      {
        name: "Rhus Toxicodendron",
        description: "Indicated for joint pain, arthritis, and rheumatic conditions that improve with motion and warmth.",
        imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=60",
        potencies: ["30C", "200C", "1M"],
        forms: ["Dilution", "Globules"],
        packingSizes: ["30ml", "100ml"],
        basePrice: 13.50,
        symptomsTags: ["joint pain", "arthritis", "stiffness", "back pain"],
        category: "Classical",
        availability: "in_stock",
        brand: "Schwabe India"
      },
      {
        name: "Belladonna",
        description: "For sudden high fever, throbbing headaches, and inflammation with redness and heat.",
        imageUrl: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=800&auto=format&fit=crop&q=60",
        potencies: ["30C", "200C"],
        forms: ["Dilution", "Globules", "Drops"],
        packingSizes: ["30ml", "100ml"],
        basePrice: 12.99,
        symptomsTags: ["fever", "headache", "inflammation", "sore throat"],
        category: "Classical",
        availability: "in_stock",
        brand: "Dr. Reckeweg"
      },
      {
        name: "Calendula Officinalis",
        description: "A powerful antiseptic healing agent for open wounds, cuts, and burns. Promotes rapid healing of skin.",
        imageUrl: "https://images.unsplash.com/photo-1496857239036-1fb137683000?w=800&auto=format&fit=crop&q=60",
        potencies: ["Mother Tincture", "30C"],
        forms: ["Ointment", "Dilution", "Spray"],
        packingSizes: ["25g", "50g", "30ml"],
        basePrice: 15.00,
        symptomsTags: ["wounds", "cuts", "burns", "skin", "antiseptic"],
        category: "Personal Care",
        availability: "in_stock",
        brand: "SBL World Class"
      },
      {
        name: "Calcarea Fluorica",
        description: "Biochemic tissue salt for elasticity of blood vessels, tissues, and skin.",
        imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&auto=format&fit=crop&q=60",
        potencies: ["6X", "12X"],
        forms: ["Tablets"],
        packingSizes: ["25g", "450g"],
        basePrice: 10.00,
        symptomsTags: ["varicose veins", "skin", "teeth"],
        category: "Biochemics",
        availability: "in_stock",
        brand: "Schwabe India"
      },
      {
        name: "Bio-Combination 28",
        description: "General tonic for overall health and vitality.",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60",
        potencies: ["6X"],
        forms: ["Tablets"],
        packingSizes: ["25g", "450g"],
        basePrice: 18.00,
        symptomsTags: ["tonic", "weakness", "vitality"],
        category: "Bio Combinations",
        availability: "in_stock",
        brand: "SBL World Class"
      }
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