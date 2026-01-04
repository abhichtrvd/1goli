import { parseCSVLine } from "./csvHelpers";

export const parseOrderCSV = (text: string) => {
  const lines = text.split(/\r\n|\n/); // Handle both line endings
  const ordersToImport = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const row = parseCSVLine(lines[i]);

    // Support both new format (7 cols) and old format (6 cols)
    // New: External ID, Email, Address, Payment, Status, Total, Items
    // Old: Email, Address, Payment, Status, Total, Items
    
    let externalId, email, shippingAddress, paymentMethod, status, total, itemsString;

    if (row.length >= 7) {
       externalId = row[0];
       email = row[1];
       shippingAddress = row[2];
       paymentMethod = row[3];
       status = row[4];
       total = parseFloat(row[5]);
       itemsString = row[6];
    } else if (row.length >= 6) {
       externalId = undefined;
       email = row[0];
       shippingAddress = row[1];
       paymentMethod = row[2];
       status = row[3];
       total = parseFloat(row[4]);
       itemsString = row[5];
    } else {
      continue;
    }

    // Parse items string: "Name:SKU:Qty:Price; Name2:SKU2:Qty2:Price2"
    // Backward compatibility: "Name:Qty:Price" (3 parts) vs "Name:SKU:Qty:Price" (4 parts)
    const items = itemsString.split(';').map(itemStr => {
      const parts = itemStr.split(':').map(p => p.trim());
      
      if (parts.length === 4) {
        // New format with SKU
        return {
          productName: parts[0],
          sku: parts[1] || undefined,
          quantity: parseInt(parts[2]) || 1,
          price: parseFloat(parts[3]) || 0
        };
      } else if (parts.length === 3) {
        // Old format without SKU
        return {
          productName: parts[0],
          sku: undefined,
          quantity: parseInt(parts[1]) || 1,
          price: parseFloat(parts[2]) || 0
        };
      }
      return null;
    }).filter(item => item !== null);

    if (email && items.length > 0) {
      ordersToImport.push({
        externalId: externalId || undefined,
        email,
        shippingAddress,
        paymentMethod,
        status,
        total,
        items: items as any[],
        date: new Date().toISOString()
      });
    }
  }
  return ordersToImport;
};

export const generateInvoiceHtml = (order: any) => {
  const logoUrl = window.location.origin + '/logo.png';
  
  return `
    <html>
      <head>
        <title>Invoice #${order._id.slice(-6)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.5; padding: 0; margin: 0; background: #fff; }
          .invoice-container { max-width: 800px; margin: 40px auto; padding: 48px; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 12px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #f3f4f6; }
          .brand-logo { height: 40px; margin-bottom: 12px; }
          .brand-name { font-size: 28px; font-weight: 800; color: #111827; letter-spacing: -0.025em; }
          .brand-subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; font-weight: 500; }
          .invoice-title { font-size: 36px; font-weight: 800; color: #e5e7eb; text-align: right; letter-spacing: -0.025em; line-height: 1; }
          .meta-group { margin-top: 12px; text-align: right; font-size: 14px; color: #4b5563; }
          .meta-item { display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 4px; }
          .meta-label { font-weight: 600; color: #9ca3af; }
          .meta-value { font-weight: 600; color: #111827; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px; }
          .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em; margin-bottom: 12px; }
          .address-block { font-size: 14px; color: #374151; line-height: 1.6; background: #f9fafb; padding: 16px; border-radius: 8px; }
          .address-name { font-weight: 700; color: #111827; margin-bottom: 4px; display: block; font-size: 15px; }
          table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 32px; }
          th { text-align: left; padding: 12px 16px; background: #f9fafb; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
          th:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; border-left: 1px solid #e5e7eb; }
          th:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-right: 1px solid #e5e7eb; }
          td { padding: 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; }
          tr:last-child td { border-bottom: none; }
          .item-name { font-weight: 600; color: #111827; display: block; margin-bottom: 2px; }
          .item-meta { font-size: 12px; color: #6b7280; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals-wrapper { display: flex; justify-content: flex-end; }
          .totals-table { width: 320px; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; color: #4b5563; }
          .grand-total { font-weight: 800; font-size: 20px; color: #111827; border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 16px; }
          .footer { margin-top: 64px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #9ca3af; }
          @media print { 
            body { background: #fff; }
            .invoice-container { margin: 0; border: none; box-shadow: none; padding: 0; max-width: none; }
            .address-block { background: none; padding: 0; }
            th { background: #fff; border: 1px solid #e5e7eb; border-left: none; border-right: none; }
            th:first-child { border-left: none; }
            th:last-child { border-right: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div>
              <img src="${logoUrl}" class="brand-logo" alt="1goli" onerror="this.style.display='none'" />
              <div class="brand-name">1goli Pharmacy</div>
              <div class="brand-subtitle">Homeopathic Medicine & Consultations</div>
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="meta-group">
                <div class="meta-item">
                  <span class="meta-label">Order #</span>
                  <span class="meta-value">${order._id.slice(-6)}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Date</span>
                  <span class="meta-value">${new Date(order._creationTime).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="grid">
            <div>
              <div class="section-label">Bill To</div>
              <div class="address-block">
                ${order.shippingDetails ? `
                  <span class="address-name">${order.shippingDetails.fullName}</span>
                  ${order.shippingDetails.addressLine1}<br/>
                  ${order.shippingDetails.addressLine2 ? order.shippingDetails.addressLine2 + '<br/>' : ''}
                  ${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zipCode}<br/>
                  <div style="margin-top: 8px; color: #6b7280;">Phone: ${order.shippingDetails.phone}</div>
                ` : order.shippingAddress}
              </div>
            </div>
            <div>
              <div class="section-label">Payment Details</div>
              <div class="address-block">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #6b7280;">Method:</span>
                  <span style="font-weight: 600; text-transform: capitalize; color: #111827;">${order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #6b7280;">Status:</span>
                  <span style="font-weight: 600; text-transform: capitalize; color: #111827;">${order.paymentStatus || 'Pending'}</span>
                </div>
                ${order.paymentId ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Transaction ID:</span>
                  <span style="font-family: monospace; background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${order.paymentId}</span>
                </div>` : ''}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Item</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any) => `
                <tr>
                  <td>
                    <span class="item-name">${item.name}</span>
                    <span class="item-meta">${item.potency} • ${item.form}${item.packingSize ? ` • ${item.packingSize}` : ''}</span>
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">₹${item.price.toFixed(2)}</td>
                  <td class="text-right">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-wrapper">
            <div class="totals-table">
              <div class="total-row">
                <span>Subtotal</span>
                <span>₹${order.total.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Shipping</span>
                <span>₹0.00</span>
              </div>
              <div class="total-row grand-total">
                <span>Total</span>
                <span>₹${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>For any questions, please contact support@1goli.com</p>
          </div>
        </div>
        
        <script>
          window.onload = () => { window.print(); }
        </script>
      </body>
    </html>
  `;
};