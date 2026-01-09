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
        imageUrl: p.imageStorageId ? await ctx.storage.getUrl(p.imageStorageId) : null,
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

      // Filter out deleted prescriptions from search results
      result = {
        ...result,
        page: result.page.filter(p => !p.isDeleted)
      };
    } else {
      // Standard filtering
      let baseQuery;

      if (args.status) {
        baseQuery = ctx.db.query("prescriptions").withIndex("by_status", (q) => q.eq("status", args.status as any));
      } else {
        baseQuery = ctx.db.query("prescriptions");
      }

      let query = baseQuery.order(sortOrder);

      // Apply date filter and deleted filter
      if (args.startDate || args.endDate) {
        query = query.filter((q) => {
          const conditions = [q.neq(q.field("isDeleted"), true)];
          if (args.startDate) conditions.push(q.gte(q.field("_creationTime"), args.startDate));
          if (args.endDate) conditions.push(q.lte(q.field("_creationTime"), args.endDate));

          if (conditions.length === 1) return conditions[0];
          if (conditions.length === 2) return q.and(conditions[0], conditions[1]);
          if (conditions.length === 3) return q.and(q.and(conditions[0], conditions[1]), conditions[2]);
          return q.eq(true, true); // Should not happen
        });
      } else {
        // Only apply deleted filter
        query = query.filter((q) => q.neq(q.field("isDeleted"), true));
      }

      result = await query.paginate(args.paginationOpts);
    }

    const pageWithDetails = await Promise.all(
      result.page.map(async (p) => {
        const imageUrl = p.imageStorageId ? await ctx.storage.getUrl(p.imageStorageId) : null;
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
    const userId = await getAuthUserId(ctx);
    
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

    await ctx.db.insert("auditLogs", {
      action: "update_prescription_status",
      entityId: args.id,
      entityType: "prescription",
      performedBy: userId || "admin",
      details: `Updated prescription status to ${args.status}`,
      timestamp: Date.now(),
    });
  },
});

export const bulkUpdatePrescriptionStatus = mutation({
  args: {
    ids: v.array(v.id("prescriptions")),
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
    const userId = await getAuthUserId(ctx);

    for (const id of args.ids) {
      const prescription = await ctx.db.get(id);
      if (prescription) {
        const parts = [
          prescription.patientName || "",
          prescription.patientPhone || "",
          prescription.notes || "",
          prescription.guestInfo?.email || "",
          args.pharmacistNotes || prescription.pharmacistNotes || ""
        ];
        const searchText = parts.join(" ");

        await ctx.db.patch(id, {
          status: args.status,
          pharmacistNotes: args.pharmacistNotes !== undefined ? args.pharmacistNotes : prescription.pharmacistNotes,
          searchText
        });
      }
    }

    await ctx.db.insert("auditLogs", {
      action: "bulk_update_prescription_status",
      entityType: "prescription",
      performedBy: userId || "admin",
      details: `Updated ${args.ids.length} prescriptions to ${args.status}`,
      timestamp: Date.now(),
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

// Get all users for patient selection
export const getUsersForPrescription = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
    }));
  },
});

// Get all doctors for prescription
export const getDoctorsForPrescription = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const doctors = await ctx.db.query("consultationDoctors").collect();
    return doctors.map(d => ({
      _id: d._id,
      name: d.name,
      credentials: d.credentials,
      specialization: d.specialization,
    }));
  },
});

export const adminCreatePrescription = mutation({
  args: {
    userId: v.optional(v.id("users")),
    patientName: v.string(),
    patientPhone: v.string(),
    patientEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("processed"),
      v.literal("rejected")
    )),
    imageStorageId: v.optional(v.id("_storage")),
    medicines: v.optional(v.array(v.object({
      name: v.string(),
      dosage: v.string(),
      frequency: v.string(),
      duration: v.optional(v.string()),
    }))),
    doctorId: v.optional(v.id("consultationDoctors")),
    diagnosis: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    // Get doctor name if doctorId is provided
    let doctorName;
    if (args.doctorId) {
      const doctor = await ctx.db.get(args.doctorId);
      doctorName = doctor?.name;
    }

    // Construct search text
    const medicineNames = args.medicines?.map(m => m.name).join(" ") || "";
    const parts = [
      args.patientName,
      args.patientPhone,
      args.patientEmail || "",
      args.notes || "",
      medicineNames,
      args.diagnosis || "",
      doctorName || "",
    ];
    const searchText = parts.join(" ");

    const prescriptionId = await ctx.db.insert("prescriptions", {
      userId: args.userId,
      patientName: args.patientName,
      patientPhone: args.patientPhone,
      guestInfo: args.userId ? undefined : {
        name: args.patientName,
        phone: args.patientPhone,
        email: args.patientEmail,
      },
      notes: args.notes,
      status: args.status || "pending",
      imageStorageId: args.imageStorageId,
      medicines: args.medicines,
      doctorId: args.doctorId,
      doctorName,
      diagnosis: args.diagnosis,
      expiryDate: args.expiryDate,
      searchText,
      isDeleted: false,
    });

    await ctx.db.insert("auditLogs", {
      action: "create_prescription",
      entityId: prescriptionId,
      entityType: "prescription",
      performedBy: adminId || "admin",
      details: `Created prescription for ${args.patientName}`,
      timestamp: Date.now(),
    });

    return prescriptionId;
  },
});

export const deletePrescription = mutation({
  args: {
    id: v.id("prescriptions"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);

    const prescription = await ctx.db.get(args.id);
    if (!prescription) throw new Error("Prescription not found");

    await ctx.db.patch(args.id, {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: userId || "admin",
    });

    await ctx.db.insert("auditLogs", {
      action: "delete_prescription",
      entityId: args.id,
      entityType: "prescription",
      performedBy: userId || "admin",
      details: `Deleted prescription for ${prescription.patientName}`,
      timestamp: Date.now(),
    });
  },
});

export const importPrescriptions = mutation({
  args: {
    prescriptions: v.array(v.object({
      patientEmail: v.optional(v.string()),
      patientName: v.optional(v.string()),
      patientPhone: v.optional(v.string()),
      doctorName: v.string(),
      medicines: v.string(), // JSON string of medicines array
      diagnosis: v.optional(v.string()),
      expiryDate: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const adminId = await getAuthUserId(ctx);

    const imported: Id<"prescriptions">[] = [];
    const errors: string[] = [];

    for (let i = 0; i < args.prescriptions.length; i++) {
      try {
        const prescription = args.prescriptions[i];

        // Validate required fields
        if (!prescription.doctorName) {
          errors.push(`Row ${i + 1}: Doctor name is required`);
          continue;
        }

        // Find user by email or phone
        let userId;
        let patientName = prescription.patientName || "";
        let patientPhone = prescription.patientPhone || "";

        if (prescription.patientEmail) {
          const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", prescription.patientEmail))
            .unique();
          if (user) {
            userId = user._id;
            patientName = user.name || patientName;
            patientPhone = user.phone || patientPhone;
          }
        } else if (prescription.patientPhone) {
          const user = await ctx.db
            .query("users")
            .withIndex("phone", (q) => q.eq("phone", prescription.patientPhone))
            .unique();
          if (user) {
            userId = user._id;
            patientName = user.name || patientName;
          }
        }

        if (!patientName) {
          errors.push(`Row ${i + 1}: Patient name is required when user not found`);
          continue;
        }

        // Find doctor by name
        const doctors = await ctx.db.query("consultationDoctors").collect();
        const doctor = doctors.find(
          (d) => d.name.toLowerCase() === prescription.doctorName.toLowerCase()
        );

        // Parse medicines
        let medicines;
        try {
          medicines = JSON.parse(prescription.medicines);
          if (!Array.isArray(medicines)) {
            throw new Error("Medicines must be an array");
          }
        } catch (e) {
          errors.push(`Row ${i + 1}: Invalid medicines format (must be valid JSON array)`);
          continue;
        }

        // Parse expiry date
        let expiryDate: number | undefined;
        if (prescription.expiryDate) {
          const parsed = new Date(prescription.expiryDate);
          if (!isNaN(parsed.getTime())) {
            expiryDate = parsed.getTime();
          } else {
            errors.push(`Row ${i + 1}: Invalid expiry date format`);
            continue;
          }
        }

        // Build search text
        const medicineNames = medicines.map((m: any) => m.name).join(" ");
        const parts = [
          patientName,
          patientPhone,
          prescription.patientEmail || "",
          medicineNames,
          prescription.diagnosis || "",
          prescription.doctorName,
        ];
        const searchText = parts.join(" ");

        const id = await ctx.db.insert("prescriptions", {
          userId: userId ? (userId as Id<"users">) : undefined,
          patientName,
          patientPhone,
          guestInfo: userId ? undefined : {
            name: patientName,
            phone: patientPhone,
            email: prescription.patientEmail,
          },
          medicines,
          doctorId: doctor?._id,
          doctorName: prescription.doctorName,
          diagnosis: prescription.diagnosis,
          expiryDate,
          status: "pending",
          searchText,
          isDeleted: false,
        });

        imported.push(id);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    await ctx.db.insert("auditLogs", {
      action: "import_prescriptions",
      entityType: "prescription",
      performedBy: adminId || "admin",
      details: `Imported ${imported.length} prescriptions. ${errors.length} errors.`,
      timestamp: Date.now(),
    });

    return {
      imported: imported.length,
      errors,
    };
  },
});