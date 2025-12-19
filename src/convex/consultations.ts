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
    specialization: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
      userId: userId || undefined,
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