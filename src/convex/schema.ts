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
      .searchIndex("search_name", {
        searchField: "name",
      }),

    products: defineTable({
      name: v.string(),
      description: v.string(),
      imageUrl: v.optional(v.union(v.string(), v.null())), // Allow null for deletion
      imageStorageId: v.optional(v.union(v.id("_storage"), v.null())), // Allow null for deletion
      images: v.optional(v.array(v.object({ 
        storageId: v.optional(v.id("_storage")),
        url: v.string() 
      }))), // Gallery images
      videoUrl: v.optional(v.string()), // Video URL (YouTube, Vimeo, etc.)
      videoThumbnail: v.optional(v.string()), // Auto-generated or custom thumbnail
      potencies: v.array(v.string()),
      forms: v.array(v.string()),
      basePrice: v.number(),
      symptomsTags: v.array(v.string()),
      category: v.optional(v.string()), // e.g., "Classical", "Patent", "Personal Care"
      availability: v.optional(v.string()), // "in_stock", "out_of_stock"
    })
      .searchIndex("search_body", {
        searchField: "description",
        filterFields: ["name"], // simplified search
      }),

    cartItems: defineTable({
      userId: v.string(),
      productId: v.id("products"),
      potency: v.string(),
      form: v.string(),
      quantity: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_product_variant", ["userId", "productId", "potency", "form"]),

    orders: defineTable({
      userId: v.string(),
      items: v.array(
        v.object({
          productId: v.id("products"),
          name: v.string(),
          potency: v.string(),
          form: v.string(),
          quantity: v.number(),
          price: v.number(),
        })
      ),
      total: v.number(),
      status: v.string(),
      shippingAddress: v.string(),
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
  },
  {
    schemaValidation: false,
  },
);

export default schema;