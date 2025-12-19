import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const submitPrescription = mutation({
  args: {
    imageStorageId: v.id("_storage"),
    notes: v.optional(v.string()),
    guestInfo: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    let patientName = args.guestInfo?.name;
    let patientPhone = args.guestInfo?.phone;

    if (userId) {
      const user = await ctx.db.get(userId as Id<"users">);
      if (user) {
        patientName = user.name;
        patientPhone = user.phone;
      }
    }

    // Construct search text
    const parts = [
      patientName || "",
      patientPhone || "",
      args.notes || "",
      args.guestInfo?.email || ""
    ];
    const searchText = parts.join(" ");

    const prescriptionId = await ctx.db.insert("prescriptions", {
      userId: userId || undefined,
      guestInfo: args.guestInfo,
      patientName,
      patientPhone,
      imageStorageId: args.imageStorageId,
      notes: args.notes,
      status: "pending",
      searchText,
    });

    return prescriptionId;
  },
});

export const getMyPrescriptions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const prescriptions = await ctx.db
      .query("prescriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return await Promise.all(
      prescriptions.map(async (p) => ({
        ...p,
        imageUrl: await ctx.storage.getUrl(p.imageStorageId),
      }))
    );
  },
});

// Admin functions

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const pending = await ctx.db
      .query("prescriptions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return pending.length;
  },
});

export const getPaginatedPrescriptions = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const sortOrder = args.sortOrder || "desc";
    let result;
    
    if (args.search) {
      // Use search index if search query is present
      // Note: Date filtering is not applied to search results to maintain performance and simplicity
      if (args.status) {
        result = await ctx.db
          .query("prescriptions")
          .withSearchIndex("search_all", (q) => 
            q.search("searchText", args.search!).eq("status", args.status as any)
          )
          .paginate(args.paginationOpts);
      } else {
        result = await ctx.db
          .query("prescriptions")
          .withSearchIndex("search_all", (q) => 
            q.search("searchText", args.search!)
          )
          .paginate(args.paginationOpts);
      }
    } else {
      // Standard filtering
      let baseQuery;
      
      if (args.status) {
        baseQuery = ctx.db.query("prescriptions").withIndex("by_status", (q) => q.eq("status", args.status as any));
      } else {
        baseQuery = ctx.db.query("prescriptions");
      }
      
      let query = baseQuery.order(sortOrder);

      // Apply date filter if provided
      if (args.startDate || args.endDate) {
        query = query.filter((q) => {
          const conditions = [];
          if (args.startDate) conditions.push(q.gte(q.field("_creationTime"), args.startDate));
          if (args.endDate) conditions.push(q.lte(q.field("_creationTime"), args.endDate));
          
          if (conditions.length === 1) return conditions[0];
          if (conditions.length > 1) return q.and(conditions[0], conditions[1]);
          return q.eq(true, true); // Should not happen
        });
      }

      result = await query.paginate(args.paginationOpts);
    }

    const pageWithDetails = await Promise.all(
      result.page.map(async (p) => {
        const imageUrl = await ctx.storage.getUrl(p.imageStorageId);
        let user = null;
        if (p.userId) {
          user = await ctx.db.get(p.userId as Id<"users">);
        }
        return {
          ...p,
          imageUrl,
          user,
        };
      })
    );

    return { ...result, page: pageWithDetails };
  },
});

export const updatePrescriptionStatus = mutation({
  args: {
    id: v.id("prescriptions"),
    status: v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("processed"),
        v.literal("rejected")
    ),
    pharmacistNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const prescription = await ctx.db.get(args.id);
    if (!prescription) throw new Error("Prescription not found");

    // Update search text to include new pharmacist notes
    const parts = [
      prescription.patientName || "",
      prescription.patientPhone || "",
      prescription.notes || "",
      prescription.guestInfo?.email || "",
      args.pharmacistNotes || ""
    ];
    const searchText = parts.join(" ");

    await ctx.db.patch(args.id, {
      status: args.status,
      pharmacistNotes: args.pharmacistNotes,
      searchText,
    });
  },
});

export const backfillSearchText = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const prescriptions = await ctx.db.query("prescriptions").collect();
    
    for (const p of prescriptions) {
      if (!p.searchText) {
        const parts = [
          p.patientName || "",
          p.patientPhone || "",
          p.notes || "",
          p.guestInfo?.email || "",
          p.pharmacistNotes || ""
        ];
        const searchText = parts.join(" ");
        await ctx.db.patch(p._id, { searchText });
      }
    }
    return `Backfilled ${prescriptions.length} prescriptions`;
  },
});