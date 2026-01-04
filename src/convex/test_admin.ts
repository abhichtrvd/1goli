import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const verifyOrderSearch = action({
  args: {},
  handler: async (ctx) => {
    console.log("Starting Admin Orders Verification...");

    // 1. Test Basic Fetch
    const initialLoad = await ctx.runQuery(api.orders.getPaginatedOrders, { 
        paginationOpts: { numItems: 5, cursor: null },
        search: undefined 
    });
    console.log(`Fetch check: Retrieved ${initialLoad.page.length} orders.`);

    if (initialLoad.page.length > 0) {
        const sampleOrder = initialLoad.page[0];
        console.log(`Sample Order ID: ${sampleOrder._id}`);

        // 2. Test Search Functionality
        // Search by status
        const statusSearch = await ctx.runQuery(api.orders.getPaginatedOrders, {
            paginationOpts: { numItems: 5, cursor: null },
            search: sampleOrder.status
        });
        console.log(`Search by status '${sampleOrder.status}': Found ${statusSearch.page.length} results.`);

        // Search by partial ID (if supported by text search) or other fields
        // The generateOrderSearchText includes externalId, status, shippingAddress, paymentMethod, items
        if (sampleOrder.paymentMethod) {
             const paymentSearch = await ctx.runQuery(api.orders.getPaginatedOrders, {
                paginationOpts: { numItems: 5, cursor: null },
                search: sampleOrder.paymentMethod
            });
            console.log(`Search by payment '${sampleOrder.paymentMethod}': Found ${paymentSearch.page.length} results.`);
        }
    } else {
        console.log("No orders found to test search against.");
    }

    return "Verification Complete";
  }
});
