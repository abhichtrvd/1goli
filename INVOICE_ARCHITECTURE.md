# Invoice System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │               AdminOrders Component                     │   │
│  │  - Lists all orders                                     │   │
│  │  - Search and filter functionality                      │   │
│  │  - Click order → Opens OrderDetailsDialog               │   │
│  └─────────────────────┬──────────────────────────────────┘   │
│                        │                                        │
│                        ▼                                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │          OrderDetailsDialog Component                   │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Header with Two Buttons:                        │  │   │
│  │  │  ┌─────────────┐  ┌──────────────┐              │  │   │
│  │  │  │   Invoice   │  │  Quick Print  │              │  │   │
│  │  │  └──────┬──────┘  └───────┬──────┘              │  │   │
│  │  │         │                  │                      │  │   │
│  │  │         │                  └──────────────┐       │  │   │
│  │  └─────────┼─────────────────────────────────┼──────┘  │   │
│  │            │                                  │         │   │
│  └────────────┼──────────────────────────────────┼─────────┘   │
│               │                                  │             │
└───────────────┼──────────────────────────────────┼─────────────┘
                │                                  │
                ▼                                  ▼
    ┌──────────────────────┐           ┌────────────────────────┐
    │  InvoiceDialog       │           │  generateInvoiceHtml() │
    │  Component           │           │  (Legacy Quick Print)  │
    └──────────┬───────────┘           └────────────────────────┘
               │                                   │
               │                                   │
               ▼                                   ▼
    ┌──────────────────────┐           ┌────────────────────────┐
    │  1. Fetch Settings   │           │  Opens new window      │
    │     from Convex      │           │  Writes HTML           │
    └──────────┬───────────┘           │  Auto-prints           │
               │                       └────────────────────────┘
               ▼
    ┌──────────────────────────────────┐
    │  2. Check Invoice Number         │
    │     - Exists? Use it             │
    │     - Missing? Generate via      │
    │       api.orders.generateInvoice │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │  3. Generate Invoice HTML        │
    │     invoiceGenerator.ts          │
    │     generateInvoice(order, settings) │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │  4. Display Preview in iframe    │
    │     Shows complete invoice       │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────────┐
    │  User Actions:                              │
    │  ┌─────────────────┐ ┌──────────────────┐  │
    │  │ Generate Invoice│ │    Download      │  │
    │  │     Number      │ │  (HTML file)     │  │
    │  └─────────────────┘ └──────────────────┘  │
    │  ┌─────────────────────────────────────┐   │
    │  │    Print (New window → Print)       │   │
    │  └─────────────────────────────────────┘   │
    └─────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│  Order Data  │
│  (Convex DB) │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Site Settings    │
│ - Company Info   │
│ - Tax Config     │
│ - Currency       │
└──────┬───────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  generateInvoice(order, settings)   │
│                                     │
│  Combines:                          │
│  ✓ Order items & totals             │
│  ✓ Customer details                 │
│  ✓ Payment info                     │
│  ✓ Company branding                 │
│  ✓ Tax calculations                 │
│                                     │
│  Produces:                          │
│  → Complete HTML document           │
│  → Styled with CSS                  │
│  → Print-optimized                  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Output Options:                    │
│  1. Preview in Dialog               │
│  2. Print via new window            │
│  3. Download as HTML file           │
│  4. Convert to PDF (browser)        │
└─────────────────────────────────────┘
```

## Component Hierarchy

```
AdminOrders
    └── OrderTable
         └── OrderDetailsDialog
              ├── OrderItems
              ├── OrderShipping
              ├── OrderPayment
              ├── OrderCustomer
              ├── OrderStatus
              ├── OrderTimeline
              └── InvoiceDialog ← NEW
                   └── Invoice Preview (iframe)
```

## File Structure

```
src/pages/admin/
│
├── AdminOrders.tsx
│
├── components/
│   ├── OrderTable.tsx
│   ├── OrderDetailsDialog.tsx ← UPDATED
│   └── InvoiceDialog.tsx ← NEW
│
└── utils/
    ├── orderUtils.ts (existing quick print)
    └── invoiceGenerator.ts ← NEW
         ├── generateInvoice()
         ├── printInvoice()
         └── downloadInvoice()
```

## Backend Integration

```
Convex Functions Used:

┌─────────────────────────────────┐
│  api.orders.generateInvoice     │
│  - Input: orderId               │
│  - Output: invoiceNumber        │
│  - Mutation: Stores in DB       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  api.settings.getSettings       │
│  - Input: none                  │
│  - Output: Site settings        │
│  - Query: Read-only             │
└─────────────────────────────────┘
```

## Invoice Number Generation

```
Generate Invoice Number:

1. User opens InvoiceDialog
   │
   ▼
2. Check order.invoiceNumber
   │
   ├─ EXISTS ────────┐
   │                 │
   └─ MISSING        │
      │              │
      ▼              │
3. Call mutation    │
   generateInvoice  │
   │                │
   ▼                │
4. Create:          │
   INV-20240109-47321 │
   │                │
   ▼                │
5. Save to DB      │
   order.invoiceNumber │
   │                │
   └────────────────┤
                    │
6. Use invoice number ◄─┘
   in generated HTML
```

## Tax Calculation Flow

```
Settings (taxEnabled: true, taxRate: 18)
         │
         ▼
┌────────────────────────────────┐
│  Calculate Subtotal:           │
│  Σ (item.price × item.quantity)│
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  Calculate Tax:                │
│  subtotal × (taxRate / 100)    │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│  Calculate Grand Total:        │
│  subtotal + tax + shipping     │
└────────────────────────────────┘
```

## State Management

```
InvoiceDialog Component State:

┌──────────────────────────────┐
│ isGenerating: boolean        │  ← Loading state for invoice generation
│ invoiceHtml: string          │  ← Generated HTML content
│ isPrinting: boolean          │  ← Loading state for print action
│ isDownloading: boolean       │  ← Loading state for download action
└──────────────────────────────┘

OrderDetailsDialog Component State:

┌──────────────────────────────┐
│ isInvoiceDialogOpen: boolean │  ← Controls InvoiceDialog visibility
└──────────────────────────────┘
```

## Error Handling

```
Error Scenarios:

1. Pop-up Blocked
   │
   ├─ Detect: window.open() returns null
   └─ Action: Show toast with helpful message

2. Settings Not Loaded
   │
   ├─ Detect: settings === undefined
   └─ Action: Use default values

3. Invoice Generation Failed
   │
   ├─ Detect: Mutation throws error
   └─ Action: Show error toast, keep dialog open

4. Logo Failed to Load
   │
   ├─ Detect: img onerror event
   └─ Action: Hide image, show text only
```

## Performance Considerations

```
Optimization Techniques:

1. Lazy Loading
   - Invoice HTML generated only when dialog opens
   - Not pre-generated for all orders

2. Caching
   - Invoice HTML cached in component state
   - No regeneration on print/download

3. Settings Query
   - Fetched once per session
   - Shared across all invoice generations

4. Print Window
   - New window created only on demand
   - Closed after print is cancelled/complete
```

## Security Considerations

```
Security Measures:

1. Admin-Only Access
   ✓ requireAdmin() check in mutations
   ✓ Component only accessible in admin panel

2. Data Validation
   ✓ Order data validated before invoice generation
   ✓ Settings have default fallbacks

3. XSS Prevention
   ✓ No user input directly in HTML
   ✓ Data comes from validated database

4. Access Control
   ✓ Invoice numbers are unique and non-guessable
   ✓ Only admins can generate invoices
```

## Browser Compatibility Matrix

```
Feature                 Chrome  Firefox  Safari  Edge
────────────────────────────────────────────────────
Invoice Generation        ✓       ✓       ✓      ✓
Live Preview (iframe)     ✓       ✓       ✓      ✓
Print Dialog              ✓       ✓       ✓      ✓
Download HTML             ✓       ✓       ✓      ✓
Gradient Backgrounds      ✓       ✓       ✓      ✓
Google Fonts              ✓       ✓       ✓      ✓
Print CSS                 ✓       ✓       ✓      ✓
Responsive Design         ✓       ✓       ✓      ✓
```

## Future Architecture Enhancements

```
Potential Additions:

┌────────────────────────────────┐
│  PDF Service (Backend)         │
│  - Generate PDFs server-side   │
│  - Store in blob storage        │
│  - Faster access, better caching│
└────────────────────────────────┘

┌────────────────────────────────┐
│  Email Service                 │
│  - Send invoices via email     │
│  - Email templates             │
│  - Attachment handling         │
└────────────────────────────────┘

┌────────────────────────────────┐
│  Template Engine               │
│  - Multiple invoice designs    │
│  - Custom branding per template│
│  - Template preview            │
└────────────────────────────────┘

┌────────────────────────────────┐
│  Analytics Dashboard           │
│  - Track invoice views         │
│  - Monitor download rates      │
│  - Revenue reporting           │
└────────────────────────────────┘
```

---

This architecture provides a scalable, maintainable foundation for the invoice system with clear separation of concerns and room for future enhancements.
