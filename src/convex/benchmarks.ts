import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

export const benchmarkArrayFilters = action({
  args: {
    iterations: v.optional(v.number()),
    filterType: v.optional(v.string()), // "forms", "symptoms", "potencies"
  },
  handler: async (ctx, args) => {
    const iterations = args.iterations || 3;
    const filterType = args.filterType || "forms";
    
    console.log(`Starting benchmark for ${filterType} filter with ${iterations} iterations...`);
    
    let totalTime = 0;
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      // Define filters based on type
      let queryArgs: any = {
        paginationOpts: { numItems: 20, cursor: null },
      };
      
      if (filterType === "forms") {
        queryArgs.forms = ["Dilution", "Drops"];
      } else if (filterType === "symptoms") {
        queryArgs.symptoms = ["Pain", "Fever"];
      } else if (filterType === "potencies") {
        queryArgs.potencies = ["30C", "200C"];
      }
      
      await ctx.runQuery(api.products.getPaginatedProducts, queryArgs);
      
      const end = Date.now();
      const duration = end - start;
      console.log(`Iteration ${i + 1}: ${duration}ms`);
      totalTime += duration;
    }
    
    const avgTime = totalTime / iterations;
    console.log(`Benchmark Complete. Average time: ${avgTime.toFixed(2)}ms`);
    
    return {
      filterType,
      iterations,
      avgTimeMs: avgTime
    };
  }
});
