# Product UX Improvements - Quick Start Guide

## Quick Access Guide

### 1. Batch Edit Multiple Products

**Steps:**
1. Go to: `Admin Panel → Products`
2. Check boxes next to products you want to edit
3. Click: `Batch Edit (X)` button at top
4. Update desired fields
5. Click: `Update Products`

**Use Cases:**
- Apply discount to category
- Update stock levels
- Change availability status
- Set reorder points

---

### 2. Schedule Future Prices

**Steps:**
1. Go to: `Admin Panel → Products`
2. Click: Edit button on product
3. Scroll to: `Scheduled Prices` section
4. Enter: New price, start date, end date (optional)
5. Click: `Add Scheduled Price`

**Use Cases:**
- Holiday sales
- Seasonal pricing
- Limited-time promotions
- Gradual price adjustments

**Note:** Prices are applied automatically every hour by cron job.

---

### 3. Monitor Low Stock

**Quick View:**
- Products table shows 🔶 warning icon when stock is low
- Hover over icon to see threshold

**Filter Low Stock:**
1. Go to: `Admin Panel → Products`
2. Click: `Stock Level` dropdown
3. Select: `Low Stock` or `Out of Stock`

**Set Thresholds:**
1. Edit product
2. Set: `Minimum Stock` field (default: 10)
3. Set: `Reorder Point` field (when to reorder)

**Use Cases:**
- Prevent stockouts
- Plan restocking
- Weekly inventory reviews

---

### 4. Duplicate Products

**Steps:**
1. Go to: `Admin Panel → Products`
2. Find product to duplicate
3. Click: `⋮` (More actions)
4. Select: `Duplicate`
5. Edit dialog opens automatically with new copy

**Use Cases:**
- Create similar products
- Add product variants
- Copy product structures
- Quick product creation

**Note:** Stock is reset to 0, name gets "(Copy)" suffix.

---

### 5. Manage Variants

**Current Workflow (in Product Form):**
1. Edit product
2. Scroll to: `Product Variants` section
3. Add: Potencies (e.g., 30C, 200C)
4. Add: Forms (e.g., Dilution, Tablets)
5. Add: Packing Sizes (e.g., 30ml, 100ml)

**Enhanced UI (Optional):**
- Use `VariantManagementDialog` for visual grid
- See all combinations
- Quick add/remove
- Preview total variants

**Variant Combinations:**
- Each potency × form × size = 1 variant
- Example: 3 potencies × 2 forms × 2 sizes = 12 variants

---

### 6. View Stock History

**Steps:**
1. Go to: `Admin Panel → Products`
2. Find product
3. Click: `⋮` (More actions)
4. Select: `Stock History`
5. View timeline of changes
6. (Optional) Click: `Export CSV`

**What You'll See:**
- All stock changes
- Who made the change
- When it happened
- Reason for change
- Previous/new stock levels
- Change type (sale, restock, adjustment, etc.)

**Use Cases:**
- Audit inventory
- Track discrepancies
- Review sales patterns
- Accountability

---

## Common Workflows

### Weekly Inventory Check

1. Click: `Stock Level → Low Stock`
2. Review products below threshold
3. Select products to reorder
4. Use: `Batch Edit` to update stock after receiving shipment
5. Check: `Stock History` to verify changes

### Holiday Sale Setup

1. Select sale products (by category/brand)
2. Use: `Batch Edit` to set discount
3. For each product: Add scheduled price with end date
4. Monitor: Prices apply automatically
5. After sale: Prices revert automatically

### New Product Creation

1. Find: Similar existing product
2. Click: `Duplicate`
3. Edit: Name, description, specifics
4. Set: Initial stock (logged in history)
5. Set: `Min Stock` and `Reorder Point`
6. (Optional) Add: Scheduled prices

### Monthly Audit

1. Export: Stock history for all products
2. Filter: By change type
3. Review: Manual adjustments
4. Cross-check: Against physical inventory
5. Update: Thresholds based on patterns

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Batch Edit | Select products → `E` key |
| Export CSV | In dialog → `Ctrl+S` |
| Close dialog | `Esc` key |
| Add scheduled price | In section → `Enter` key |

---

## Tips & Tricks

### Batch Edit
- ✓ Start with small test batch
- ✓ Leave fields empty to keep current values
- ✓ Use for category-wide changes
- ✗ Don't batch edit unrelated products

### Price Scheduling
- ✓ Schedule during off-peak hours
- ✓ Set end dates for temporary sales
- ✓ Monitor audit logs
- ✗ Don't overlap schedules

### Inventory Alerts
- ✓ Adjust thresholds seasonally
- ✓ Higher thresholds for popular items
- ✓ Weekly low stock reviews
- ✗ Don't ignore warnings

### Stock History
- ✓ Add detailed reasons
- ✓ Export monthly
- ✓ Review patterns
- ✗ Don't delete history

### Product Duplication
- ✓ Use for variants
- ✓ Edit immediately
- ✓ Verify all fields
- ✗ Don't forget to update stock

### Variant Management
- ✓ Use consistent naming
- ✓ Preview combinations
- ✓ Remove unused variants
- ✗ Don't create too many variants

---

## Troubleshooting

### "Batch Edit button not showing"
→ Select at least one product using checkbox

### "Scheduled price not applying"
→ Wait for next hour (cron runs hourly at :00)
→ Check start date is in past
→ Verify isActive = true

### "Low stock icon not appearing"
→ Set minStock field on product
→ Reduce stock below threshold
→ Refresh page

### "Stock history is empty"
→ Make a stock change first
→ Check admin permissions
→ Verify product ID is correct

### "Duplicate created but can't find it"
→ Look for "(Copy)" in name
→ Check last page of products
→ Search for original product name

### "Variants not saving"
→ Click Save/Update Product button
→ Check all required fields filled
→ Verify arrays are not empty

---

## Video Tutorials (To Be Created)

1. ▶️ Batch Editing Products (2 min)
2. ▶️ Setting Up Price Schedules (3 min)
3. ▶️ Managing Low Stock Alerts (2 min)
4. ▶️ Duplicating Products (1 min)
5. ▶️ Using Variant Management (4 min)
6. ▶️ Reviewing Stock History (3 min)

---

## Getting Help

1. **Documentation**: `PRODUCT_UX_IMPROVEMENTS.md`
2. **API Reference**: Check mutation signatures in `products_admin.ts`
3. **Schema**: Review `schema.ts` for data structure
4. **Audit Logs**: Admin Panel → View logs for debugging

---

**Last Updated**: 2026-01-09
**Version**: 1.0
