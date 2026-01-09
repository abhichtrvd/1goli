# Workflow Integration Examples

This document provides copy-paste examples for integrating workflows into your existing codebase.

## How to Trigger Workflows

Add these calls to your existing mutations to automatically trigger workflows when events occur.

### 1. Order Events Integration

#### In `/home/daytona/codebase/src/convex/orders.ts`

```typescript
// Add this import at the top
import { api } from "./_generated/api";

// In createOrder mutation - after order is created
export const createOrder = mutation({
  handler: async (ctx, args) => {
    // ... existing order creation code ...

    const orderId = await ctx.db.insert("orders", {
      // ... order data ...
    });

    // ✨ NEW: Trigger workflow for order created
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "order.created",
      entityId: orderId,
      data: {
        orderId,
        userId: args.userId,
        total: args.total,
        items: args.items,
        email: userData?.email,
        phone: userData?.phone,
      },
    });

    return orderId;
  },
});

// In updateOrderStatus mutation - after status changes
export const updateOrderStatus = mutation({
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    const oldStatus = order.status;

    await ctx.db.patch(args.orderId, {
      status: args.newStatus,
      statusHistory: [
        ...(order.statusHistory || []),
        { status: args.newStatus, timestamp: Date.now() },
      ],
    });

    // ✨ NEW: Trigger workflow for status change
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "order.status_changed",
      entityId: args.orderId,
      data: {
        orderId: args.orderId,
        oldStatus,
        newStatus: args.newStatus,
        total: order.total,
        userId: order.userId,
      },
    });

    // ✨ NEW: Trigger specific status workflows
    if (args.newStatus === "delivered") {
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "order.delivered",
        entityId: args.orderId,
        data: { orderId: args.orderId, ...order },
      });
    }

    if (args.newStatus === "shipped") {
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "order.shipped",
        entityId: args.orderId,
        data: { orderId: args.orderId, ...order },
      });
    }

    if (args.newStatus === "cancelled") {
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "order.cancelled",
        entityId: args.orderId,
        data: { orderId: args.orderId, ...order },
      });
    }
  },
});

// In processRefund mutation - after refund is processed
export const processRefund = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      refundStatus: "processed",
      refundProcessedAt: Date.now(),
      refundAmount: args.amount,
    });

    // ✨ NEW: Trigger workflow for refund
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "order.refunded",
      entityId: args.orderId,
      data: {
        orderId: args.orderId,
        refundAmount: args.amount,
        reason: args.reason,
      },
    });
  },
});
```

### 2. User Events Integration

#### In `/home/daytona/codebase/src/convex/users.ts`

```typescript
// Add this import at the top
import { api } from "./_generated/api";

// After user registration
// This would typically be in your auth setup, but you can add it to any user creation logic
export const onUserCreated = mutation({
  handler: async (ctx, args) => {
    const userId = args.userId;
    const user = await ctx.db.get(userId);

    // ✨ NEW: Trigger welcome workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "user.registered",
      entityId: userId,
      data: {
        userId,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
      },
    });
  },
});

// In suspendUser mutation
export const suspendUser = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      suspended: true,
      suspendedAt: Date.now(),
      suspendedBy: args.adminId,
      suspensionReason: args.reason,
    });

    // ✨ NEW: Trigger suspension workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "user.suspended",
      entityId: args.userId,
      data: {
        userId: args.userId,
        reason: args.reason,
        suspendedBy: args.adminId,
      },
    });
  },
});

// In verifyEmail mutation
export const verifyEmail = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      emailVerified: true,
      emailVerificationTime: Date.now(),
    });

    // ✨ NEW: Trigger verification workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "user.verified",
      entityId: args.userId,
      data: {
        userId: args.userId,
        verificationType: "email",
      },
    });
  },
});

// In updateProfile mutation
export const updateProfile = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      name: args.name,
      phone: args.phone,
      address: args.address,
    });

    // ✨ NEW: Trigger profile update workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "user.profile_updated",
      entityId: args.userId,
      data: {
        userId: args.userId,
        changes: args,
      },
    });
  },
});
```

### 3. Product/Inventory Events Integration

#### In `/home/daytona/codebase/src/convex/products.ts`

```typescript
// Add this import at the top
import { api } from "./_generated/api";

// In createProduct mutation
export const createProduct = mutation({
  handler: async (ctx, args) => {
    const productId = await ctx.db.insert("products", {
      // ... product data ...
    });

    // ✨ NEW: Trigger product created workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "product.created",
      entityId: productId,
      data: {
        productId,
        name: args.name,
        basePrice: args.basePrice,
        stock: args.stock,
      },
    });

    return productId;
  },
});

// In updateProduct mutation
export const updateProduct = mutation({
  handler: async (ctx, args) => {
    const oldProduct = await ctx.db.get(args.productId);

    await ctx.db.patch(args.productId, {
      // ... updates ...
    });

    // ✨ NEW: Trigger product updated workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "product.updated",
      entityId: args.productId,
      data: {
        productId: args.productId,
        changes: args,
        oldData: oldProduct,
      },
    });
  },
});

// In updateStock mutation
export const updateStock = mutation({
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    const oldStock = product.stock;
    const newStock = args.newStock;

    await ctx.db.patch(args.productId, {
      stock: newStock,
    });

    // ✨ NEW: Trigger stock-related workflows
    if (newStock === 0 && oldStock > 0) {
      // Out of stock
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "product.out_of_stock",
        entityId: args.productId,
        data: {
          productId: args.productId,
          productName: product.name,
          sku: product.sku,
          stock: newStock,
        },
      });
    } else if (newStock > oldStock && oldStock === 0) {
      // Restocked
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "product.restocked",
        entityId: args.productId,
        data: {
          productId: args.productId,
          productName: product.name,
          previousStock: oldStock,
          newStock,
        },
      });
    } else if (newStock < (product.reorderPoint || 10) && newStock > 0) {
      // Low stock
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "product.low_stock",
        entityId: args.productId,
        data: {
          productId: args.productId,
          productName: product.name,
          stock: newStock,
          reorderPoint: product.reorderPoint || 10,
        },
      });
    }
  },
});

// In decrementStock (when order is placed)
export const decrementStock = mutation({
  handler: async (ctx, args) => {
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      const newStock = product.stock - item.quantity;

      await ctx.db.patch(item.productId, {
        stock: newStock,
      });

      // Check for low stock or out of stock
      if (newStock === 0) {
        await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
          event: "product.out_of_stock",
          entityId: item.productId,
          data: {
            productId: item.productId,
            productName: product.name,
            orderId: args.orderId,
          },
        });
      } else if (newStock < (product.reorderPoint || 10)) {
        await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
          event: "product.low_stock",
          entityId: item.productId,
          data: {
            productId: item.productId,
            productName: product.name,
            stock: newStock,
            reorderPoint: product.reorderPoint || 10,
          },
        });
      }
    }
  },
});
```

### 4. Prescription Events Integration

#### In `/home/daytona/codebase/src/convex/prescriptions.ts`

```typescript
// Add this import at the top
import { api } from "./_generated/api";

// In createPrescription mutation
export const createPrescription = mutation({
  handler: async (ctx, args) => {
    const prescriptionId = await ctx.db.insert("prescriptions", {
      // ... prescription data ...
      status: "pending",
    });

    // ✨ NEW: Trigger prescription submitted workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "prescription.submitted",
      entityId: prescriptionId,
      data: {
        prescriptionId,
        userId: args.userId,
        patientName: args.patientName,
        patientPhone: args.patientPhone,
      },
    });

    return prescriptionId;
  },
});

// In updatePrescriptionStatus mutation
export const updatePrescriptionStatus = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.prescriptionId, {
      status: args.status,
      pharmacistNotes: args.notes,
    });

    // ✨ NEW: Trigger approved workflow
    if (args.status === "reviewed" || args.status === "processed") {
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "prescription.approved",
        entityId: args.prescriptionId,
        data: {
          prescriptionId: args.prescriptionId,
          status: args.status,
          pharmacistNotes: args.notes,
        },
      });
    }
  },
});

// In checkExpiringPrescriptions (scheduled action)
export const checkExpiringPrescriptions = action({
  handler: async (ctx) => {
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);

    const prescriptions = await ctx.runQuery(api.prescriptions.getExpiringSoon, {
      before: thirtyDaysFromNow,
    });

    for (const prescription of prescriptions) {
      // ✨ NEW: Trigger expiring workflow
      await ctx.runAction(api.workflows.triggerWorkflows, {
        event: "prescription.expiring",
        entityId: prescription._id,
        data: {
          prescriptionId: prescription._id,
          userId: prescription.userId,
          expiryDate: prescription.expiryDate,
          daysUntilExpiry: Math.floor((prescription.expiryDate - Date.now()) / (24 * 60 * 60 * 1000)),
        },
      });
    }
  },
});
```

### 5. Review Events Integration

#### In `/home/daytona/codebase/src/convex/reviews.ts`

```typescript
// Add this import at the top
import { api } from "./_generated/api";

// In createReview mutation
export const createReview = mutation({
  handler: async (ctx, args) => {
    const reviewId = await ctx.db.insert("reviews", {
      // ... review data ...
      status: "pending",
    });

    // ✨ NEW: Trigger review submitted workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "review.submitted",
      entityId: reviewId,
      data: {
        reviewId,
        userId: args.userId,
        productId: args.productId,
        rating: args.rating,
        comment: args.comment,
      },
    });

    return reviewId;
  },
});

// In flagReview mutation
export const flagReview = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reviewId, {
      suspiciousScore: args.score,
      spamFlags: args.flags,
    });

    // ✨ NEW: Trigger review flagged workflow (for moderation)
    if (args.score > 70) {
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "review.flagged",
        entityId: args.reviewId,
        data: {
          reviewId: args.reviewId,
          suspiciousScore: args.score,
          flags: args.flags,
        },
      });
    }
  },
});
```

### 6. Payment Events Integration

#### In `/home/daytona/codebase/src/convex/payments.ts` (or in orders.ts)

```typescript
// Add this import at the top
import { api } from "./_generated/api";

// In processPayment mutation
export const processPayment = mutation({
  handler: async (ctx, args) => {
    try {
      // ... payment processing logic ...

      await ctx.db.patch(args.orderId, {
        paymentStatus: "paid",
        paymentId: args.paymentId,
      });

      // ✨ NEW: Trigger payment received workflow
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "payment.received",
        entityId: args.orderId,
        data: {
          orderId: args.orderId,
          amount: args.amount,
          paymentMethod: args.paymentMethod,
          paymentId: args.paymentId,
        },
      });

    } catch (error) {
      // Payment failed
      await ctx.db.patch(args.orderId, {
        paymentStatus: "failed",
      });

      // ✨ NEW: Trigger payment failed workflow
      await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
        event: "payment.failed",
        entityId: args.orderId,
        data: {
          orderId: args.orderId,
          amount: args.amount,
          paymentMethod: args.paymentMethod,
          error: error.message,
        },
      });
    }
  },
});
```

## Quick Integration Checklist

For each event you want to trigger workflows on:

1. ✅ Import the API: `import { api } from "./_generated/api";`
2. ✅ Add the trigger call after the action: `await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {...})`
3. ✅ Use the correct event name from `TRIGGER_EVENTS` in workflows.ts
4. ✅ Include relevant data (IDs, amounts, user info, etc.)
5. ✅ Test the workflow in the admin panel

## Example: Complete Order Flow

```typescript
// Complete example showing full order lifecycle with workflows

export const createOrder = mutation({
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 1. Create order
    const orderId = await ctx.db.insert("orders", {
      userId,
      items: args.items,
      total: args.total,
      status: "pending",
      // ... other fields ...
    });

    // 2. Trigger "order created" workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "order.created",
      entityId: orderId,
      data: { orderId, userId, total: args.total, items: args.items },
    });

    // 3. Decrement stock and check inventory
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      const newStock = product.stock - item.quantity;

      await ctx.db.patch(item.productId, { stock: newStock });

      // Trigger stock workflows if needed
      if (newStock < 10) {
        await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
          event: "product.low_stock",
          entityId: item.productId,
          data: { productId: item.productId, stock: newStock, productName: product.name },
        });
      }
    }

    return orderId;
  },
});

export const confirmPayment = mutation({
  handler: async (ctx, args) => {
    // Update order status
    await ctx.db.patch(args.orderId, {
      paymentStatus: "paid",
      status: "confirmed",
    });

    // Trigger payment received workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "payment.received",
      entityId: args.orderId,
      data: { orderId: args.orderId, amount: args.amount },
    });

    // Trigger status changed workflow
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "order.status_changed",
      entityId: args.orderId,
      data: { orderId: args.orderId, newStatus: "confirmed" },
    });
  },
});

export const shipOrder = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      status: "shipped",
      trackingNumber: args.trackingNumber,
      shippedAt: Date.now(),
    });

    // Trigger shipped workflow (sends tracking email)
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "order.shipped",
      entityId: args.orderId,
      data: {
        orderId: args.orderId,
        trackingNumber: args.trackingNumber,
      },
    });
  },
});

export const deliverOrder = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      status: "delivered",
      deliveredAt: Date.now(),
    });

    // Trigger delivered workflow (asks for review)
    await ctx.scheduler.runAfter(0, api.workflows.triggerWorkflows, {
      event: "order.delivered",
      entityId: args.orderId,
      data: { orderId: args.orderId },
    });
  },
});
```

## Testing Your Integration

1. Create a workflow in the admin panel for the event you want to test
2. Perform the action that should trigger the workflow (e.g., create an order)
3. Check the Workflow Executions tab to see if it was triggered
4. Review the logs to ensure the workflow executed correctly

## Common Patterns

### Pattern 1: Send Email on Event
```typescript
// Workflow: Send email when order is created
{
  name: "Order Confirmation Email",
  trigger: "order.created",
  actions: [{
    type: "send_email",
    config: {
      to: "{{email}}",
      subject: "Order Confirmation #{{orderId}}",
      template: "order_confirmation"
    }
  }]
}
```

### Pattern 2: Tag User Based on Behavior
```typescript
// Workflow: Tag user as VIP when they spend over $500
{
  name: "VIP User Tagging",
  trigger: "order.created",
  triggerConditions: [{
    field: "total",
    operator: "gte",
    value: 500
  }],
  actions: [{
    type: "add_tag",
    config: { tag: "VIP" }
  }]
}
```

### Pattern 3: Alert Admin on Low Stock
```typescript
// Workflow: Email admin when stock is low
{
  name: "Low Stock Alert",
  trigger: "product.low_stock",
  actions: [{
    type: "send_email",
    config: {
      to: "inventory@example.com",
      subject: "Low Stock Alert: {{productName}}",
      template: "low_stock_alert"
    }
  }]
}
```

### Pattern 4: Webhook for External Integration
```typescript
// Workflow: Call external CRM when user registers
{
  name: "Sync New User to CRM",
  trigger: "user.registered",
  actions: [{
    type: "call_webhook",
    config: {
      url: "https://crm.example.com/api/users",
      method: "POST",
      headers: { "Authorization": "Bearer xxx" }
    }
  }]
}
```

## Troubleshooting

**Q: Workflow not triggering?**
- Check that you're using the exact event name from `TRIGGER_EVENTS`
- Verify the workflow is enabled in the admin panel
- Check the console for any errors

**Q: How do I test without triggering real actions?**
- Use the "Test" button in the admin panel with sample data
- Review the execution logs to see what would happen

**Q: Can I trigger multiple workflows on the same event?**
- Yes! All enabled workflows matching the event will execute
- They run in priority order (higher priority first)

**Q: How do I pass user email/phone to workflows?**
- Include the data in the `data` parameter when calling `triggerWorkflows`
- Example: `data: { email: user.email, phone: user.phone, ... }`

## Next Steps

1. Review the WORKFLOW_RULE_ENGINE_IMPLEMENTATION.md for complete feature documentation
2. Start with simple workflows (like order confirmation emails)
3. Test thoroughly in development before deploying
4. Monitor workflow execution history to ensure they're working as expected
5. Gradually add more complex workflows with conditions and multiple actions
