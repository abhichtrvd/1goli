import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";
import { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

export const createOrder = mutation({
  args: {
    shippingAddress: v.string(),
    total: v.number(),
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const orderId = await ctx.db.insert("orders", {
      userId,
      items: args.items,
      total: args.total,
      status: "pending",
      shippingAddress: args.shippingAddress,
      statusHistory: [
        {
          status: "pending",
          timestamp: Date.now(),
          note: "Order placed",
        },
      ],
    });

    // Clear cart after order
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
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const history = order.statusHistory || [];
    history.push({
      status: args.status,
      timestamp: Date.now(),
      note: args.note
    });

    await ctx.db.patch(args.orderId, { 
      status: args.status,
      statusHistory: history
    });
  },
});