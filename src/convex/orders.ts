import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

export const createOrder = mutation({
  args: {
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
    paymentMethod: v.string(),
    total: v.number(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        potency: v.string(),
        form: v.string(),
        packingSize: v.optional(v.string()),
        quantity: v.number(),
        price: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check and decrement stock
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error(`Product not found: ${item.name}`);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${product.stock}`);
      }
      await ctx.db.patch(item.productId, {
        stock: product.stock - item.quantity,
      });
    }

    const orderId = await ctx.db.insert("orders", {
      userId,
      items: args.items,
      total: args.total,
      status: "pending",
      shippingAddress: args.shippingAddress,
      shippingDetails: args.shippingDetails,
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending", // Always pending initially
      paymentId: undefined,
      statusHistory: [
        {
          status: "pending",
          timestamp: Date.now(),
          note: "Order placed",
        },
      ],
    });

    // Clear cart after order is created
    // Note: For real payments, we might want to clear cart ONLY after payment success
    // But for COD it's immediate. For now, we clear it here to reserve items.
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }

    return orderId;
  },
});

export const confirmOrderPayment = mutation({
  args: {
    orderId: v.id("orders"),
    paymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.orderId, {
      paymentStatus: "paid",
      paymentId: args.paymentId,
      status: "processing", // Move to processing once paid
      statusHistory: [
        ...(order.statusHistory || []),
        {
          status: "processing",
          timestamp: Date.now(),
          note: `Payment confirmed: ${args.paymentId}`,
        },
      ],
    });
  },
});

export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) return null;

    return order;
  },
});

export const getOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getAllOrders = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const orders = await ctx.db.query("orders").order("desc").collect();

    // Enrich orders with user details
    const ordersWithUser = await Promise.all(
      orders.map(async (order) => {
        // userId is stored as string in schema but is an ID
        const user = await ctx.db.get(order.userId as Id<"users">);
        return {
          ...order,
          userName: user?.name || "Unknown User",
          userContact: user?.email || user?.phone || "No contact info",
        };
      })
    );

    return ordersWithUser;
  },
});

export const getPaginatedOrders = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    let result;
    if (args.search) {
        result = await ctx.db
            .query("orders")
            .withSearchIndex("search_shipping", (q) => q.search("shippingAddress", args.search!))
            .paginate(args.paginationOpts);
    } else {
        result = await ctx.db
            .query("orders")
            .order("desc")
            .paginate(args.paginationOpts);
    }

    const pageWithUsers = await Promise.all(
      result.page.map(async (order) => {
        const user = await ctx.db.get(order.userId as Id<"users">);
        return {
          ...order,
          userName: user?.name || "Unknown User",
          userContact: user?.email || user?.phone || "No contact info",
        };
      })
    );

    return { ...result, page: pageWithUsers };
  },
});

export const updateOrderStatus = mutation({
  args: { 
    orderId: v.id("orders"), 
    status: v.string(),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // Handle stock adjustments based on status change
    if (args.status === "cancelled" && order.status !== "cancelled") {
      // Restock items when cancelling
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          await ctx.db.patch(item.productId, { stock: product.stock + item.quantity });
        }
      }
    } else if (order.status === "cancelled" && args.status !== "cancelled") {
      // Deduct stock when un-cancelling (re-activating order)
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId);
        if (!product) throw new Error(`Product ${item.name} not found`);
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name} to restore order. Available: ${product.stock}`);
        }
        await ctx.db.patch(item.productId, { stock: product.stock - item.quantity });
      }
    }

    const history = [...(order.statusHistory || [])];
    history.push({
      status: args.status,
      timestamp: Date.now(),
      note: args.note
    });

    await ctx.db.patch(args.orderId, { 
      status: args.status,
      statusHistory: history
    });

    await ctx.db.insert("auditLogs", {
      action: "update_order_status",
      entityId: args.orderId,
      entityType: "order",
      performedBy: userId || "admin",
      details: `Updated order status to ${args.status}`,
      timestamp: Date.now(),
    });
  },
});

export const bulkUpdateOrderStatus = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);

    for (const orderId of args.orderIds) {
      const order = await ctx.db.get(orderId);
      if (order) {
        // Handle stock adjustments for bulk update
        if (args.status === "cancelled" && order.status !== "cancelled") {
          // Restock items
          for (const item of order.items) {
            const product = await ctx.db.get(item.productId);
            if (product) {
              await ctx.db.patch(item.productId, { stock: product.stock + item.quantity });
            }
          }
        } else if (order.status === "cancelled" && args.status !== "cancelled") {
          // Deduct stock (re-activate)
          for (const item of order.items) {
            const product = await ctx.db.get(item.productId);
            if (!product) throw new Error(`Product ${item.name} (in Order ${orderId}) not found`);
            if (product.stock < item.quantity) {
              throw new Error(`Insufficient stock for ${item.name} to restore Order ${orderId}`);
            }
            await ctx.db.patch(item.productId, { stock: product.stock - item.quantity });
          }
        }

        const history = [...(order.statusHistory || [])];
        history.push({
          status: args.status,
          timestamp: Date.now(),
          note: args.note || "Bulk update"
        });

        await ctx.db.patch(orderId, {
          status: args.status,
          statusHistory: history
        });
      }
    }

    await ctx.db.insert("auditLogs", {
      action: "bulk_update_order_status",
      entityType: "order",
      performedBy: userId || "admin",
      details: `Updated ${args.orderIds.length} orders to ${args.status}`,
      timestamp: Date.now(),
    });
  },
});

export const updateOrderNote = mutation({
  args: {
    orderId: v.id("orders"),
    timestamp: v.number(),
    newNote: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const history = [...(order.statusHistory || [])];
    const index = history.findIndex((h: any) => h.timestamp === args.timestamp);

    if (index === -1) throw new Error("History entry not found");

    history[index] = { ...history[index], note: args.newNote };

    await ctx.db.patch(args.orderId, {
      statusHistory: history,
    });
  },
});

export const deleteOrderNote = mutation({
  args: {
    orderId: v.id("orders"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const history = [...(order.statusHistory || [])];
    const index = history.findIndex((h: any) => h.timestamp === args.timestamp);

    if (index === -1) throw new Error("History entry not found");

    const entry = { ...history[index] };
    delete entry.note;
    history[index] = entry;

    await ctx.db.patch(args.orderId, {
      statusHistory: history,
    });
  },
});

export const importOrders = mutation({
  args: {
    orders: v.array(
      v.object({
        email: v.string(),
        shippingAddress: v.string(),
        paymentMethod: v.string(),
        status: v.string(),
        total: v.number(),
        items: v.array(
          v.object({
            productName: v.string(),
            sku: v.optional(v.string()),
            quantity: v.number(),
            price: v.number(),
          })
        ),
        date: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const results = { imported: 0, failed: 0, errors: [] as string[] };

    for (const orderData of args.orders) {
      try {
        // 1. Find User by email
        const user = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", orderData.email))
          .first();

        if (!user) {
          throw new Error(`User not found for email: ${orderData.email}`);
        }

        // 2. Validate and build items
        const orderItems = [];
        for (const item of orderData.items) {
          let product;
          
          // Try finding by SKU first if provided
          if (item.sku) {
             product = await ctx.db
              .query("products")
              .withIndex("by_sku", (q) => q.eq("sku", item.sku))
              .first();
          }

          // Fallback to name if no SKU or product not found by SKU
          if (!product) {
            product = await ctx.db
              .query("products")
              .withIndex("by_name", (q) => q.eq("name", item.productName))
              .first();
          }
          
          if (!product) {
             throw new Error(`Product not found: ${item.productName}${item.sku ? ` (SKU: ${item.sku})` : ''}`);
          }
          
          orderItems.push({
            productId: product._id,
            name: product.name,
            potency: product.potencies[0] || "Standard", // Default to first or Standard
            form: product.forms[0] || "Standard",       // Default to first or Standard
            quantity: item.quantity,
            price: item.price,
          });
        }

        // 3. Create Order
        await ctx.db.insert("orders", {
          userId: user._id,
          items: orderItems,
          total: orderData.total,
          status: orderData.status,
          shippingAddress: orderData.shippingAddress,
          paymentMethod: orderData.paymentMethod,
          paymentStatus: ["delivered", "completed", "shipped"].includes(orderData.status) ? "paid" : "pending",
          statusHistory: [
            {
              status: orderData.status,
              timestamp: orderData.date ? new Date(orderData.date).getTime() : Date.now(),
              note: "Imported via Admin",
            },
          ],
        });
        
        results.imported++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row for ${orderData.email}: ${err.message}`);
      }
    }

    // Log the bulk action
    const userId = await getAuthUserId(ctx);
    await ctx.db.insert("auditLogs", {
      action: "import_orders",
      entityType: "order",
      performedBy: userId || "admin",
      details: `Imported ${results.imported} orders, ${results.failed} failed`,
      timestamp: Date.now(),
    });

    return results;
  },
});