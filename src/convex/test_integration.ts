import { query } from "./_generated/server";

export const testPrescriptionQueries = query({
  args: {},
  handler: async (ctx) => {
    const results = {
      pendingCount: "OK",
      searchIndex: "OK",
      dateFilter: "OK",
    };

    try {
      // 1. Test Pending Count Query (uses by_status index)
      await ctx.db
        .query("prescriptions")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();
    } catch (e: any) {
      results.pendingCount = `FAILED: ${e.message}`;
    }

    try {
      // 2. Test Search Index (uses search_all index)
      await ctx.db
        .query("prescriptions")
        .withSearchIndex("search_all", (q) => q.search("searchText", "test"))
        .take(1);
    } catch (e: any) {
      results.searchIndex = `FAILED: ${e.message}`;
    }

    try {
      // 3. Test Date Filter Query (uses standard query + filter)
      await ctx.db
        .query("prescriptions")
        .order("desc")
        .filter((q) => q.gte(q.field("_creationTime"), Date.now() - 10000))
        .take(1);
    } catch (e: any) {
      results.dateFilter = `FAILED: ${e.message}`;
    }

    return results;
  },
});
