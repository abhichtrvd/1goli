import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      phone: v.optional(v.string()), // phone of the user
      phoneVerificationTime: v.optional(v.number()), // phone verification time
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove
      address: v.optional(v.string()), // Added address field

      role: v.optional(roleValidator), // role of the user. do not remove
    })
      .index("email", ["email"])
      .index("phone", ["phone"])
      .index("by_role", ["role"])
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["role"],
      }),

    products: defineTable({
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
      
      // New Retail Fields
      keyBenefits: v.optional(v.array(v.string())),
      directionsForUse: v.optional(v.string()),
      safetyInformation: v.optional(v.string()),
      ingredients: v.optional(v.string()),

      // Rating Fields (Cached for performance)
      ratingCount: v.optional(v.number()),
      averageRating: v.optional(v.number()),

      // Search Field
      searchText: v.optional(v.string()),
    })
      .searchIndex("search_body", {
        searchField: "description",
        filterFields: ["name"],
      })
      .searchIndex("search_all", {
        searchField: "searchText",
        filterFields: ["category", "brand"],
      })
      .index("by_brand", ["brand"])
      .index("by_price", ["basePrice"])
      .index("by_name", ["name"])
      .index("by_rating", ["averageRating"])
      .index("by_rating_count", ["ratingCount"])
      .index("by_category", ["category"]),

    cartItems: defineTable({
      userId: v.string(),
      productId: v.id("products"),
      potency: v.string(),
      form: v.string(),
      packingSize: v.optional(v.string()), // Added packing size selection
      quantity: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_product_variant", ["userId", "productId", "potency", "form", "packingSize"]),

    orders: defineTable({
      userId: v.string(),
      items: v.array(
        v.object({
          productId: v.id("products"),
          name: v.string(),
          potency: v.string(),
          form: v.string(),
          packingSize: v.optional(v.string()), // Added packing size to order items
          quantity: v.number(),
          price: v.number(),
        })
      ),
      total: v.number(),
      status: v.string(),
      shippingAddress: v.string(),
      shippingDetails: v.optional(v.object({
        fullName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        phone: v.string(),
      })),
      paymentMethod: v.optional(v.string()),
      paymentStatus: v.optional(v.string()),
      paymentId: v.optional(v.string()),
      statusHistory: v.optional(
        v.array(
          v.object({
            status: v.string(),
            timestamp: v.number(),
            note: v.optional(v.string()),
          })
        )
      ),
    })
      .index("by_user", ["userId"])
      .searchIndex("search_shipping", {
        searchField: "shippingAddress",
      }),

    reviews: defineTable({
      userId: v.string(),
      userName: v.string(),
      productId: v.id("products"),
      rating: v.number(), // 1-5
      comment: v.optional(v.string()),
      title: v.optional(v.string()),
      verifiedPurchase: v.boolean(),
      helpfulCount: v.optional(v.number()),
      isEdited: v.optional(v.boolean()),
      lastEditedAt: v.optional(v.number()),
      // Admin Reply
      adminReply: v.optional(v.string()),
      adminRepliedAt: v.optional(v.number()),
      // Status for approval workflow
      status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    })
      .index("by_product", ["productId"])
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_product_status", ["productId", "status"]),

    reviewInteractions: defineTable({
      userId: v.string(),
      reviewId: v.id("reviews"),
      type: v.union(v.literal("helpful"), v.literal("report")),
    })
      .index("by_review_user", ["reviewId", "userId"])
      .index("by_review_type", ["reviewId", "type"]),

    prescriptions: defineTable({
      userId: v.optional(v.string()),
      guestInfo: v.optional(v.object({
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
      })),
      patientName: v.optional(v.string()), // Added for search
      patientPhone: v.optional(v.string()), // Added for search
      imageStorageId: v.id("_storage"),
      notes: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("processed"),
        v.literal("rejected")
      ),
      pharmacistNotes: v.optional(v.string()),
      searchText: v.optional(v.string()), // Added for comprehensive search
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .searchIndex("search_patient_name", {
        searchField: "patientName",
        filterFields: ["status"],
      })
      .searchIndex("search_all", {
        searchField: "searchText",
        filterFields: ["status"],
      }),

    consultationDoctors: defineTable({
      name: v.string(),
      credentials: v.string(),
      specialization: v.string(),
      bio: v.string(),
      experienceYears: v.number(),
      rating: v.number(),
      totalConsultations: v.number(),
      clinicAddress: v.string(),
      clinicCity: v.string(),
      clinicPhone: v.string(),
      clinicMapUrl: v.optional(v.string()),
      availability: v.array(v.string()),
      languages: v.array(v.string()),
      consultationModes: v.array(
        v.object({
          mode: v.string(),
          price: v.number(),
          durationMinutes: v.number(),
          description: v.optional(v.string()),
        })
      ),
      services: v.array(v.string()),
      imageUrl: v.string(),
    })
      .index("by_specialization", ["specialization"])
      .index("by_city", ["clinicCity"])
      .searchIndex("search_city", {
        searchField: "clinicCity",
      })
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["specialization", "clinicCity"],
      }),

    consultationBookings: defineTable({
      doctorId: v.id("consultationDoctors"),
      userId: v.optional(v.id("users")),
      patientName: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      preferredDate: v.string(),
      preferredSlot: v.string(),
      concern: v.optional(v.string()),
      consultationMode: v.string(),
      paymentMethod: v.string(),
      paymentStatus: v.union(v.literal("paid"), v.literal("pending")),
      paymentReference: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("completed"),
        v.literal("cancelled")
      ),
      amount: v.number(),
      notes: v.optional(v.string()),
    })
      .index("by_doctor", ["doctorId"])
      .index("by_user", ["userId"]),

    siteSettings: defineTable({
      siteName: v.string(),
      supportEmail: v.string(),
      supportPhone: v.string(),
      shippingFee: v.number(),
      freeShippingThreshold: v.number(),
      maintenanceMode: v.boolean(),
      bannerMessage: v.optional(v.string()),
      
      // Hero Section
      heroHeadline: v.optional(v.string()),
      heroDescription: v.optional(v.string()),
      
      // Contact Information
      address: v.optional(v.string()),
      
      // Social Media
      facebookUrl: v.optional(v.string()),
      twitterUrl: v.optional(v.string()),
      instagramUrl: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      
      // Featured Brands
      featuredBrands: v.optional(v.array(v.string())),
      quickActions: v.optional(
        v.array(
          v.object({
            title: v.string(),
            description: v.string(),
            href: v.string(),
            icon: v.string(),
            accent: v.string(),
          })
        )
      ),
      healthConcerns: v.optional(
        v.array(
          v.object({
            title: v.string(),
            query: v.string(),
            icon: v.string(),
            color: v.string(),
          })
        )
      ),
      featureCards: v.optional(
        v.array(
          v.object({
            title: v.string(),
            description: v.string(),
            href: v.string(),
            theme: v.string(),
          })
        )
      ),
    }),

    auditLogs: defineTable({
      action: v.string(),
      entityId: v.optional(v.string()),
      entityType: v.string(),
      performedBy: v.string(),
      details: v.optional(v.string()),
      timestamp: v.number(),
    })
      .index("by_timestamp", ["timestamp"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;