import { mutation } from "./_generated/server";

export const addTestOrders = mutation({
  args: {},
  handler: async (ctx) => {
    // Get or create test users and products
    const user = await ctx.db
      .query("users")
      .first();

    if (!user) {
      throw new Error("No users found. Please create a user first.");
    }

    const products = await ctx.db
      .query("products")
      .take(3);

    if (products.length === 0) {
      throw new Error("No products found. Please create products first.");
    }

    // Create test orders
    const testOrders = [
      {
        userId: user._id,
        items: [
          {
            productId: products[0]._id,
            name: products[0].name,
            potency: products[0].potencies[0] || "Standard",
            form: products[0].forms[0] || "Standard",
            quantity: 2,
            price: products[0].basePrice,
          },
        ],
        total: products[0].basePrice * 2,
        status: "pending",
        shippingAddress: "123 Test Street, Test City, Test State 12345",
        shippingDetails: {
          fullName: user.name || "Test User",
          addressLine1: "123 Test Street",
          city: "Test City",
          state: "Test State",
          zipCode: "12345",
          phone: user.phone || "1234567890",
        },
        paymentMethod: "COD",
        paymentStatus: "pending",
        searchText: `pending ${user.name} ${products[0].name}`.toLowerCase(),
        statusHistory: [
          {
            status: "pending",
            timestamp: Date.now() - 86400000, // 1 day ago
            note: "Order placed",
          },
        ],
      },
      {
        userId: user._id,
        items: products.slice(0, 2).map((product, index) => ({
          productId: product._id,
          name: product.name,
          potency: product.potencies[0] || "Standard",
          form: product.forms[0] || "Standard",
          quantity: index + 1,
          price: product.basePrice,
        })),
        total: products[0].basePrice * 1 + products[1].basePrice * 2,
        status: "processing",
        shippingAddress: "456 Sample Avenue, Sample City, Sample State 67890",
        shippingDetails: {
          fullName: user.name || "Test User",
          addressLine1: "456 Sample Avenue",
          city: "Sample City",
          state: "Sample State",
          zipCode: "67890",
          phone: user.phone || "9876543210",
        },
        paymentMethod: "UPI",
        paymentStatus: "paid",
        paymentId: "TEST_PAYMENT_123",
        searchText: `processing ${user.name} ${products[0].name} ${products[1].name}`.toLowerCase(),
        statusHistory: [
          {
            status: "pending",
            timestamp: Date.now() - 172800000, // 2 days ago
            note: "Order placed",
          },
          {
            status: "processing",
            timestamp: Date.now() - 86400000, // 1 day ago
            note: "Payment confirmed",
          },
        ],
      },
      {
        userId: user._id,
        items: [
          {
            productId: products[products.length - 1]._id,
            name: products[products.length - 1].name,
            potency: products[products.length - 1].potencies[0] || "Standard",
            form: products[products.length - 1].forms[0] || "Standard",
            quantity: 1,
            price: products[products.length - 1].basePrice,
          },
        ],
        total: products[products.length - 1].basePrice,
        status: "shipped",
        shippingAddress: "789 Demo Road, Demo City, Demo State 11111",
        shippingDetails: {
          fullName: user.name || "Test User",
          addressLine1: "789 Demo Road",
          city: "Demo City",
          state: "Demo State",
          zipCode: "11111",
          phone: user.phone || "5555555555",
        },
        paymentMethod: "Card",
        paymentStatus: "paid",
        paymentId: "TEST_PAYMENT_456",
        searchText: `shipped ${user.name} ${products[products.length - 1].name}`.toLowerCase(),
        statusHistory: [
          {
            status: "pending",
            timestamp: Date.now() - 259200000, // 3 days ago
            note: "Order placed",
          },
          {
            status: "processing",
            timestamp: Date.now() - 172800000, // 2 days ago
            note: "Payment confirmed",
          },
          {
            status: "shipped",
            timestamp: Date.now() - 86400000, // 1 day ago
            note: "Order shipped via courier",
          },
        ],
      },
    ];

    const insertedIds = [];
    for (const order of testOrders) {
      const id = await ctx.db.insert("orders", order);
      insertedIds.push(id);
    }

    return {
      success: true,
      message: `Added ${insertedIds.length} test orders`,
      orderIds: insertedIds,
    };
  },
});
