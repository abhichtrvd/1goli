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
      searchText: v.optional(v.string()), // Added for comprehensive search

      role: v.optional(roleValidator), // role of the user. do not remove

      // Email Verification
      emailVerified: v.optional(v.boolean()),

      // User Suspension
      suspended: v.optional(v.boolean()),
      suspensionReason: v.optional(v.string()),
      suspendedAt: v.optional(v.number()),
      suspendedBy: v.optional(v.string()),

      // Password Reset
      resetToken: v.optional(v.string()),
      resetTokenExpiry: v.optional(v.number()),

      // User Tags/Segments
      tags: v.optional(v.array(v.string())),

      // Last Activity
      lastActiveAt: v.optional(v.number()),
    })
      .index("email", ["email"])
      .index("phone", ["phone"])
      .index("by_role", ["role"])
      .index("by_suspended", ["suspended"])
      .index("by_reset_token", ["resetToken"])
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["role"],
      })
      .searchIndex("search_all", {
        searchField: "searchText",
        filterFields: ["role", "suspended"],
      }),

    products: defineTable({
      name: v.string(),
      description: v.string(),
      brand: v.optional(v.string()),
      sku: v.optional(v.string()), // Added SKU field
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

      // Inventory Alerts
      reorderPoint: v.optional(v.number()), // Trigger reorder when stock reaches this level
      minStock: v.optional(v.number()), // Minimum stock threshold for warnings

      // Price Scheduling
      scheduledPrices: v.optional(v.array(v.object({
        price: v.number(),
        startDate: v.number(), // timestamp
        endDate: v.optional(v.number()), // timestamp, optional for permanent changes
        isActive: v.boolean(),
      }))),

      // Discount field for batch operations
      discount: v.optional(v.number()), // Percentage discount
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
      .index("by_sku", ["sku"]) // Added SKU index
      .index("by_price", ["basePrice"])
      .index("by_name", ["name"])
      .index("by_rating", ["averageRating"])
      .index("by_rating_count", ["ratingCount"])
      .index("by_category", ["category"])
      .index("by_stock", ["stock"]), // Added for low stock filtering

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
      externalId: v.optional(v.string()), // Added for imports
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
      searchText: v.optional(v.string()), // Added for comprehensive search
      statusHistory: v.optional(
        v.array(
          v.object({
            status: v.string(),
            timestamp: v.number(),
            note: v.optional(v.string()),
          })
        )
      ),
      // Refund management
      refundStatus: v.optional(v.union(
        v.literal("none"),
        v.literal("requested"),
        v.literal("approved"),
        v.literal("processed"),
        v.literal("rejected")
      )),
      refundAmount: v.optional(v.number()),
      refundReason: v.optional(v.string()),
      refundRequestedAt: v.optional(v.number()),
      refundProcessedAt: v.optional(v.number()),
      refundId: v.optional(v.string()),
      // Shipment tracking
      trackingNumber: v.optional(v.string()),
      trackingUrl: v.optional(v.string()),
      carrier: v.optional(v.string()),
      shippedAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
      estimatedDelivery: v.optional(v.number()),
      // Return/Exchange management
      returnStatus: v.optional(v.union(
        v.literal("none"),
        v.literal("requested"),
        v.literal("approved"),
        v.literal("received"),
        v.literal("processed"),
        v.literal("rejected")
      )),
      returnReason: v.optional(v.string()),
      returnRequestedAt: v.optional(v.number()),
      exchangeRequested: v.optional(v.boolean()),
      // Invoice
      invoiceNumber: v.optional(v.string()),
      invoiceGeneratedAt: v.optional(v.number()),
      // Soft delete
      isDeleted: v.optional(v.boolean()),
      deletedAt: v.optional(v.number()),
      deletedBy: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_external_id", ["externalId"])
      .searchIndex("search_shipping", {
        searchField: "shippingAddress",
      })
      .searchIndex("search_all", {
        searchField: "searchText",
        filterFields: ["status"],
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
      // Spam Detection
      suspiciousScore: v.optional(v.number()), // 0-100, higher = more suspicious
      spamFlags: v.optional(v.array(v.string())), // e.g., ["repeated_words", "excessive_caps", "contains_links"]
      // Sentiment Analysis
      sentiment: v.optional(v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative"))),
      // Duplicate Detection
      isDuplicate: v.optional(v.boolean()),
      duplicateOf: v.optional(v.id("reviews")),
      similarityScore: v.optional(v.number()), // 0-100, similarity to other reviews from same user
    })
      .index("by_product", ["productId"])
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_product_status", ["productId", "status"])
      .index("by_sentiment", ["sentiment"])
      .index("by_verified", ["verifiedPurchase"])
      .index("by_suspicious", ["suspiciousScore"])
      .index("by_duplicate", ["isDuplicate"]),

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
      imageStorageId: v.optional(v.id("_storage")), // Made optional for admin-created prescriptions
      notes: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("processed"),
        v.literal("rejected")
      ),
      pharmacistNotes: v.optional(v.string()),
      searchText: v.optional(v.string()), // Added for comprehensive search
      // Medicine tracking
      medicines: v.optional(v.array(v.object({
        name: v.string(),
        dosage: v.string(),
        frequency: v.string(),
        duration: v.optional(v.string()), // e.g., "7 days", "2 weeks", "1 month"
      }))),
      // Doctor information
      doctorId: v.optional(v.id("consultationDoctors")),
      doctorName: v.optional(v.string()), // Cached for display
      diagnosis: v.optional(v.string()), // Medical diagnosis
      expiryDate: v.optional(v.number()), // Prescription expiry date in milliseconds
      // Soft delete
      isDeleted: v.optional(v.boolean()),
      deletedAt: v.optional(v.number()),
      deletedBy: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_deleted", ["isDeleted"])
      .index("by_doctor", ["doctorId"])
      .index("by_expiry", ["expiryDate"])
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
      imageStorageId: v.optional(v.id("_storage")),
    })
      .index("by_specialization", ["specialization"])
      .index("by_city", ["clinicCity"])
      .index("by_experience", ["experienceYears"])
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

      // Payment Settings
      paymentGateway: v.optional(v.string()), // "razorpay", "stripe", "paypal", etc.
      razorpayKeyId: v.optional(v.string()),
      razorpayKeySecret: v.optional(v.string()),
      stripePublishableKey: v.optional(v.string()),
      stripeSecretKey: v.optional(v.string()),
      enableCOD: v.optional(v.boolean()),
      enableUPI: v.optional(v.boolean()),
      enableCard: v.optional(v.boolean()),

      // Tax Settings
      taxEnabled: v.optional(v.boolean()),
      taxName: v.optional(v.string()), // e.g., "GST", "VAT", "Sales Tax"
      taxRate: v.optional(v.number()), // Percentage
      taxNumber: v.optional(v.string()), // Tax registration number

      // Currency Settings
      currency: v.optional(v.string()), // "INR", "USD", "EUR", etc.
      currencySymbol: v.optional(v.string()), // "₹", "$", "€", etc.

      // Logo/Branding
      logoUrl: v.optional(v.string()),
      logoStorageId: v.optional(v.id("_storage")),

      // Email Server Configuration
      smtpHost: v.optional(v.string()),
      smtpPort: v.optional(v.number()),
      smtpUsername: v.optional(v.string()),
      smtpPassword: v.optional(v.string()),
      smtpFromAddress: v.optional(v.string()),
      smtpFromName: v.optional(v.string()),

      // API Key Management
      apiKeys: v.optional(v.array(v.object({
        label: v.string(),
        key: v.string(),
        createdAt: v.number(),
      }))),

      // Webhook Configuration
      webhooks: v.optional(v.object({
        orderCreated: v.optional(v.string()),
        orderShipped: v.optional(v.string()),
        orderDelivered: v.optional(v.string()),
        userRegistered: v.optional(v.string()),
      })),

      // Security Settings
      enable2FA: v.optional(v.boolean()),
      ipWhitelist: v.optional(v.array(v.string())),
      sessionTimeout: v.optional(v.number()), // in minutes
      passwordChangeInterval: v.optional(v.number()), // in days
    }),

    productStockHistory: defineTable({
      productId: v.id("products"),
      productName: v.string(), // Cached for display
      changeType: v.union(
        v.literal("manual_adjustment"),
        v.literal("sale"),
        v.literal("restock"),
        v.literal("return"),
        v.literal("damage"),
        v.literal("initial")
      ),
      previousStock: v.number(),
      newStock: v.number(),
      quantity: v.number(), // Amount changed (positive or negative)
      reason: v.optional(v.string()),
      performedBy: v.string(), // User ID who made the change
      timestamp: v.number(),
      orderId: v.optional(v.id("orders")), // Link to order if stock changed due to sale/return
    })
      .index("by_product", ["productId"])
      .index("by_timestamp", ["timestamp"])
      .index("by_product_timestamp", ["productId", "timestamp"])
      .index("by_performed_by", ["performedBy"]),


    auditLogs: defineTable({
      action: v.string(),
      entityId: v.optional(v.string()),
      entityType: v.string(),
      performedBy: v.string(),
      performedByName: v.optional(v.string()), // Cached performer name for display
      details: v.optional(v.string()),
      timestamp: v.number(),
      metadata: v.optional(v.object({
        before: v.optional(v.any()), // State before the action
        after: v.optional(v.any()), // State after the action
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        changes: v.optional(v.array(v.object({
          field: v.string(),
          oldValue: v.optional(v.any()),
          newValue: v.optional(v.any()),
        }))),
        reversible: v.optional(v.boolean()), // Can this action be undone
        reversed: v.optional(v.boolean()), // Has this action been reversed
        reversedBy: v.optional(v.string()),
        reversedAt: v.optional(v.number()),
      })),
      isCritical: v.optional(v.boolean()), // Flag for critical actions
      searchText: v.optional(v.string()), // Combined text for search
    })
      .index("by_timestamp", ["timestamp"])
      .index("by_entity", ["entityId"])
      .index("by_entity_type", ["entityType"])
      .index("by_action", ["action"])
      .index("by_performer", ["performedBy"])
      .index("by_critical", ["isCritical"])
      .searchIndex("search_all", {
        searchField: "searchText",
        filterFields: ["action", "entityType", "isCritical"],
      }),

    userActivity: defineTable({
      userId: v.id("users"),
      action: v.string(), // login, logout, order_placed, profile_updated, password_changed, etc.
      details: v.optional(v.string()),
      metadata: v.optional(v.object({
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        orderId: v.optional(v.string()),
      })),
      timestamp: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_timestamp", ["timestamp"])
      .index("by_user_timestamp", ["userId", "timestamp"])
      .index("by_action", ["action"]),

    loginHistory: defineTable({
      userId: v.id("users"),
      timestamp: v.number(),
      ipAddress: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      success: v.boolean(),
      failureReason: v.optional(v.string()), // invalid_password, account_suspended, etc.
      location: v.optional(v.string()), // Geo location if available
    })
      .index("by_user", ["userId"])
      .index("by_timestamp", ["timestamp"])
      .index("by_user_timestamp", ["userId", "timestamp"])
      .index("by_success", ["success"]),

    dashboardGoals: defineTable({
      goalType: v.union(
        v.literal("revenue"),
        v.literal("orders"),
        v.literal("users"),
        v.literal("conversion_rate")
      ),
      targetValue: v.number(),
      period: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly")
      ),
      startDate: v.number(), // timestamp
      endDate: v.optional(v.number()), // timestamp, optional for recurring goals
      isActive: v.boolean(),
      createdBy: v.string(),
    })
      .index("by_type", ["goalType"])
      .index("by_active", ["isActive"])
      .index("by_period", ["period"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;