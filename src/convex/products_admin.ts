import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAdmin } from "./users";
import { getAuthUserId } from "@convex-dev/auth/server";

// Search Relevance Weights Configuration
export const SEARCH_WEIGHTS = {
  NAME: 3,
  BRAND: 2,
  SYMPTOMS: 2,
  FORMS: 1,
  POTENCIES: 1,
  DESCRIPTION: 1,
};

// Helper to generate search text
export function generateSearchText(
  name: string, 
  brand: string | undefined, 
  description: string, 
  symptomsTags: string[],
  forms: string[] = [],
  potencies: string[] = []
): string {
  const nameText = Array(SEARCH_WEIGHTS.NAME).fill(name).join(" ");
  const brandText = brand ? Array(SEARCH_WEIGHTS.BRAND).fill(brand).join(" ") : "";
  
  const symptomsText = symptomsTags.map(s => Array(SEARCH_WEIGHTS.SYMPTOMS).fill(s).join(" ")).join(" ");
  const formsText = forms.map(f => Array(SEARCH_WEIGHTS.FORMS).fill(f).join(" ")).join(" ");
  const potenciesText = potencies.map(p => Array(SEARCH_WEIGHTS.POTENCIES).fill(p).join(" ")).join(" ");
  
  return `${nameText} ${brandText} ${symptomsText} ${formsText} ${potenciesText} ${description}`.toLowerCase();
}

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
      args.symptomsTags,
      args.forms,
      args.potencies
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

    let searchText = product.searchText;
    if (updates.name || updates.brand || updates.description || updates.symptomsTags || updates.forms || updates.potencies) {
      searchText = generateSearchText(
        updates.name || product.name,
        updates.brand !== undefined ? updates.brand : product.brand,
        updates.description || product.description,
        updates.symptomsTags || product.symptomsTags,
        updates.forms || product.forms,
        updates.potencies || product.potencies
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

export const bulkCreateProducts = mutation({
  args: {
    products: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        brand: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        basePrice: v.number(),
        stock: v.number(),
        category: v.optional(v.string()),
        availability: v.optional(v.string()),
        potencies: v.array(v.string()),
        forms: v.array(v.string()),
        symptomsTags: v.array(v.string()),
        keyBenefits: v.optional(v.array(v.string())),
        directionsForUse: v.optional(v.string()),
        safetyInformation: v.optional(v.string()),
        ingredients: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    let count = 0;

    for (const product of args.products) {
      const searchText = generateSearchText(
        product.name,
        product.brand,
        product.description,
        product.symptomsTags,
        product.forms,
        product.potencies
      );

      await ctx.db.insert("products", {
        ...product,
        category: product.category || "Classical",
        availability: product.availability || "in_stock",
        packingSizes: ["30ml", "100ml"],
        searchText,
      });
      count++;
    }

    await ctx.db.insert("auditLogs", {
      action: "bulk_create_products",
      entityType: "product",
      performedBy: userId || "admin",
      details: `Imported ${count} products via CSV`,
      timestamp: Date.now(),
    });

    return count;
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
        product.symptomsTags,
        product.forms,
        product.potencies
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
      const searchText = generateSearchText(
        product.name,
        product.brand,
        product.description,
        product.symptomsTags,
        product.forms,
        product.potencies
      );
      await ctx.db.patch(product._id, { searchText });
    }
  },
});
