# Product UX Improvements - Implementation Guide

## Overview
This document describes all the Product UX improvements implemented in the admin panel. These features enhance product management, inventory tracking, pricing strategies, and overall workflow efficiency.

---

## 1. Batch Edit

### Feature Description
Update multiple products simultaneously with a single action. Select products using checkboxes and apply bulk changes.

### Usage
1. Navigate to **Admin Panel > Products**
2. Select products using checkboxes in the table
3. Click **Batch Edit** button (appears when products are selected)
4. Fill in fields you want to update:
   - **Base Price**: Update pricing for all selected products
   - **Stock**: Set stock levels
   - **Discount**: Apply percentage discount
   - **Availability**: Change availability status
   - **Reorder Point**: Set reorder thresholds
   - **Minimum Stock**: Set low stock warning levels
5. Click **Update Products**

### Files
- **Component**: `/src/pages/admin/components/BatchEditDialog.tsx`
- **Backend**: `/src/convex/products_admin.ts` (batchUpdateProducts mutation)

---

## 2. Price Scheduling

### Feature Description
Schedule future price changes with automatic application. Set start and optional end dates for price modifications.

### Usage
1. Edit an existing product
2. Scroll to **Scheduled Prices** section
3. Enter:
   - **New Price**: The future price
   - **Start Date**: When the price takes effect
   - **End Date** (optional): When price reverts
4. Click **Add Scheduled Price**

### Automatic Processing
- Cron job runs **every hour** at minute 0
- Applies scheduled prices when start date arrives
- Deactivates prices when end date passes
- Logs all automatic changes in audit logs

### Files
- **Component**: `/src/pages/admin/components/ScheduledPricesSection.tsx`
- **Backend Mutations**: `/src/convex/products_admin.ts`
- **Cron Job**: `/src/convex/crons.ts`
- **Processor**: `/src/convex/scheduledPrices.ts`

---

## 3. Inventory Alerts / Reorder Points

### Feature Description
Visual warnings for low stock products with customizable thresholds. Filter products by stock levels.

### Usage

#### Setting Thresholds
- **Min Stock**: Low stock warning threshold (default: 10)
- **Reorder Point**: When to trigger reorder notifications
- Set via Product Edit or Batch Edit

#### Visual Indicators
- **Orange warning icon** appears in stock column when stock ≤ minStock
- Hover over icon to see threshold

#### Filtering
Use the **Stock Level** filter:
- **All Stock Levels**: Show all products
- **Low Stock**: Products at or below minStock threshold
- **Out of Stock**: Products with 0 stock

### Files
- **Schema**: `/src/convex/schema.ts` (reorderPoint, minStock fields)
- **UI**: `/src/pages/admin/components/ProductTable.tsx`
- **Queries**: `/src/convex/productStockHistory.ts` (getLowStockProducts)

---

## 4. Product Duplication

### Feature Description
Quickly create a copy of an existing product with all attributes. Useful for creating product variants or similar items.

### Usage
1. In product table, click **⋮** (More actions)
2. Select **Duplicate**
3. Product is copied with:
   - Name appended with "(Copy)"
   - Stock reset to 0
   - All other attributes preserved
4. Edit dialog opens automatically for the new product

### Files
- **Backend**: `/src/convex/products_admin.ts` (duplicateProduct mutation)
- **UI**: `/src/pages/admin/components/ProductTable.tsx`
- **Handler**: `/src/pages/admin/AdminProducts.tsx`

---

## 5. Variant Management UI

### Feature Description
Enhanced interface for managing product variants (potencies, forms, packing sizes) with visual preview of all combinations.

### Usage
1. Edit a product
2. In **Product Variants** section, click to manage variants
3. The Variant Management Dialog provides:
   - **Quick Add**: Enter and add values with Enter key
   - **Visual Grid**: See all variant combinations
   - **Combination Count**: Know how many variants exist
   - **Quick Remove**: Delete variants with X button

### Variant Types
- **Potencies**: 30C, 200C, 1M, Mother Tincture, etc.
- **Forms**: Dilution, Tablets, Drops, Cream, etc.
- **Packing Sizes**: 30ml, 100ml, 500ml, etc.

### Files
- **Component**: `/src/pages/admin/components/VariantManagementDialog.tsx`
- **Form Integration**: `/src/pages/admin/components/ProductForm.tsx`

---

## 6. Stock History / Audit Trail

### Feature Description
Complete tracking of all stock changes with reasons, timestamps, and user information. Export history to CSV.

### Usage

#### Viewing History
1. In product table, click **⋮** (More actions)
2. Select **Stock History**
3. View detailed timeline of all stock changes

#### History Information
Each entry shows:
- **Change Type**: Manual adjustment, sale, restock, return, damage, initial
- **Previous/New Stock**: Before and after values
- **Quantity Changed**: Amount (+/-)
- **Reason**: Why the change was made
- **Performed By**: User who made the change
- **Timestamp**: When it occurred

#### Exporting
Click **Export CSV** button to download complete history

### Automatic Tracking
Stock changes are automatically logged when:
- Products are sold (via orders)
- Manual adjustments are made
- Batch edits affect stock
- Returns are processed

### Files
- **Schema**: `/src/convex/schema.ts` (productStockHistory table)
- **Component**: `/src/pages/admin/components/StockHistoryDialog.tsx`
- **Queries**: `/src/convex/productStockHistory.ts`
- **Mutations**: `/src/convex/products_admin.ts` (updateStock)

---

## Database Schema Updates

### Products Table - New Fields

```typescript
// Inventory Alerts
reorderPoint?: number  // Trigger reorder when stock reaches this level
minStock?: number      // Minimum stock threshold for warnings

// Price Scheduling
scheduledPrices?: Array<{
  price: number
  startDate: number     // timestamp
  endDate?: number      // optional timestamp
  isActive: boolean
}>

// Discount
discount?: number      // Percentage discount
```

### New Table: productStockHistory

```typescript
{
  productId: Id<"products">
  productName: string          // Cached for display
  changeType: "manual_adjustment" | "sale" | "restock" | "return" | "damage" | "initial"
  previousStock: number
  newStock: number
  quantity: number             // Amount changed (+ or -)
  reason?: string
  performedBy: string          // User ID
  timestamp: number
  orderId?: Id<"orders">       // Link if stock changed due to sale/return
}
```

---

## API Endpoints (Mutations)

### Product Management
- `batchUpdateProducts`: Bulk update multiple products
- `duplicateProduct`: Create product copy
- `updateStock`: Update stock with history tracking

### Price Scheduling
- `addScheduledPrice`: Add future price change
- `removeScheduledPrice`: Remove scheduled price
- `applyScheduledPrices`: Internal cron job handler

### Stock History
- `getStockHistory`: Query history for specific product
- `getAllStockHistory`: Query global stock changes
- `getLowStockProducts`: Find products below threshold

---

## Key Features Summary

| Feature | Description | User Benefit |
|---------|-------------|-------------|
| Batch Edit | Update multiple products at once | Save time on bulk operations |
| Price Scheduling | Automate future price changes | Run promotions automatically |
| Inventory Alerts | Visual warnings for low stock | Prevent stockouts |
| Product Duplication | Copy products quickly | Faster product creation |
| Variant Management | Enhanced UI for variants | Better variant organization |
| Stock History | Complete audit trail | Accountability and tracking |

---

## Best Practices

### Batch Editing
- Select related products (same category/brand) for consistency
- Test with small batches first
- Review changes before applying

### Price Scheduling
- Schedule price changes during off-peak hours
- Set end dates for temporary promotions
- Monitor audit logs for automatic changes

### Inventory Management
- Set minStock to 2-3 weeks of average sales
- Set reorderPoint higher than minStock
- Review low stock filter weekly

### Stock History
- Add detailed reasons when adjusting stock manually
- Export history monthly for records
- Review patterns to optimize inventory

---

## Troubleshooting

### Scheduled Prices Not Applying
- Check cron job is running: Verify in Convex dashboard
- Ensure dates are in future: Start date must be > current time
- Check isActive flag: Should be true

### Low Stock Warnings Not Showing
- Verify minStock is set: Check product edit form
- Confirm stock value: Must be ≤ minStock threshold
- Refresh page: Warnings appear after data reload

### Stock History Missing Entries
- Check if tracking is enabled: Verify mutations are called
- Review audit logs: Look for related entries
- Ensure proper permissions: Admin access required

---

## Future Enhancements

Potential improvements for future releases:

1. **Email Notifications**: Alert admins when stock is low
2. **Bulk Price Scheduling**: Schedule prices for multiple products
3. **Stock Forecasting**: Predict when to reorder based on sales trends
4. **Variant-Level Stock**: Track stock per variant combination
5. **Automated Reordering**: Integration with suppliers
6. **Price History Charts**: Visual timeline of price changes
7. **Stock Movement Analytics**: Reports on stock trends

---

## Support

For issues or questions:
1. Check this documentation
2. Review audit logs in Admin Panel
3. Contact development team with specific product IDs and timestamps
