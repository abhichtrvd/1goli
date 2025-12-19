import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";
import { paginationOptsValidator } from "convex/server";

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
    
    // If not authenticated, guestInfo is required (enforced by UI logic, but good to check)
    // For now we allow the schema flexibility.

    const prescriptionId = await ctx.db.insert("prescriptions", {
      userId: userId || undefined,
      guestInfo: args.guestInfo,
      imageStorageId: args.imageStorageId,
      notes: args.notes,
      status: "pending",
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

export const getPaginatedPrescriptions = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    let query;
    if (args.status) {
      query = ctx.db
        .query("prescriptions")
        .withIndex("by_status", (q) => q.eq("status", args.status as any));
    } else {
      query = ctx.db.query("prescriptions").order("desc");
    }

    const result = await query.paginate(args.paginationOpts);

    const pageWithUrls = await Promise.all(
      result.page.map(async (p) => ({
        ...p,
        imageUrl: await ctx.storage.getUrl(p.imageStorageId),
      }))
    );

    return { ...result, page: pageWithUrls };
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
    await ctx.db.patch(args.id, {
      status: args.status,
      pharmacistNotes: args.pharmacistNotes,
    });
  },
});
