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
      roleId: v.optional(v.id("roles")), // Link to roles table for RBAC

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

    // Role-Based Access Control (RBAC)
    roles: defineTable({
      name: v.string(), // e.g., "Super Admin", "Manager", "Staff"
      description: v.string(),
      permissions: v.array(v.string()), // array of permission IDs or keys
      isSystem: v.boolean(), // System roles cannot be deleted
      createdBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_name", ["name"])
      .index("by_system", ["isSystem"]),

    permissions: defineTable({
      resource: v.string(), // e.g., "users", "orders", "products"
      action: v.string(), // e.g., "create", "read", "update", "delete"
      description: v.string(),
      category: v.string(), // e.g., "Users", "Orders", "Products"
      key: v.string(), // unique key like "users.create"
    })
      .index("by_resource", ["resource"])
      .index("by_category", ["category"])
      .index("by_key", ["key"]),

    // Team Member Invitations
    teamInvitations: defineTable({
      email: v.string(),
      roleId: v.id("roles"),
      roleName: v.string(), // Cached for display
      invitedBy: v.string(),
      invitedAt: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("expired"),
        v.literal("cancelled")
      ),
      expiresAt: v.number(),
      acceptedAt: v.optional(v.number()),
      token: v.string(), // Invitation token
    })
      .index("by_email", ["email"])
      .index("by_status", ["status"])
      .index("by_token", ["token"]),

    // Backup Records
    backups: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      size: v.number(), // Size in bytes
      tablesIncluded: v.array(v.string()), // List of table names
      recordCount: v.number(), // Total number of records
      createdBy: v.string(),
      createdAt: v.number(),
      storageId: v.optional(v.id("_storage")), // Reference to stored backup file
      type: v.union(v.literal("manual"), v.literal("scheduled")),
      status: v.union(
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("failed")
      ),
    })
      .index("by_created_at", ["createdAt"])
      .index("by_status", ["status"])
      .index("by_type", ["type"]),

    // Custom Report Builder
    reports: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      type: v.union(
        v.literal("sales"),
        v.literal("inventory"),
        v.literal("user"),
        v.literal("order"),
        v.literal("doctor"),
        v.literal("prescription")
      ),
      dataSource: v.string(), // Table name
      filters: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.union(
          v.literal("equals"),
          v.literal("not_equals"),
          v.literal("contains"),
          v.literal("not_contains"),
          v.literal("gt"),
          v.literal("gte"),
          v.literal("lt"),
          v.literal("lte"),
          v.literal("between"),
          v.literal("in"),
          v.literal("not_in")
        ),
        value: v.any(),
        value2: v.optional(v.any()), // For "between" operator
      }))),
      groupBy: v.optional(v.string()), // Field to group by
      aggregations: v.optional(v.array(v.object({
        field: v.string(),
        function: v.union(
          v.literal("sum"),
          v.literal("avg"),
          v.literal("count"),
          v.literal("min"),
          v.literal("max")
        ),
        label: v.optional(v.string()),
      }))),
      columns: v.array(v.string()), // Array of fields to display
      sortBy: v.optional(v.string()),
      sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
      chartType: v.union(
        v.literal("line"),
        v.literal("bar"),
        v.literal("pie"),
        v.literal("table")
      ),
      createdBy: v.string(),
      isPublic: v.boolean(), // Whether other admins can view
      lastRun: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_type", ["type"])
      .index("by_creator", ["createdBy"])
      .index("by_public", ["isPublic"])
      .index("by_last_run", ["lastRun"]),

    // Report Schedules
    reportSchedules: defineTable({
      reportId: v.id("reports"),
      reportName: v.string(), // Cached for display
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      ),
      dayOfWeek: v.optional(v.number()), // 0-6 for weekly (0=Sunday)
      dayOfMonth: v.optional(v.number()), // 1-31 for monthly
      timeOfDay: v.string(), // HH:MM format (24-hour)
      recipients: v.array(v.string()), // Email addresses
      exportFormat: v.union(
        v.literal("csv"),
        v.literal("excel"),
        v.literal("pdf"),
        v.literal("json")
      ),
      enabled: v.boolean(),
      lastRun: v.optional(v.number()),
      nextRun: v.optional(v.number()),
      lastStatus: v.optional(v.union(
        v.literal("success"),
        v.literal("failed"),
        v.literal("pending")
      )),
      lastError: v.optional(v.string()),
      createdBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_report", ["reportId"])
      .index("by_enabled", ["enabled"])
      .index("by_next_run", ["nextRun"])
      .index("by_creator", ["createdBy"]),

    // Report Execution History
    reportExecutions: defineTable({
      reportId: v.id("reports"),
      reportName: v.string(),
      scheduleId: v.optional(v.id("reportSchedules")), // If executed by schedule
      executedBy: v.string(), // User ID
      status: v.union(
        v.literal("success"),
        v.literal("failed"),
        v.literal("running")
      ),
      recordCount: v.optional(v.number()),
      executionTime: v.optional(v.number()), // Duration in ms
      exportFormat: v.optional(v.string()),
      storageId: v.optional(v.id("_storage")), // If exported to storage
      error: v.optional(v.string()),
      executedAt: v.number(),
    })
      .index("by_report", ["reportId"])
      .index("by_schedule", ["scheduleId"])
      .index("by_status", ["status"])
      .index("by_executed_at", ["executedAt"]),

    // Workflow Automation
    workflows: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      trigger: v.string(), // Event name like "order.created", "user.registered", etc.
      triggerConditions: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.string(), // equals, not_equals, gt, gte, lt, lte, contains, not_contains, in, not_in
        value: v.any(),
        logicalOperator: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
      }))),
      actions: v.array(v.object({
        type: v.union(
          v.literal("send_email"),
          v.literal("send_sms"),
          v.literal("update_field"),
          v.literal("create_task"),
          v.literal("call_webhook"),
          v.literal("add_tag"),
          v.literal("suspend_user"),
          v.literal("send_notification")
        ),
        config: v.any(), // Action-specific configuration (template, recipient, field, value, etc.)
        order: v.optional(v.number()), // Order of execution
      })),
      enabled: v.boolean(),
      priority: v.optional(v.number()), // Higher priority workflows execute first
      createdBy: v.string(),
      lastRun: v.optional(v.number()),
      runCount: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_enabled", ["enabled"])
      .index("by_trigger", ["trigger"])
      .index("by_priority", ["priority"]),

    // Workflow Execution Logs
    workflowExecutions: defineTable({
      workflowId: v.id("workflows"),
      workflowName: v.string(), // Cached for display
      triggeredBy: v.string(), // Event identifier (e.g., "order:12345")
      triggerEvent: v.string(), // Event name that triggered the workflow
      status: v.union(v.literal("success"), v.literal("failed"), v.literal("partial")),
      executedActions: v.array(v.object({
        actionType: v.string(),
        status: v.union(v.literal("success"), v.literal("failed"), v.literal("skipped")),
        error: v.optional(v.string()),
        output: v.optional(v.any()),
      })),
      logs: v.optional(v.array(v.string())), // Detailed execution logs
      error: v.optional(v.string()), // Overall error message if failed
      executedAt: v.number(),
      duration: v.optional(v.number()), // Execution time in ms
    })
      .index("by_workflow", ["workflowId"])
      .index("by_status", ["status"])
      .index("by_executed_at", ["executedAt"])
      .index("by_trigger_event", ["triggerEvent"]),

    // Business Rules Engine
    rules: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      ruleType: v.union(
        v.literal("validation"), // Validate before processing
        v.literal("pricing"), // Dynamic pricing rules
        v.literal("routing"), // Order routing rules
        v.literal("automation") // Auto-apply actions
      ),
      conditions: v.array(v.object({
        field: v.string(),
        operator: v.string(), // equals, not_equals, gt, gte, lt, lte, contains, not_contains, in, not_in, between
        value: v.any(),
        value2: v.optional(v.any()), // For "between" operator
        logicalOperator: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
      })),
      actions: v.array(v.object({
        type: v.string(), // apply_discount, block_order, route_to_warehouse, assign_user, etc.
        config: v.any(), // Action-specific configuration
      })),
      priority: v.number(), // Higher priority rules execute first
      enabled: v.boolean(),
      validFrom: v.optional(v.number()),
      validUntil: v.optional(v.number()),
      executionCount: v.optional(v.number()),
      lastExecuted: v.optional(v.number()),
      createdBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_type", ["ruleType"])
      .index("by_enabled", ["enabled"])
      .index("by_priority", ["priority"])
      .index("by_type_enabled", ["ruleType", "enabled"]),

    // Integration Marketplace
    integrations: defineTable({
      name: v.string(),
      description: v.string(),
      category: v.union(
        v.literal("payment"),
        v.literal("shipping"),
        v.literal("email"),
        v.literal("sms"),
        v.literal("analytics"),
        v.literal("crm"),
        v.literal("accounting")
      ),
      provider: v.string(), // stripe, razorpay, paypal, fedex, ups, dhl, sendgrid, twilio, google_analytics, salesforce, quickbooks, etc.
      logoUrl: v.optional(v.string()),
      websiteUrl: v.optional(v.string()),
      status: v.union(
        v.literal("available"),
        v.literal("installed"),
        v.literal("active"),
        v.literal("inactive")
      ),
      config: v.optional(v.object({
        apiKey: v.optional(v.string()),
        apiSecret: v.optional(v.string()),
        webhookUrl: v.optional(v.string()),
        settings: v.optional(v.any()),
      })),
      installedAt: v.optional(v.number()),
      installedBy: v.optional(v.string()),
      version: v.optional(v.string()),
      supportedFeatures: v.optional(v.array(v.string())),
      isPopular: v.optional(v.boolean()), // Popular badge
      usageCount: v.optional(v.number()), // Track usage
      lastUsedAt: v.optional(v.number()),
    })
      .index("by_category", ["category"])
      .index("by_status", ["status"])
      .index("by_provider", ["provider"])
      .index("by_popular", ["isPopular"]),

    // Communication Features
    campaigns: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      subject: v.optional(v.string()),
      content: v.string(),
      previewText: v.optional(v.string()),
      type: v.union(v.literal("email"), v.literal("sms"), v.literal("push")),
      templateId: v.optional(v.id("notificationTemplates")),
      segment: v.union(
        v.literal("all"),
        v.literal("vip"),
        v.literal("new_users"),
        v.literal("inactive"),
        v.literal("custom")
      ),
      customRecipients: v.optional(v.array(v.string())),
      audienceFilter: v.optional(v.object({
        tags: v.optional(v.array(v.string())),
        role: v.optional(v.string()),
        minOrders: v.optional(v.number()),
        lastActiveDate: v.optional(v.number()),
      })),
      status: v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("sending"),
        v.literal("sent"),
        v.literal("completed"),
        v.literal("failed")
      ),
      scheduledAt: v.optional(v.number()),
      sentAt: v.optional(v.number()),
      deliveryRate: v.optional(v.number()),
      openRate: v.optional(v.number()),
      clickRate: v.optional(v.number()),
      totalRecipients: v.optional(v.number()),
      successCount: v.optional(v.number()),
      failedCount: v.optional(v.number()),
      abTestEnabled: v.optional(v.boolean()),
      abTestVariantB: v.optional(v.object({
        subject: v.optional(v.string()),
        content: v.string(),
        previewText: v.optional(v.string()),
      })),
      abTestSplitPercent: v.optional(v.number()),
      recipientCount: v.optional(v.number()),
      deliveredCount: v.optional(v.number()),
      openedCount: v.optional(v.number()),
      clickedCount: v.optional(v.number()),
      createdBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_status", ["status"])
      .index("by_type", ["type"])
      .index("by_created_at", ["createdAt"])
      .index("by_creator", ["createdBy"]),

    campaignDeliveries: defineTable({
      campaignId: v.id("campaigns"),
      userId: v.id("users"),
      status: v.union(
        v.literal("pending"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("failed"),
        v.literal("bounced")
      ),
      sentAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
      openedAt: v.optional(v.number()),
      clickedAt: v.optional(v.number()),
      error: v.optional(v.string()),
      variant: v.optional(v.union(v.literal("A"), v.literal("B"))), // For A/B testing
    })
      .index("by_campaign", ["campaignId"])
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_campaign_user", ["campaignId", "userId"]),

    notificationTemplates: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      category: v.union(
        v.literal("order"),
        v.literal("user"),
        v.literal("product"),
        v.literal("system")
      ),
      channels: v.array(v.union(v.literal("email"), v.literal("sms"), v.literal("push"))),
      subject: v.optional(v.string()),
      content: v.string(),
      variables: v.optional(v.array(v.string())), // e.g., ["name", "order_id", "amount"]
      isActive: v.boolean(),
      version: v.optional(v.number()),
      parentTemplateId: v.optional(v.id("notificationTemplates")), // For version history
      createdBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_category", ["category"])
      .index("by_active", ["isActive"])
      .index("by_parent", ["parentTemplateId"]),

    messages: defineTable({
      conversationId: v.string(), // Unique ID per conversation
      userId: v.id("users"),
      senderId: v.optional(v.string()), // Admin ID or system
      senderType: v.union(v.literal("admin"), v.literal("user"), v.literal("system")),
      content: v.string(),
      attachments: v.optional(v.array(v.object({
        name: v.string(),
        url: v.string(),
        storageId: v.optional(v.id("_storage")),
        type: v.string(), // mime type
        size: v.number(),
      }))),
      isRead: v.boolean(),
      readAt: v.optional(v.number()),
      sentAt: v.number(),
    })
      .index("by_conversation", ["conversationId"])
      .index("by_user", ["userId"])
      .index("by_sent_at", ["sentAt"])
      .index("by_conversation_sent", ["conversationId", "sentAt"]),

    conversations: defineTable({
      userId: v.id("users"),
      subject: v.optional(v.string()),
      status: v.union(
        v.literal("open"),
        v.literal("closed"),
        v.literal("archived")
      ),
      priority: v.optional(v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )),
      lastMessageAt: v.number(),
      unreadCount: v.optional(v.number()),
      assignedTo: v.optional(v.string()), // Admin ID
      tags: v.optional(v.array(v.string())),
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_assigned", ["assignedTo"])
      .index("by_priority", ["priority"])
      .index("by_last_message", ["lastMessageAt"]),

    activityFeed: defineTable({
      entityType: v.union(
        v.literal("order"),
        v.literal("user"),
        v.literal("product"),
        v.literal("prescription"),
        v.literal("review"),
        v.literal("campaign"),
        v.literal("system")
      ),
      entityId: v.optional(v.string()),
      action: v.string(), // created, updated, deleted, status_changed, etc.
      description: v.string(),
      performedBy: v.string(), // User ID or "system"
      performedByName: v.optional(v.string()), // Cached for display
      metadata: v.optional(v.any()), // Additional context
      timestamp: v.number(),
    })
      .index("by_entity_type", ["entityType"])
      .index("by_entity_id", ["entityId"])
      .index("by_performer", ["performedBy"])
      .index("by_timestamp", ["timestamp"])
      .index("by_entity_type_timestamp", ["entityType", "timestamp"]),

    // Analytics Features
    pageInteractions: defineTable({
      userId: v.optional(v.id("users")),
      sessionId: v.string(),
      page: v.string(),
      element: v.optional(v.string()),
      action: v.union(v.literal("click"), v.literal("hover"), v.literal("scroll")),
      xPosition: v.optional(v.number()),
      yPosition: v.optional(v.number()),
      timestamp: v.number(),
      device: v.optional(v.string()),
      userAgent: v.optional(v.string()),
    })
      .index("by_page", ["page"])
      .index("by_action", ["action"])
      .index("by_timestamp", ["timestamp"])
      .index("by_session", ["sessionId"])
      .index("by_page_action", ["page", "action"]),

    clickEvents: defineTable({
      userId: v.optional(v.id("users")),
      sessionId: v.string(),
      page: v.string(),
      elementId: v.optional(v.string()),
      elementClass: v.optional(v.string()),
      x: v.number(),
      y: v.number(),
      timestamp: v.number(),
      userAgent: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
    })
      .index("by_page", ["page"])
      .index("by_timestamp", ["timestamp"])
      .index("by_session", ["sessionId"]),

    scrollEvents: defineTable({
      userId: v.optional(v.id("users")),
      sessionId: v.string(),
      page: v.string(),
      maxDepth: v.number(), // % of page scrolled
      timestamp: v.number(),
    })
      .index("by_page", ["page"])
      .index("by_timestamp", ["timestamp"]),

    abTests: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      type: v.union(
        v.literal("pricing"),
        v.literal("layout"),
        v.literal("messaging"),
        v.literal("feature")
      ),
      status: v.union(
        v.literal("draft"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("archived")
      ),
      variantA: v.object({
        name: v.string(),
        config: v.any(),
      }),
      variantB: v.object({
        name: v.string(),
        config: v.any(),
      }),
      trafficSplit: v.number(), // % for variant A (0-100)
      goalMetric: v.union(
        v.literal("conversion"),
        v.literal("revenue"),
        v.literal("engagement"),
        v.literal("retention")
      ),
      startDate: v.number(),
      endDate: v.optional(v.number()),
      winner: v.optional(v.union(v.literal("A"), v.literal("B"), v.literal("none"))),
      createdBy: v.string(),
      createdAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_type", ["type"]),

    abTestAssignments: defineTable({
      testId: v.id("abTests"),
      userId: v.id("users"),
      variant: v.union(v.literal("A"), v.literal("B")),
      assignedAt: v.number(),
    })
      .index("by_test", ["testId"])
      .index("by_user", ["userId"])
      .index("by_test_user", ["testId", "userId"]),

    abTestConversions: defineTable({
      testId: v.id("abTests"),
      userId: v.id("users"),
      variant: v.union(v.literal("A"), v.literal("B")),
      value: v.optional(v.number()), // e.g., revenue amount
      convertedAt: v.number(),
    })
      .index("by_test", ["testId"])
      .index("by_variant", ["testId", "variant"]),

    cohorts: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      definitionType: v.union(
        v.literal("signup_date"),
        v.literal("first_purchase"),
        v.literal("location"),
        v.literal("custom")
      ),
      startDate: v.number(),
      endDate: v.number(),
      userIds: v.optional(v.array(v.id("users"))),
      userCount: v.optional(v.number()),
      createdBy: v.string(),
      createdAt: v.number(),
    })
      .index("by_definition", ["definitionType"])
      .index("by_created_at", ["createdAt"]),

    funnels: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      steps: v.array(v.object({
        name: v.string(),
        eventType: v.string(), // e.g., "page_view", "add_to_cart", "checkout"
        order: v.number(),
      })),
      isActive: v.boolean(),
      createdBy: v.string(),
      createdAt: v.number(),
    })
      .index("by_active", ["isActive"]),

    funnelEvents: defineTable({
      funnelId: v.id("funnels"),
      userId: v.optional(v.id("users")),
      sessionId: v.string(),
      stepIndex: v.number(),
      stepName: v.string(),
      timestamp: v.number(),
    })
      .index("by_funnel", ["funnelId"])
      .index("by_session", ["sessionId"])
      .index("by_funnel_step", ["funnelId", "stepIndex"]),

    customDashboards: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      layout: v.array(v.object({
        widgetId: v.string(),
        type: v.union(
          v.literal("metric_card"),
          v.literal("line_chart"),
          v.literal("bar_chart"),
          v.literal("pie_chart"),
          v.literal("table"),
          v.literal("heatmap")
        ),
        dataSource: v.string(), // table or query name
        config: v.any(), // Widget-specific configuration
        position: v.object({
          x: v.number(),
          y: v.number(),
          w: v.number(),
          h: v.number(),
        }),
      })),
      isPublic: v.boolean(),
      createdBy: v.string(),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_creator", ["createdBy"])
      .index("by_public", ["isPublic"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;