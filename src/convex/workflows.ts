import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./users";
import { api } from "./_generated/api";

// Available trigger events
export const TRIGGER_EVENTS = {
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_DELIVERED: "order.delivered",
  USER_REGISTERED: "user.registered",
  USER_SUSPENDED: "user.suspended",
  PRODUCT_LOW_STOCK: "product.lowStock",
  PRODUCT_OUT_OF_STOCK: "product.outOfStock",
  PRESCRIPTION_EXPIRING: "prescription.expiring",
  REVIEW_SUBMITTED: "review.submitted",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_RECEIVED: "payment.received",
} as const;

// Get all workflows
export const getWorkflows = query({
  args: {
    enabled: v.optional(v.boolean()),
    trigger: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let workflows = await ctx.db.query("workflows").order("desc").collect();

    // Filter by enabled status if specified
    if (args.enabled !== undefined) {
      workflows = workflows.filter((w) => w.enabled === args.enabled);
    }

    // Filter by trigger if specified
    if (args.trigger) {
      workflows = workflows.filter((w) => w.trigger === args.trigger);
    }

    // Sort by priority (descending) and then by creation date
    workflows.sort((a, b) => {
      const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt - a.createdAt;
    });

    return workflows;
  },
});

// Get a single workflow
export const getWorkflow = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.workflowId);
  },
});

// Create a workflow
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    trigger: v.string(),
    triggerConditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.string(),
          value: v.any(),
          logicalOperator: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
        })
      )
    ),
    actions: v.array(
      v.object({
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
        config: v.any(),
        order: v.optional(v.number()),
      })
    ),
    enabled: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);

    const workflowId = await ctx.db.insert("workflows", {
      name: args.name,
      description: args.description,
      trigger: args.trigger,
      triggerConditions: args.triggerConditions,
      actions: args.actions,
      enabled: args.enabled ?? true,
      priority: args.priority ?? 0,
      runCount: 0,
      createdBy: userId || "admin",
      createdAt: Date.now(),
    });

    return workflowId;
  },
});

// Update a workflow
export const updateWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    trigger: v.optional(v.string()),
    triggerConditions: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.string(),
          value: v.any(),
          logicalOperator: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
        })
      )
    ),
    actions: v.optional(
      v.array(
        v.object({
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
          config: v.any(),
          order: v.optional(v.number()),
        })
      )
    ),
    enabled: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { workflowId, ...updates } = args;

    await ctx.db.patch(workflowId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return workflowId;
  },
});

// Delete a workflow
export const deleteWorkflow = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.workflowId);
  },
});

// Toggle workflow enabled status
export const toggleWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.workflowId, {
      enabled: args.enabled,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Trigger workflows based on an event
export const triggerWorkflows = action({
  args: {
    event: v.string(),
    entityId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const workflows = await ctx.runQuery(api.workflows.getWorkflows, {
      trigger: args.event,
      enabled: true,
    });

    const results = [];

    for (const workflow of workflows) {
      const startTime = Date.now();
      const logs: string[] = [];

      try {
        logs.push(`Starting workflow: ${workflow.name}`);
        logs.push(`Trigger: ${workflow.trigger}`);

        // Evaluate conditions
        if (workflow.triggerConditions && workflow.triggerConditions.length > 0) {
          const conditionsMet = evaluateConditions(args.data, workflow.triggerConditions);
          logs.push(`Conditions evaluation: ${conditionsMet ? "PASSED" : "FAILED"}`);

          if (!conditionsMet) {
            logs.push("Workflow execution skipped due to failed conditions");
            continue; // Skip this workflow
          }
        }

        // Sort actions by order
        const sortedActions = [...workflow.actions].sort((a, b) => ((a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0)));

        // Execute actions
        const executedActions = [];
        let overallStatus: "success" | "failed" | "partial" = "success";

        for (const action of sortedActions) {
          logs.push(`Executing action: ${action.type}`);

          try {
            const result = await executeAction(ctx, action, args.data);
            executedActions.push({
              actionType: action.type,
              status: result.success ? "success" : "failed",
              error: result.error,
              output: result.output,
            });

            if (result.success) {
              logs.push(`Action ${action.type} completed successfully`);
            } else {
              logs.push(`Action ${action.type} failed: ${result.error}`);
              overallStatus = "partial";
            }
          } catch (error: any) {
            logs.push(`Action ${action.type} threw error: ${error.message}`);
            executedActions.push({
              actionType: action.type,
              status: "failed",
              error: error.message,
            });
            overallStatus = "partial";
          }
        }

        if (executedActions.every((a) => a.status === "failed")) {
          overallStatus = "failed";
        }

        const duration = Date.now() - startTime;
        logs.push(`Workflow completed in ${duration}ms with status: ${overallStatus}`);

        // Record execution
        await ctx.runMutation(api.workflows.logWorkflowExecution, {
          workflowId: workflow._id,
          workflowName: workflow.name,
          triggeredBy: args.entityId,
          triggerEvent: args.event,
          status: overallStatus,
          executedActions,
          logs,
          duration,
        });

        // Update workflow stats
        await ctx.runMutation(api.workflows.updateWorkflowStats, {
          workflowId: workflow._id,
        });

        results.push({
          workflowId: workflow._id,
          workflowName: workflow.name,
          status: overallStatus,
          duration,
        });
      } catch (error: any) {
        console.error(`Workflow execution failed for ${workflow.name}:`, error);

        // Log failed execution
        await ctx.runMutation(api.workflows.logWorkflowExecution, {
          workflowId: workflow._id,
          workflowName: workflow.name,
          triggeredBy: args.entityId,
          triggerEvent: args.event,
          status: "failed",
          executedActions: [],
          logs: [...logs, `Fatal error: ${error.message}`],
          error: error.message,
          duration: Date.now() - startTime,
        });
      }
    }

    return results;
  },
});

// Test/Execute a single workflow manually
export const executeWorkflow = action({
  args: {
    workflowId: v.id("workflows"),
    testData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.runQuery(api.workflows.getWorkflow, {
      workflowId: args.workflowId,
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const startTime = Date.now();
    const logs: string[] = [];
    const executedActions: Array<{
      actionType: string;
      status: "success" | "failed" | "skipped";
      error?: string;
      output?: any;
    }> = [];

    logs.push(`Starting workflow: ${workflow.name}`);
    logs.push(`Trigger: ${workflow.trigger}`);

    // Evaluate conditions if provided
    if (workflow.triggerConditions && workflow.triggerConditions.length > 0) {
      const conditionsMet = evaluateConditions(args.testData, workflow.triggerConditions);
      logs.push(`Conditions evaluation: ${conditionsMet ? "PASSED" : "FAILED"}`);

      if (!conditionsMet) {
        logs.push("Workflow execution skipped due to failed conditions");
        return {
          success: false,
          message: "Conditions not met",
          logs,
          executedActions,
        };
      }
    }

    // Sort actions by order
    const sortedActions = [...workflow.actions].sort((a, b) => ((a.order !== undefined ? a.order : 0) - (b.order !== undefined ? b.order : 0)));

    // Execute actions
    let overallStatus: "success" | "failed" | "partial" = "success";

    for (const action of sortedActions) {
      logs.push(`Executing action: ${action.type}`);

      try {
        const result = await executeAction(ctx, action, args.testData);
        executedActions.push({
          actionType: action.type,
          status: result.success ? "success" : "failed",
          error: result.error,
          output: result.output,
        });

        if (result.success) {
          logs.push(`Action ${action.type} completed successfully`);
        } else {
          logs.push(`Action ${action.type} failed: ${result.error}`);
          overallStatus = "partial";
        }
      } catch (error: any) {
        logs.push(`Action ${action.type} threw error: ${error.message}`);
        executedActions.push({
          actionType: action.type,
          status: "failed",
          error: error.message,
        });
        overallStatus = "partial";
      }
    }

    if (executedActions.every((a) => a.status === "failed")) {
      overallStatus = "failed";
    }

    const duration = Date.now() - startTime;
    logs.push(`Workflow completed in ${duration}ms with status: ${overallStatus}`);

    // Record execution
    await ctx.runMutation(api.workflows.logWorkflowExecution, {
      workflowId: args.workflowId,
      workflowName: workflow.name,
      triggeredBy: "manual_test",
      triggerEvent: workflow.trigger,
      status: overallStatus,
      executedActions,
      logs,
      duration,
    });

    // Update workflow stats
    await ctx.runMutation(api.workflows.updateWorkflowStats, {
      workflowId: args.workflowId,
    });

    return {
      success: overallStatus !== "failed",
      status: overallStatus,
      logs,
      executedActions,
      duration,
    };
  },
});

// Log workflow execution
export const logWorkflowExecution = mutation({
  args: {
    workflowId: v.id("workflows"),
    workflowName: v.string(),
    triggeredBy: v.string(),
    triggerEvent: v.string(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("partial")),
    executedActions: v.array(
      v.object({
        actionType: v.string(),
        status: v.union(v.literal("success"), v.literal("failed"), v.literal("skipped")),
        error: v.optional(v.string()),
        output: v.optional(v.any()),
      })
    ),
    logs: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("workflowExecutions", {
      workflowId: args.workflowId,
      workflowName: args.workflowName,
      triggeredBy: args.triggeredBy,
      triggerEvent: args.triggerEvent,
      status: args.status,
      executedActions: args.executedActions,
      logs: args.logs,
      error: args.error,
      executedAt: Date.now(),
      duration: args.duration,
    });
  },
});

// Update workflow stats
export const updateWorkflowStats = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return;

    await ctx.db.patch(args.workflowId, {
      lastRun: Date.now(),
      runCount: (workflow.runCount || 0) + 1,
    });
  },
});

// Get workflow execution history
export const getWorkflowExecutions = query({
  args: {
    workflowId: v.optional(v.id("workflows")),
    limit: v.optional(v.number()),
    triggerEvent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = args.limit ?? 50;

    let query = ctx.db.query("workflowExecutions");

    // Filter by workflow if specified
    let executions;
    if (args.workflowId) {
      executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
        .order("desc")
        .take(limit);
    } else if (args.triggerEvent) {
      executions = await ctx.db
        .query("workflowExecutions")
        .withIndex("by_trigger_event", (q) => q.eq("triggerEvent", args.triggerEvent))
        .order("desc")
        .take(limit);
    } else {
      executions = await ctx.db
        .query("workflowExecutions")
        .order("desc")
        .take(limit);
    }

    return executions;
  },
});

// Get workflow execution statistics
export const getWorkflowStats = query({
  args: {
    workflowId: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const executions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter((e) => e.status === "success").length;
    const failedExecutions = executions.filter((e) => e.status === "failed").length;
    const partialExecutions = executions.filter((e) => e.status === "partial").length;

    const avgDuration =
      executions.reduce((sum, e) => sum + (e.duration ?? 0), 0) / totalExecutions || 0;

    const lastExecution = executions.sort((a, b) => b.executedAt - a.executedAt)[0];

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      partialExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      avgDuration: Math.round(avgDuration),
      lastExecution,
    };
  },
});

// Helper function to evaluate conditions
function evaluateConditions(data: any, conditions?: Array<any>): boolean {
  if (!conditions || conditions.length === 0) return true;

  let result = true;
  let currentLogicalOp: "AND" | "OR" = "AND";

  for (const condition of conditions) {
    const fieldValue = getNestedValue(data, condition.field);
    const conditionResult = evaluateCondition(fieldValue, condition.operator, condition.value);

    if (currentLogicalOp === "AND") {
      result = result && conditionResult;
    } else {
      result = result || conditionResult;
    }

    currentLogicalOp = condition.logicalOperator !== undefined ? condition.logicalOperator : "AND";
  }

  return result;
}

// Helper to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

// Helper to evaluate a single condition
function evaluateCondition(fieldValue: any, operator: string, compareValue: any): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === compareValue;
    case "not_equals":
      return fieldValue !== compareValue;
    case "gt":
      return fieldValue > compareValue;
    case "gte":
      return fieldValue >= compareValue;
    case "lt":
      return fieldValue < compareValue;
    case "lte":
      return fieldValue <= compareValue;
    case "contains":
      return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
    case "not_contains":
      return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);
    case "not_in":
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);
    default:
      return false;
  }
}

// Helper to execute individual actions
async function executeAction(
  ctx: any,
  action: { type: string; config: any },
  data?: any
): Promise<{ success: boolean; error?: string; output?: any }> {
  try {
    switch (action.type) {
      case "send_email":
        // Simulate email sending
        console.log("Send email action:", action.config, data);
        return {
          success: true,
          output: {
            to: action.config.recipient,
            subject: action.config.subject,
            template: action.config.template,
            message: "Email would be sent (simulation)",
          },
        };

      case "send_sms":
        // Simulate SMS sending
        console.log("Send SMS action:", action.config, data);
        return {
          success: true,
          output: {
            to: action.config.phone,
            message: action.config.message,
            status: "SMS would be sent (simulation)",
          },
        };

      case "update_field":
        // Simulate field update
        console.log("Update field action:", action.config, data);
        return {
          success: true,
          output: {
            entity: action.config.entity,
            entityId: action.config.entityId,
            field: action.config.field,
            value: action.config.value,
            message: "Field would be updated (simulation)",
          },
        };

      case "create_task":
        // Simulate task creation
        console.log("Create task action:", action.config, data);
        return {
          success: true,
          output: {
            title: action.config.title,
            description: action.config.description,
            assignedTo: action.config.assignedTo,
            message: "Task would be created (simulation)",
          },
        };

      case "call_webhook":
        // Simulate webhook call (could be implemented for real)
        console.log("Call webhook action:", action.config, data);
        try {
          if (action.config?.url) {
            // In production, you would actually make the fetch call
            // const response = await fetch(action.config.url, {
            //   method: action.config.method || "POST",
            //   headers: {
            //     "Content-Type": "application/json",
            //     ...(action.config.headers || {}),
            //   },
            //   body: JSON.stringify(data),
            //});
            return {
              success: true,
              output: {
                url: action.config.url,
                method: action.config?.method || "POST",
                message: "Webhook would be called (simulation)",
              },
            };
          }
          return { success: false, error: "No webhook URL provided" };
        } catch (error: any) {
          return { success: false, error: error.message };
        }

      case "add_tag":
        // Simulate tag addition
        console.log("Add tag action:", action.config, data);
        return {
          success: true,
          output: {
            entity: action.config.entity,
            entityId: action.config.entityId,
            tag: action.config.tag,
            message: "Tag would be added (simulation)",
          },
        };

      case "suspend_user":
        // Simulate user suspension
        console.log("Suspend user action:", action.config, data);
        return {
          success: true,
          output: {
            userId: action.config.userId,
            reason: action.config.reason,
            message: "User would be suspended (simulation)",
          },
        };

      case "send_notification":
        // Simulate notification sending
        console.log("Send notification action:", action.config, data);
        return {
          success: true,
          output: {
            userId: action.config.userId,
            title: action.config.title,
            message: action.config.message,
            status: "Notification would be sent (simulation)",
          },
        };

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
