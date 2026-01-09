# Invoice System - Quick Start Guide

## For Administrators

### Accessing Invoices

1. **Navigate to Admin Panel** → Orders
2. Click on any order to open order details
3. Click the **"Invoice"** button in the header
4. The invoice dialog will open with a live preview

### Generating Invoice Numbers

First-time invoice generation:
- Invoice numbers are automatically generated when you open the invoice dialog
- Format: `INV-YYYYMMDD-XXXXX` (e.g., `INV-20240109-47321`)
- Once generated, the invoice number is saved to the order and won't change

### Printing Invoices

**Option 1: Full Invoice (Recommended)**
1. Click **"Invoice"** button in order details
2. Review the preview
3. Click **"Print"** button
4. The invoice opens in a new window
5. Use browser's print dialog to print or save as PDF

**Option 2: Quick Print**
1. Click **"Quick Print"** button in order details
2. Invoice opens immediately in new window
3. Print dialog appears automatically

### Downloading Invoices

1. Open the invoice dialog
2. Click **"Download"** button
3. Invoice saves as HTML file: `Invoice_[InvoiceNumber].html`
4. Open in any browser or convert to PDF

### Setting Up Invoice Settings

Configure invoice settings in **Admin Panel** → **Settings**:

#### Company Information
- **Site Name**: Your pharmacy name
- **Support Email**: Contact email for customers
- **Support Phone**: Customer service phone number
- **Address**: Complete company address

#### Tax Settings
- **Tax Enabled**: Enable/disable tax calculations
- **Tax Name**: GST, VAT, Sales Tax, etc.
- **Tax Rate**: Enter percentage (e.g., 18 for 18%)
- **Tax Number**: Your tax registration number

#### Currency Settings
- **Currency**: INR, USD, EUR, etc.
- **Currency Symbol**: ₹, $, €, etc.

## Invoice Features

### What's Included

✅ Company logo and branding  
✅ Invoice number (auto-generated)  
✅ Order ID and date/time  
✅ Customer shipping information  
✅ Payment details and status  
✅ Itemized product list with variants  
✅ Subtotal, tax, and total calculations  
✅ Tracking information (if shipped)  
✅ Professional styling and layout  
✅ Print-optimized design  
✅ Mobile responsive  

### Invoice Sections

1. **Header**
   - Company logo and name
   - Invoice number and order details
   - Company contact information

2. **Customer & Payment Info**
   - Billing address
   - Payment method and status
   - Transaction ID (if available)
   - Tracking number (if shipped)

3. **Items Table**
   - Product names with variants
   - Quantities and prices
   - Line totals

4. **Totals**
   - Subtotal
   - Tax (if enabled)
   - Shipping
   - Grand Total

5. **Footer**
   - Thank you message
   - Important notes
   - Contact information

## Tips & Best Practices

### For Best Results

1. **Complete Order Information**
   - Ensure shipping details are filled
   - Add payment information
   - Update tracking numbers

2. **Configure Settings First**
   - Set up company information
   - Configure tax settings
   - Upload company logo

3. **Generate Invoice Numbers Early**
   - Generate invoice numbers when order is confirmed
   - Don't delay invoice generation
   - Keep invoice numbers for records

4. **Save as PDF**
   - Use browser's "Save as PDF" option when printing
   - Recommended for email and archiving
   - Preserves formatting perfectly

### Common Workflows

**New Order Workflow**
1. Customer places order
2. Admin reviews order in orders page
3. Admin opens order details
4. Admin clicks "Invoice" to generate invoice number
5. Admin prints or downloads invoice
6. Invoice sent to customer via email

**Shipped Order Workflow**
1. Update order status to "Shipped"
2. Add tracking number
3. Open invoice dialog
4. Print/download invoice
5. Include in package or email to customer

## Keyboard Shortcuts

When invoice dialog is open:
- **Ctrl+P** / **Cmd+P**: Print invoice (when focused on new window)
- **Esc**: Close invoice dialog
- **Tab**: Navigate between buttons

## Troubleshooting

### Pop-up Blocked?
- Allow pop-ups for your admin site
- Check browser settings → Site permissions
- Try a different browser

### Invoice Preview Not Showing?
- Refresh the page
- Check internet connection (fonts load from Google)
- Clear browser cache

### Tax Not Calculating?
- Enable "Tax Enabled" in settings
- Set tax rate as number (e.g., 18 not 0.18)
- Save settings and try again

### Logo Not Showing?
- Place logo.png in public folder
- Check logo file name is exactly "logo.png"
- Verify image format is PNG

## FAQ

**Q: Can I edit the invoice after generation?**  
A: No, invoices are generated from order data. Update the order first, then regenerate the invoice.

**Q: Can I send invoices via email?**  
A: Currently manual - download the invoice and attach to email. Automatic email coming in future update.

**Q: What if I need to regenerate an invoice?**  
A: Simply open the invoice dialog again. The same invoice number will be used.

**Q: Can customers see their invoices?**  
A: Currently admin-only. Customer invoice access coming in future update.

**Q: Can I customize the invoice design?**  
A: Edit `/src/pages/admin/utils/invoiceGenerator.ts` to customize styles and layout.

**Q: Are invoice numbers unique?**  
A: Yes, each invoice number is unique and stored in the database.

## Need Help?

- Check `INVOICE_SYSTEM_README.md` for detailed documentation
- Review code in `/src/pages/admin/utils/invoiceGenerator.ts`
- Check browser console for error messages
- Verify settings are configured correctly

---

**Pro Tip**: Set up all settings before generating your first invoice for the best experience!
