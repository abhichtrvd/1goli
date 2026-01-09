import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const listDoctors = query({
  args: { query: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.query) {
      // Search by name and city
      const byName = await ctx.db
        .query("consultationDoctors")
        .withSearchIndex("search_name", (q) => 
          q.search("name", args.query!)
        )
        .take(20);

      const byCity = await ctx.db
        .query("consultationDoctors")
        .withSearchIndex("search_city", (q) => 
          q.search("clinicCity", args.query!)
        )
        .take(20);

      // Merge and deduplicate based on _id
      const map = new Map();
      [...byName, ...byCity].forEach(d => map.set(d._id, d));
      return Array.from(map.values());
    }
    
    // Return suggested doctors (limit to 20 to avoid overfetching)
    return await ctx.db.query("consultationDoctors").take(20);
  },
});

export const getPaginatedDoctors = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    specialization: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("consultationDoctors")
        .withSearchIndex("search_name", (q) => {
          let search = q.search("name", args.search!);
          if (args.specialization) {
            search = search.eq("specialization", args.specialization);
          }
          if (args.city) {
            search = search.eq("clinicCity", args.city);
          }
          return search;
        })
        .paginate(args.paginationOpts);
    }

    let query;
    
    if (args.specialization) {
      query = ctx.db
        .query("consultationDoctors")
        .withIndex("by_specialization", (q) => q.eq("specialization", args.specialization!));
    } else if (args.city) {
      query = ctx.db
        .query("consultationDoctors")
        .withIndex("by_city", (q) => q.eq("clinicCity", args.city!));
    } else {
      query = ctx.db.query("consultationDoctors").order("desc");
    }

    return await query.paginate(args.paginationOpts);
  },
});

export const seedDoctors = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("consultationDoctors").take(1);
    if (existing.length > 0) return;

    const doctors = [
      {
        name: "Dr. Ananya Rao",
        credentials: "MD (Hom), Senior Consultant",
        specialization: "Chronic Lifestyle Conditions",
        bio: "Holistic care for chronic lifestyle conditions, skin, respiratory and hormonal health. Inspired by Lybrate's structured experience.",
        experienceYears: 14,
        rating: 4.9,
        totalConsultations: 12000,
        clinicAddress: "Wellness Square, 4th Floor, Road No. 36, Jubilee Hills",
        clinicCity: "Hyderabad",
        clinicPhone: "+91 98210 44558",
        availability: ["Mon-Sat 9AM-9PM", "Sun 10AM-2PM"],
        languages: ["English", "Hindi", "Telugu"],
        consultationModes: [
          { mode: "Clinic Visit", price: 899, durationMinutes: 30, description: "Physical examination, Prescription & follow-up plan" },
          { mode: "Video Consultation", price: 699, durationMinutes: 25, description: "HD video session, Digital prescription on email" },
          { mode: "Follow-up Call", price: 299, durationMinutes: 15, description: "Prescription tweaks, Supplement guidance" }
        ],
        services: ["Chronic Migraine", "Thyroid", "PCOS", "Skin & Hair", "Allergies", "Child Wellness"],
        imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=500&auto=format&fit=crop"
      },
      {
        name: "Dr. Rajesh Kumar",
        credentials: "BHMS, MD",
        specialization: "Pediatrics & Allergies",
        bio: "Specialist in child health and recurring allergies. Gentle approach for kids.",
        experienceYears: 10,
        rating: 4.7,
        totalConsultations: 8500,
        clinicAddress: "Lotus Homeo Clinic, Indiranagar",
        clinicCity: "Bangalore",
        clinicPhone: "+91 98765 12345",
        availability: ["Mon-Fri 10AM-6PM"],
        languages: ["English", "Kannada", "Hindi"],
        consultationModes: [
          { mode: "Clinic Visit", price: 700, durationMinutes: 30, description: "Detailed child assessment" },
          { mode: "Video Consultation", price: 500, durationMinutes: 20, description: "Online consultation for parents" }
        ],
        services: ["Child Immunity", "Asthma", "Eczema", "Growth Issues"],
        imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=500&auto=format&fit=crop"
      },
      {
        name: "Dr. Sarah Khan",
        credentials: "MD (Hom), Dermatology Expert",
        specialization: "Dermatology",
        bio: "Expert in treating skin conditions like psoriasis, eczema, and acne with homeopathy.",
        experienceYears: 8,
        rating: 4.8,
        totalConsultations: 5000,
        clinicAddress: "Glow Skin Clinic, Bandra West",
        clinicCity: "Mumbai",
        clinicPhone: "+91 99887 76655",
        availability: ["Tue-Sun 11AM-8PM"],
        languages: ["English", "Hindi", "Marathi"],
        consultationModes: [
          { mode: "Clinic Visit", price: 1000, durationMinutes: 40, description: "Skin analysis and treatment" },
          { mode: "Video Consultation", price: 800, durationMinutes: 30, description: "Visual assessment via HD video" }
        ],
        services: ["Acne", "Psoriasis", "Hair Loss", "Pigmentation"],
        imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=500&auto=format&fit=crop"
      }
    ];

    for (const doctor of doctors) {
      await ctx.db.insert("consultationDoctors", doctor);
    }
  },
});

export const bookAppointment = mutation({
  args: {
    doctorId: v.id("consultationDoctors"),
    patientName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    preferredDate: v.string(),
    preferredSlot: v.string(),
    concern: v.optional(v.string()),
    consultationMode: v.string(),
    amount: v.number(),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    const bookingId = await ctx.db.insert("consultationBookings", {
      doctorId: args.doctorId,
      userId: userId || undefined, // Ensure null becomes undefined if needed, though optional handles it
      patientName: args.patientName,
      phone: args.phone,
      email: args.email,
      preferredDate: args.preferredDate,
      preferredSlot: args.preferredSlot,
      concern: args.concern,
      consultationMode: args.consultationMode,
      paymentMethod: args.paymentMethod,
      paymentStatus: args.paymentMethod === "online" ? "paid" : "pending",
      paymentReference: args.paymentMethod === "online" ? `PAY-${Date.now()}` : "N/A",
      status: "confirmed",
      amount: args.amount,
    });

    return bookingId;
  },
});

export const getUserBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const bookings = await ctx.db
      .query("consultationBookings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
      
    const bookingsWithDoctor = await Promise.all(
      bookings.map(async (booking) => {
        const doctor = await ctx.db.get(booking.doctorId);
        return { ...booking, doctor };
      })
    );
    
    return bookingsWithDoctor;
  },
});

export const createDoctor = mutation({
  args: {
    name: v.string(),
    credentials: v.string(),
    specialization: v.string(),
    bio: v.string(),
    experienceYears: v.number(),
    clinicAddress: v.string(),
    clinicCity: v.string(),
    clinicPhone: v.string(),
    imageUrl: v.optional(v.string()),
    availability: v.array(v.string()),
    languages: v.array(v.string()),
    services: v.array(v.string()),
    consultationModes: v.array(v.object({
        mode: v.string(),
        price: v.number(),
        durationMinutes: v.number(),
        description: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const { imageUrl, ...rest } = args;
    await ctx.db.insert("consultationDoctors", {
        ...rest,
        imageUrl: imageUrl ?? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=500&auto=format&fit=crop",
        rating: 0,
        totalConsultations: 0,
    });
  }
});

export const updateDoctor = mutation({
    args: {
        id: v.id("consultationDoctors"),
        name: v.optional(v.string()),
        credentials: v.optional(v.string()),
        specialization: v.optional(v.string()),
        bio: v.optional(v.string()),
        experienceYears: v.optional(v.number()),
        clinicAddress: v.optional(v.string()),
        clinicCity: v.optional(v.string()),
        clinicPhone: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        availability: v.optional(v.array(v.string())),
        languages: v.optional(v.array(v.string())),
        services: v.optional(v.array(v.string())),
        consultationModes: v.optional(v.array(v.object({
            mode: v.string(),
            price: v.number(),
            durationMinutes: v.number(),
            description: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        // Filter out undefined fields to avoid overwriting with undefined if that's an issue, 
        // though Convex usually handles partial updates fine. 
        // Explicitly handling it ensures safety.
        const updates: any = {};
        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                updates[key] = value;
            }
        }
        await ctx.db.patch(id, updates);
    }
});

export const deleteDoctor = mutation({
    args: { id: v.id("consultationDoctors") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    }
});

export const bulkDeleteDoctors = mutation({
  args: { ids: v.array(v.id("consultationDoctors")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  }
});

export const importDoctors = mutation({
  args: {
    doctors: v.array(
      v.object({
        name: v.string(),
        specialization: v.string(),
        credentials: v.string(),
        experienceYears: v.number(),
        clinicCity: v.string(),
        clinicAddress: v.string(),
        clinicPhone: v.string(),
        bio: v.string(),
        availability: v.optional(v.string()),
        languages: v.optional(v.string()),
        services: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = { imported: 0, updated: 0, failed: 0, errors: [] as { row: number; error: string }[] };

    let rowIndex = 0;
    for (const doctorData of args.doctors) {
      rowIndex++;
      try {
        // Check if doctor already exists by name and city
        const existing = await ctx.db
          .query("consultationDoctors")
          .filter((q) =>
            q.and(
              q.eq(q.field("name"), doctorData.name),
              q.eq(q.field("clinicCity"), doctorData.clinicCity)
            )
          )
          .first();

        // Parse array fields from comma-separated strings
        const availability = doctorData.availability
          ? doctorData.availability.split(';').map(s => s.trim()).filter(Boolean)
          : ["Mon-Sat 10AM-8PM"];

        const languages = doctorData.languages
          ? doctorData.languages.split(',').map(s => s.trim()).filter(Boolean)
          : ["English", "Hindi"];

        const services = doctorData.services
          ? doctorData.services.split(',').map(s => s.trim()).filter(Boolean)
          : ["General Consultation"];

        // Default consultation modes
        const consultationModes = [
          { mode: "Video", price: 500, durationMinutes: 20, description: "Online Video Consultation" },
          { mode: "Clinic", price: 800, durationMinutes: 30, description: "In-person Visit" }
        ];

        const doctorRecord = {
          name: doctorData.name,
          specialization: doctorData.specialization,
          credentials: doctorData.credentials,
          experienceYears: doctorData.experienceYears,
          clinicCity: doctorData.clinicCity,
          clinicAddress: doctorData.clinicAddress,
          clinicPhone: doctorData.clinicPhone,
          bio: doctorData.bio,
          availability,
          languages,
          services,
          consultationModes,
          imageUrl: doctorData.imageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=500&auto=format&fit=crop",
          rating: 0,
          totalConsultations: 0,
        };

        if (existing) {
          // Update existing doctor
          await ctx.db.patch(existing._id, doctorRecord);
          results.updated++;
        } else {
          // Create new doctor
          await ctx.db.insert("consultationDoctors", doctorRecord);
          results.imported++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: rowIndex, error: err.message });
      }
    }

    return results;
  },
});