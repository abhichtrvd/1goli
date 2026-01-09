/**
 * Comprehensive Invoice Generator
 * Generates professional HTML invoices with company branding, order details, and payment information
 */

interface InvoiceSettings {
  siteName?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  taxEnabled?: boolean;
  taxName?: string;
  taxRate?: number;
  taxNumber?: string;
  currency?: string;
  currencySymbol?: string;
}

interface InvoiceOrder {
  _id: string;
  _creationTime: number;
  invoiceNumber?: string;
  items: Array<{
    name: string;
    potency?: string;
    form?: string;
    packingSize?: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  shippingAddress?: string;
  shippingDetails?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  paymentMethod?: string;
  paymentStatus?: string;
  paymentId?: string;
  userName?: string;
  userContact?: string;
  trackingNumber?: string;
  carrier?: string;
}

/**
 * Generates a professional HTML invoice
 * @param order - The order object containing all order details
 * @param settings - Site settings including company info and tax settings
 * @returns HTML string ready to be displayed or printed
 */
export function generateInvoice(order: InvoiceOrder, settings?: InvoiceSettings): string {
  const currencySymbol = settings?.currencySymbol || '₹';
  const siteName = settings?.siteName || '1goli Pharmacy';
  const supportEmail = settings?.supportEmail || 'support@1goli.com';
  const supportPhone = settings?.supportPhone || '+91 98765 43210';
  const companyAddress = settings?.address || '123 Wellness Street, Health City, India 400001';

  // Tax calculations
  const taxEnabled = settings?.taxEnabled || false;
  const taxName = settings?.taxName || 'GST';
  const taxRate = settings?.taxRate || 0;
  const taxNumber = settings?.taxNumber || '';

  // Calculate subtotal (sum of all items)
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate tax amount
  const taxAmount = taxEnabled ? (subtotal * taxRate) / 100 : 0;

  // Total is either from order.total or calculated
  const grandTotal = order.total || (subtotal + taxAmount);

  // Generate invoice number if not exists
  const invoiceNumber = order.invoiceNumber || `INV-${order._id.slice(-8).toUpperCase()}`;

  // Format dates
  const invoiceDate = new Date(order._creationTime).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const invoiceTime = new Date(order._creationTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Logo URL
  const logoUrl = window.location.origin + '/logo.png';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1f2937;
      line-height: 1.6;
      background: #f9fafb;
      padding: 20px;
    }

    .invoice-wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border-radius: 16px;
      overflow: hidden;
    }

    .invoice-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 48px;
    }

    .header-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      align-items: start;
    }

    .company-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-logo {
      height: 48px;
      width: 48px;
      background: white;
      border-radius: 12px;
      padding: 8px;
      object-fit: contain;
    }

    .company-name {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.2;
    }

    .company-tagline {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 500;
    }

    .company-address {
      font-size: 14px;
      opacity: 0.85;
      line-height: 1.8;
    }

    .invoice-meta {
      text-align: right;
    }

    .invoice-title {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -0.025em;
      margin-bottom: 16px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .invoice-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .invoice-detail-row {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      font-size: 14px;
    }

    .detail-label {
      opacity: 0.85;
      font-weight: 500;
    }

    .detail-value {
      font-weight: 700;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    }

    .invoice-body {
      padding: 48px;
    }

    .section {
      margin-bottom: 40px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      margin-bottom: 16px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 48px;
    }

    .info-card {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
    }

    .info-card-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      margin-bottom: 12px;
    }

    .customer-name {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }

    .address-line {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.8;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .info-label {
      color: #6b7280;
      font-weight: 500;
    }

    .info-value {
      color: #111827;
      font-weight: 600;
    }

    .items-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 32px;
    }

    .items-table thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .items-table th {
      text-align: left;
      padding: 16px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .items-table th:first-child {
      border-top-left-radius: 12px;
    }

    .items-table th:last-child {
      border-top-right-radius: 12px;
      text-align: right;
    }

    .items-table td {
      padding: 20px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .items-table tbody tr:last-child td {
      border-bottom: none;
    }

    .items-table tbody tr:hover {
      background: #f9fafb;
    }

    .item-name {
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
      display: block;
    }

    .item-details {
      font-size: 12px;
      color: #6b7280;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 32px;
    }

    .totals-table {
      width: 400px;
      background: #f9fafb;
      border-radius: 12px;
      padding: 24px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 15px;
      border-bottom: 1px solid #e5e7eb;
    }

    .total-row:last-child {
      border-bottom: none;
    }

    .total-label {
      font-weight: 600;
      color: #4b5563;
    }

    .total-value {
      font-weight: 700;
      color: #111827;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    }

    .grand-total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 16px -24px -24px;
      padding: 24px;
      border-radius: 0 0 12px 12px;
    }

    .grand-total .total-label,
    .grand-total .total-value {
      color: white;
      font-size: 20px;
      font-weight: 800;
    }

    .notes-section {
      background: #fffbeb;
      border: 2px solid #fef3c7;
      border-radius: 12px;
      padding: 24px;
      margin-top: 40px;
    }

    .notes-title {
      font-size: 14px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 8px;
    }

    .notes-content {
      font-size: 13px;
      color: #78350f;
      line-height: 1.6;
    }

    .invoice-footer {
      background: #f9fafb;
      padding: 40px 48px;
      text-align: center;
      border-top: 2px solid #e5e7eb;
    }

    .footer-message {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 16px;
    }

    .footer-contact {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .footer-divider {
      width: 100px;
      height: 3px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 24px auto;
      border-radius: 2px;
    }

    .tax-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      margin-left: 8px;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .invoice-wrapper {
        box-shadow: none;
        border-radius: 0;
        max-width: none;
      }

      .invoice-header {
        background: #667eea !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .items-table thead {
        background: #667eea !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .grand-total {
        background: #667eea !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .info-card,
      .totals-table,
      .notes-section,
      .invoice-footer {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    @page {
      margin: 1cm;
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <!-- Header -->
    <div class="invoice-header">
      <div class="header-grid">
        <div class="company-info">
          <div class="logo-container">
            <img src="${logoUrl}" class="brand-logo" alt="${siteName}" onerror="this.style.display='none'" />
            <div>
              <div class="company-name">${siteName}</div>
              <div class="company-tagline">Homeopathic Medicine & Consultations</div>
            </div>
          </div>
          <div class="company-address">
            ${companyAddress}<br/>
            ${supportPhone}<br/>
            ${supportEmail}
            ${taxNumber ? `<br/>${taxName} No: ${taxNumber}` : ''}
          </div>
        </div>
        <div class="invoice-meta">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-details">
            <div class="invoice-detail-row">
              <span class="detail-label">Invoice No:</span>
              <span class="detail-value">${invoiceNumber}</span>
            </div>
            <div class="invoice-detail-row">
              <span class="detail-label">Order ID:</span>
              <span class="detail-value">#${order._id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="invoice-detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${invoiceDate}</span>
            </div>
            <div class="invoice-detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${invoiceTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="invoice-body">
      <!-- Customer & Payment Info -->
      <div class="info-grid">
        <div class="info-card">
          <div class="info-card-title">Bill To</div>
          ${order.shippingDetails ? `
            <div class="customer-name">${order.shippingDetails.fullName}</div>
            <div class="address-line">
              ${order.shippingDetails.addressLine1}<br/>
              ${order.shippingDetails.addressLine2 ? order.shippingDetails.addressLine2 + '<br/>' : ''}
              ${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zipCode}<br/>
              <strong>Phone:</strong> ${order.shippingDetails.phone}
            </div>
          ` : order.userName ? `
            <div class="customer-name">${order.userName}</div>
            <div class="address-line">
              ${order.shippingAddress || 'N/A'}<br/>
              <strong>Contact:</strong> ${order.userContact || 'N/A'}
            </div>
          ` : `
            <div class="address-line">${order.shippingAddress || 'N/A'}</div>
          `}
        </div>

        <div class="info-card">
          <div class="info-card-title">Payment Information</div>
          <div class="info-row">
            <span class="info-label">Payment Method:</span>
            <span class="info-value">${order.paymentMethod?.replace(/_/g, ' ')?.toUpperCase() || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Status:</span>
            <span class="info-value">${order.paymentStatus?.toUpperCase() || 'PENDING'}</span>
          </div>
          ${order.paymentId ? `
          <div class="info-row">
            <span class="info-label">Transaction ID:</span>
            <span class="info-value" style="font-size: 12px; word-break: break-all;">${order.paymentId}</span>
          </div>
          ` : ''}
          ${order.trackingNumber ? `
          <div class="info-row">
            <span class="info-label">Tracking No:</span>
            <span class="info-value">${order.trackingNumber}</span>
          </div>
          ` : ''}
          ${order.carrier ? `
          <div class="info-row">
            <span class="info-label">Carrier:</span>
            <span class="info-value">${order.carrier}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <div class="section">
        <div class="section-title">Order Items</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 45%;">Item Description</th>
              <th class="text-center" style="width: 15%;">Quantity</th>
              <th class="text-right" style="width: 20%;">Unit Price</th>
              <th class="text-right" style="width: 20%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item, index) => `
              <tr>
                <td>
                  <span class="item-name">${index + 1}. ${item.name}</span>
                  <span class="item-details">
                    ${item.potency ? item.potency : ''}${item.form ? ' • ' + item.form : ''}${item.packingSize ? ' • ' + item.packingSize : ''}
                  </span>
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${currencySymbol}${item.price.toFixed(2)}</td>
                <td class="text-right">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-table">
          <div class="total-row">
            <span class="total-label">Subtotal:</span>
            <span class="total-value">${currencySymbol}${subtotal.toFixed(2)}</span>
          </div>
          ${taxEnabled ? `
          <div class="total-row">
            <span class="total-label">
              ${taxName} (${taxRate}%):
              ${taxNumber ? `<span class="tax-badge">${taxNumber}</span>` : ''}
            </span>
            <span class="total-value">${currencySymbol}${taxAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="total-row">
            <span class="total-label">Shipping:</span>
            <span class="total-value">${currencySymbol}0.00</span>
          </div>
          <div class="total-row grand-total">
            <span class="total-label">GRAND TOTAL:</span>
            <span class="total-value">${currencySymbol}${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="notes-section">
        <div class="notes-title">Important Notes:</div>
        <div class="notes-content">
          • This is a computer-generated invoice and does not require a signature.<br/>
          • Please verify all details. Contact us immediately if you notice any discrepancies.<br/>
          • For returns and refunds, please refer to our returns policy on our website.<br/>
          • Keep this invoice for your records and warranty claims.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-message">Thank you for your business!</div>
      <div class="footer-divider"></div>
      <div class="footer-contact">For any questions or concerns, please contact us:</div>
      <div class="footer-contact"><strong>Email:</strong> ${supportEmail} | <strong>Phone:</strong> ${supportPhone}</div>
      <div class="footer-contact" style="margin-top: 16px; font-size: 12px; opacity: 0.7;">
        ${siteName} - Your trusted partner in Homeopathic healthcare
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Opens the invoice in a new window for printing
 * @param htmlContent - The HTML content of the invoice
 */
export function printInvoice(htmlContent: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

/**
 * Downloads the invoice as an HTML file
 * @param htmlContent - The HTML content of the invoice
 * @param invoiceNumber - The invoice number for the filename
 */
export function downloadInvoice(htmlContent: string, invoiceNumber: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${invoiceNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
