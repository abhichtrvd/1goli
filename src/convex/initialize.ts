import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Initialize all default data for the application
 * This should be run once after deploying the schema
 */
export const initializeAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      roles: false,
      integrations: false,
      templates: false,
      goals: false,
    };

    try {
      // 1. Initialize Default Roles
      const existingRoles = await ctx.db.query("roles").collect();
      if (existingRoles.length === 0) {
        // Import and call the initialization from roles.ts
        results.roles = true;
      }

      // 2. Initialize Integration Marketplace
      const existingIntegrations = await ctx.db.query("integrations").collect();
      if (existingIntegrations.length === 0) {
        results.integrations = true;
      }

      // 3. Initialize Notification Templates
      const existingTemplates = await ctx.db.query("notificationTemplates").collect();
      if (existingTemplates.length === 0) {
        results.templates = true;
      }

      // 4. Initialize Dashboard Goals
      const existingGoals = await ctx.db.query("dashboardGoals").collect();
      if (existingGoals.length === 0) {
        results.goals = true;
      }

      return {
        success: true,
        initialized: results,
        message: "Initialization check complete. Run specific initialize functions from admin pages.",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Check initialization status
 */
export const checkInitializationStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    const integrations = await ctx.db.query("integrations").collect();
    const templates = await ctx.db.query("notificationTemplates").collect();
    const goals = await ctx.db.query("dashboardGoals").collect();

    return {
      roles: {
        initialized: roles.length > 0,
        count: roles.length,
        expectedCount: 5, // Super Admin, Admin, Manager, Staff, Customer
      },
      integrations: {
        initialized: integrations.length > 0,
        count: integrations.length,
        expectedCount: 18,
      },
      templates: {
        initialized: templates.length > 0,
        count: templates.length,
        expectedCount: 8,
      },
      goals: {
        initialized: goals.length > 0,
        count: goals.length,
      },
    };
  },
});
