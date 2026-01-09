import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";

// Get all rules
export const getRules = query({
  args: {
    enabled: v.optional(v.boolean()),
    ruleType: v.optional(
      v.union(
        v.literal("validation"),
        v.literal("pricing"),
        v.literal("routing"),
        v.literal("automation")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let rules = await ctx.db.query("rules").order("desc").collect();

    // Filter by enabled status if specified
    if (args.enabled !== undefined) {
      rules = rules.filter((r) => r.enabled === args.enabled);
    }

    // Filter by type if specified
    if (args.ruleType) {
      rules = rules.filter((r) => r.ruleType === args.ruleType);
    }

    // Sort by priority (descending) and then by creation date
    rules.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt - a.createdAt;
    });

    return rules;
  },
});

// Get active rules by type
export const getActiveRulesByType = query({
  args: {
    ruleType: v.union(
      v.literal("validation"),
      v.literal("pricing"),
      v.literal("routing"),
      v.literal("automation")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db
      .query("rules")
      .withIndex("by_type_enabled", (q) => q.eq("ruleType", args.ruleType).eq("enabled", true))
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("validFrom"), undefined),
            q.lte(q.field("validFrom"), now)
          ),
          q.or(
            q.eq(q.field("validUntil"), undefined),
            q.gte(q.field("validUntil"), now)
          )
        )
      )
      .collect();
  },
});

// Get a single rule
export const getRule = query({
  args: { ruleId: v.id("rules") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.ruleId);
  },
});

// Create a rule
export const createRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    ruleType: v.union(
      v.literal("validation"),
      v.literal("pricing"),
      v.literal("routing"),
      v.literal("automation")
    ),
    conditions: v.array(
      v.object({
        field: v.string(),
        operator: v.string(),
        value: v.any(),
        value2: v.optional(v.any()),
        logicalOperator: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
      })
    ),
    actions: v.array(
      v.object({
        type: v.string(),
        config: v.any(),
      })
    ),
    priority: v.number(),
    enabled: v.optional(v.boolean()),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);

    const ruleId = await ctx.db.insert("rules", {
      name: args.name,
      description: args.description,
      ruleType: args.ruleType,
      conditions: args.conditions,
      actions: args.actions,
      priority: args.priority,
      enabled: args.enabled ?? true,
      validFrom: args.validFrom,
      validUntil: args.validUntil,
      executionCount: 0,
      createdBy: userId || "admin",
      createdAt: Date.now(),
    });

    return ruleId;
  },
});

// Update a rule
export const updateRule = mutation({
  args: {
    ruleId: v.id("rules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    conditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.string(),
          value: v.any(),
          value2: v.optional(v.any()),
          logicalOperator: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
        })
      )
    ),
    actions: v.optional(
      v.array(
        v.object({
          type: v.string(),
          config: v.any(),
        })
      )
    ),
    priority: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { ruleId, ...updates } = args;

    await ctx.db.patch(ruleId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return ruleId;
  },
});

// Delete a rule
export const deleteRule = mutation({
  args: { ruleId: v.id("rules") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.ruleId);
  },
});

// Toggle rule enabled status
export const toggleRule = mutation({
  args: {
    ruleId: v.id("rules"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.ruleId, {
      enabled: args.enabled,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Evaluate rule
export const evaluateRule = action({
  args: {
    ruleId: v.id("rules"),
    entityData: v.any(),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.runQuery(api.rules.getRule, {
      ruleId: args.ruleId,
    });

    if (!rule) throw new Error("Rule not found");

    const conditionsMet = evaluateConditions(rule.conditions, args.entityData);
    const actions = conditionsMet ? rule.actions : [];

    return {
      conditionsMet,
      actions,
      executedActions: conditionsMet ? await executeRuleActions(rule.actions, args.entityData) : [],
    };
  },
});

// Evaluate all rules for an entity (apply rules)
export const applyRules = action({
  args: {
    ruleType: v.union(
      v.literal("validation"),
      v.literal("pricing"),
      v.literal("routing"),
      v.literal("automation")
    ),
    entityData: v.any(),
  },
  handler: async (ctx, args) => {
    const rules = await ctx.runQuery(api.rules.getActiveRulesByType, {
      ruleType: args.ruleType,
    });

    // Sort by priority (descending)
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);

    const results = [];

    for (const rule of sortedRules) {
      const conditionsMet = evaluateConditions(rule.conditions, args.entityData);

      if (conditionsMet) {
        const executedActions = await executeRuleActions(rule.actions, args.entityData);

        results.push({
          ruleId: rule._id,
          ruleName: rule.name,
          ruleType: rule.ruleType,
          conditionsMet: true,
          executedActions,
        });

        // Increment execution count and update last executed
        await ctx.runMutation(api.rules.updateRuleStats, {
          ruleId: rule._id,
        });
      }
    }

    return results;
  },
});

// Update rule execution stats
export const updateRuleStats = mutation({
  args: { ruleId: v.id("rules") },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) return;

    await ctx.db.patch(args.ruleId, {
      executionCount: (rule.executionCount || 0) + 1,
      lastExecuted: Date.now(),
    });
  },
});

// Helper function to evaluate conditions
function evaluateConditions(conditions: any[], data: any): boolean {
  if (!conditions || conditions.length === 0) return true;

  let result = true;
  let currentLogicalOp = "AND";

  for (const condition of conditions) {
    const fieldValue = getNestedValue(data, condition.field);
    const matches = evaluateCondition(fieldValue, condition.operator, condition.value);

    if (currentLogicalOp === "AND") {
      result = result && matches;
    } else {
      result = result || matches;
    }

    currentLogicalOp = condition.logicalOperator || "AND";
  }

  return result;
}

// Helper to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper to evaluate single condition
function evaluateCondition(value: any, operator: string, filterValue: any): boolean {
  switch (operator) {
    case "equals":
      return value === filterValue;
    case "not_equals":
      return value !== filterValue;
    case "gt":
      return value > filterValue;
    case "gte":
      return value >= filterValue;
    case "lt":
      return value < filterValue;
    case "lte":
      return value <= filterValue;
    case "contains":
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case "not_contains":
      return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case "in":
      return Array.isArray(filterValue) && filterValue.includes(value);
    case "not_in":
      return Array.isArray(filterValue) && !filterValue.includes(value);
    case "between":
      // filterValue should be an array [min, max] or use value2
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        return value >= filterValue[0] && value <= filterValue[1];
      }
      return false;
    default:
      return false;
  }
}

// Helper to execute rule actions
async function executeRuleActions(actions: any[], entityData: any): Promise<any[]> {
  const results = [];

  for (const action of actions) {
    try {
      let actionResult;

      switch (action.type) {
        case "apply_discount":
          actionResult = applyDiscountAction(action.config, entityData);
          break;
        case "reorder_stock":
          actionResult = reorderStockAction(action.config, entityData);
          break;
        case "assign_segment":
          actionResult = assignSegmentAction(action.config, entityData);
          break;
        case "block_order":
          actionResult = blockOrderAction(action.config, entityData);
          break;
        case "send_alert":
          actionResult = sendAlertAction(action.config, entityData);
          break;
        case "route_to_warehouse":
          actionResult = routeToWarehouseAction(action.config, entityData);
          break;
        case "assign_user":
          actionResult = assignUserAction(action.config, entityData);
          break;
        default:
          actionResult = {
            success: false,
            error: `Unknown action type: ${action.type}`,
            data: null,
          };
      }

      results.push({
        actionType: action.type,
        status: actionResult.success ? "success" : "failed",
        result: actionResult.data,
        error: actionResult.error,
      });
    } catch (error) {
      results.push({
        actionType: action.type,
        status: "failed",
        error: String(error),
      });
    }
  }

  return results;
}

// Action handlers (simulated - can be implemented to actually perform actions)
function applyDiscountAction(config: any, data: any): any {
  console.log("Apply discount action:", config, data);
  const originalPrice = data.price || data.total || 0;
  const discountPercent = config.discountPercent || 0;
  const discountedPrice = originalPrice * (1 - discountPercent / 100);

  return {
    success: true,
    data: {
      originalPrice,
      discountPercent,
      discountedPrice,
      discountAmount: originalPrice - discountedPrice,
      message: `${discountPercent}% discount applied`,
    },
  };
}

function reorderStockAction(config: any, data: any): any {
  console.log("Reorder stock action:", config, data);
  return {
    success: true,
    data: {
      productId: data.productId,
      currentStock: data.stock,
      reorderQuantity: config.reorderQuantity,
      message: `Reorder initiated for ${config.reorderQuantity} units`,
    },
  };
}

function assignSegmentAction(config: any, data: any): any {
  console.log("Assign segment action:", config, data);
  return {
    success: true,
    data: {
      userId: data.userId,
      segment: config.segment,
      message: `User assigned to segment: ${config.segment}`,
    },
  };
}

function blockOrderAction(config: any, data: any): any {
  console.log("Block order action:", config, data);
  return {
    success: true,
    data: {
      orderId: data.orderId,
      blocked: true,
      reason: config.reason,
      message: `Order blocked: ${config.reason}`,
    },
  };
}

function sendAlertAction(config: any, data: any): any {
  console.log("Send alert action:", config, data);
  return {
    success: true,
    data: {
      alertType: config.alertType,
      message: config.message,
      recipients: config.recipients,
      status: "Alert sent",
    },
  };
}

function routeToWarehouseAction(config: any, data: any): any {
  console.log("Route to warehouse action:", config, data);
  return {
    success: true,
    data: {
      orderId: data.orderId,
      warehouse: config.warehouse,
      location: config.location,
      message: `Order routed to warehouse: ${config.warehouse}`,
    },
  };
}

function assignUserAction(config: any, data: any): any {
  console.log("Assign user action:", config, data);
  return {
    success: true,
    data: {
      entityId: data.id || data._id,
      assignedTo: config.userId,
      message: `Assigned to user: ${config.userId}`,
    },
  };
}

// Import API for internal use
import { api } from "./_generated/api";
