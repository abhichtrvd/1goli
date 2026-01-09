# Invoice Generation System Documentation

## Overview

A comprehensive invoice generation system for the admin panel that creates professional, branded HTML invoices with full company branding, tax calculations, and multiple output options.

## Features

### Invoice Generator (`/src/pages/admin/utils/invoiceGenerator.ts`)

#### Key Functions

1. **`generateInvoice(order, settings)`**
   - Generates a complete HTML invoice with professional styling
   - Includes company branding, logo, and contact information
   - Automatically calculates subtotals, taxes, and grand total
   - Supports tax settings (GST, VAT, Sales Tax, etc.)
   - Responsive design that works on all devices
   - Print-optimized styles for clean paper output

2. **`printInvoice(htmlContent)`**
   - Opens the invoice in a new window
   - Automatically triggers browser print dialog
   - Handles pop-up blocking with proper error messages

3. **`downloadInvoice(htmlContent, invoiceNumber)`**
   - Downloads the invoice as an HTML file
   - Filename format: `Invoice_[InvoiceNumber].html`
   - Can be opened in any browser or converted to PDF

### Invoice Dialog Component (`/src/pages/admin/components/InvoiceDialog.tsx`)

#### Features

- **Live Preview**: Shows the invoice in an embedded iframe before printing/downloading
- **Invoice Number Generation**: Automatically generates invoice numbers if they don't exist
- **Three Action Buttons**:
  1. **Generate Invoice Number**: Creates a new invoice number for orders without one
  2. **Download**: Downloads the invoice as an HTML file
  3. **Print**: Opens the invoice in a new window for printing

#### Props

```typescript
interface InvoiceDialogProps {
  order: any;           // Order object with all order details
  open: boolean;        // Dialog open state
  onOpenChange: (open: boolean) => void;  // Callback for dialog state changes
}
```

## Invoice Layout

### Header Section
- **Company Logo**: Displays site logo (falls back gracefully if missing)
- **Company Name**: Site name from settings
- **Company Tagline**: "Homeopathic Medicine & Consultations"
- **Company Address**: Full address, phone, email
- **Tax Number**: GST/VAT number if enabled in settings
- **Invoice Details**: Invoice number, Order ID, Date, Time

### Body Section

#### Customer Information Card
- **Bill To**: Customer name, full address, phone number
- Displays shipping details if available
- Falls back to basic customer info if detailed address not available

#### Payment Information Card
- Payment method (Credit Card, UPI, COD, etc.)
- Payment status (Paid, Pending, etc.)
- Transaction ID (if available)
- Tracking number (if shipped)
- Carrier information (if shipped)

#### Items Table
- Professional table with gradient header
- Columns: Item Description, Quantity, Unit Price, Amount
- Item details include:
  - Product name (numbered list)
  - Potency, Form, Packing Size (if available)
- Hover effects for better UX

#### Totals Section
- **Subtotal**: Sum of all items
- **Tax**: Calculated based on tax rate from settings
  - Displays tax name (GST, VAT, etc.)
  - Shows tax percentage
  - Displays tax registration number as badge
- **Shipping**: Currently shows ₹0.00 (customizable)
- **Grand Total**: Bold, highlighted total with gradient background

### Footer Section
- Thank you message
- Important notes about the invoice
- Contact information for support
- Company branding tagline

## Integration with Order Details

The invoice system is integrated into the `OrderDetailsDialog` component with two options:

1. **Invoice Button**: Opens the comprehensive InvoiceDialog
   - Full preview with live rendering
   - Generate invoice number
   - Download or print options

2. **Quick Print Button**: Uses the legacy quick print function
   - Direct print without preview
   - Faster for quick operations

## Usage Examples

### Basic Usage in Admin Panel

The invoice system is automatically integrated into the admin orders page. When viewing order details:

1. Click the "Invoice" button to open the invoice dialog
2. Preview the invoice in the dialog
3. Generate an invoice number if needed (automatic on first invoice generation)
4. Click "Print" to print or "Download" to save as HTML

### Programmatic Usage

```typescript
import { generateInvoice, printInvoice, downloadInvoice } from '@/pages/admin/utils/invoiceGenerator';

// Generate invoice HTML
const invoiceHtml = generateInvoice(order, {
  siteName: 'My Pharmacy',
  supportEmail: 'support@example.com',
  supportPhone: '+91 12345 67890',
  address: '123 Street, City, Country',
  taxEnabled: true,
  taxName: 'GST',
  taxRate: 18,
  taxNumber: 'GST123456789',
  currency: 'INR',
  currencySymbol: '₹'
});

// Print the invoice
printInvoice(invoiceHtml);

// Or download it
downloadInvoice(invoiceHtml, 'INV-20240101-12345');
```

## Invoice Number Format

Invoice numbers are generated using the format:
```
INV-YYYYMMDD-XXXXX
```

Where:
- `INV` - Invoice prefix
- `YYYYMMDD` - Date in format (e.g., 20240109)
- `XXXXX` - Random 5-digit number

Example: `INV-20240109-47321`

## Tax Calculations

The system supports flexible tax calculations:

- **Tax Enabled**: Toggle in site settings
- **Tax Name**: GST, VAT, Sales Tax, etc.
- **Tax Rate**: Percentage (e.g., 18 for 18%)
- **Tax Number**: Registration number displayed on invoice

### Calculation Formula

```
Subtotal = Sum of (Item Price × Quantity)
Tax Amount = Subtotal × (Tax Rate / 100)
Grand Total = Subtotal + Tax Amount + Shipping
```

## Styling and Branding

### Color Scheme
- **Primary Gradient**: Purple gradient (#667eea to #764ba2)
- **Accent Colors**: Blue for information, Yellow for notes
- **Typography**: Inter font family for modern look

### Responsive Design
- Works on desktop, tablet, and mobile devices
- Optimized for printing with `@media print` styles
- Print-safe color adjustments with `print-color-adjust: exact`

### Print Optimization
- Removes background colors for ink saving (configurable)
- Adjusts margins and spacing for paper
- Ensures all important elements are visible

## File Structure

```
src/pages/admin/
├── utils/
│   └── invoiceGenerator.ts      # Core invoice generation logic
└── components/
    ├── InvoiceDialog.tsx         # Invoice preview and actions dialog
    └── OrderDetailsDialog.tsx    # Updated to include invoice button
```

## API Integration

### Required Convex Mutations

1. **`api.orders.generateInvoice`**
   - Generates and stores invoice number in database
   - Returns the generated invoice number
   - Only generates if invoice number doesn't exist

### Required Convex Queries

1. **`api.settings.getSettings`**
   - Fetches site settings for invoice generation
   - Includes tax settings, contact info, branding

## Database Schema

The order schema includes invoice-related fields:

```typescript
orders: {
  // ... other fields
  invoiceNumber: v.optional(v.string()),
  invoiceGeneratedAt: v.optional(v.number()),
}
```

## Error Handling

The system handles various error scenarios:

1. **Pop-up Blocker**: Shows user-friendly message to allow pop-ups
2. **Missing Logo**: Logo gracefully hides if image fails to load
3. **Missing Settings**: Falls back to default values
4. **No Invoice Number**: Automatically generates on first use

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile Browsers**: Responsive design works on all mobile browsers

## Print Behavior

When printing:
1. Opens invoice in new window
2. Waits for content to load
3. Automatically triggers print dialog
4. User can save as PDF from print dialog

## Future Enhancements

Potential improvements for future versions:

1. **PDF Generation**: Server-side PDF generation using libraries like Puppeteer
2. **Email Invoices**: Direct email option from invoice dialog
3. **Invoice Templates**: Multiple template designs to choose from
4. **Multi-currency**: Support for different currencies
5. **Bulk Invoice Generation**: Generate invoices for multiple orders at once
6. **Custom Branding**: Per-invoice logo and color customization
7. **Invoice History**: Track all invoice generations and downloads
8. **Discount Support**: Add discount fields and calculations

## Troubleshooting

### Common Issues

**Invoice not generating**
- Check that order data is complete
- Verify site settings are configured
- Check browser console for errors

**Print dialog not opening**
- Ensure pop-ups are allowed for the site
- Try using a different browser
- Check browser console for errors

**Invoice preview not showing**
- Check that iframe is not blocked
- Verify invoice HTML is generated correctly
- Check for JavaScript errors in console

**Tax calculations incorrect**
- Verify tax settings in admin panel
- Check that tax rate is entered as percentage (e.g., 18 for 18%)
- Ensure taxEnabled is set to true

## Support

For issues or questions about the invoice system:
- Check the code comments in `invoiceGenerator.ts`
- Review this documentation
- Check browser console for error messages
- Verify all required settings are configured

## License

This invoice system is part of the 1goli admin panel and follows the same license as the main application.
