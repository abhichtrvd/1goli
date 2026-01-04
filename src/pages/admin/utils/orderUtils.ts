export const generateInvoiceHtml = (order: any) => {
  return `
    <html>
      <head>
        <title>Invoice #${order._id.slice(-6)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.5; padding: 0; margin: 0; background: #fff; }
          .invoice-container { max-width: 800px; margin: 40px auto; padding: 40px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
          .brand-name { font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.025em; }
          .brand-subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
          .invoice-title { font-size: 30px; font-weight: 800; color: #111827; text-align: right; letter-spacing: -0.025em; }
          .meta-group { margin-top: 8px; text-align: right; font-size: 14px; color: #4b5563; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px; }
          .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 12px; }
          .address-block { font-size: 14px; color: #374151; line-height: 1.6; }
          .address-name { font-weight: 600; color: #111827; margin-bottom: 4px; display: block; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          th { text-align: left; padding: 12px 16px; background: #f9fafb; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; }
          td { padding: 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; }
          tr:last-child td { border-bottom: none; }
          .item-name { font-weight: 500; color: #111827; display: block; margin-bottom: 2px; }
          .item-meta { font-size: 12px; color: #6b7280; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals-wrapper { display: flex; justify-content: flex-end; }
          .totals-table { width: 320px; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; color: #4b5563; }
          .grand-total { font-weight: 700; font-size: 18px; color: #111827; border-top: 2px solid #e5e7eb; margin-top: 12px; padding-top: 16px; }
          .footer { margin-top: 64px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 13px; color: #6b7280; }
          @media print { 
            body { background: #fff; }
            .invoice-container { margin: 0; border: none; box-shadow: none; padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div>
              <div class="brand-name">1goli Pharmacy</div>
              <div class="brand-subtitle">Homeopathic Medicine & Consultations</div>
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="meta-group">
                <div>Order #${order._id.slice(-6)}</div>
                <div>Date: ${new Date(order._creationTime).toLocaleDateString()}</div>
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
                  <div style="margin-top: 8px;">Phone: ${order.shippingDetails.phone}</div>
                ` : order.shippingAddress}
              </div>
            </div>
            <div>
              <div class="section-label">Payment Details</div>
              <div class="address-block">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #6b7280;">Method:</span>
                  <span style="font-weight: 500; text-transform: capitalize;">${order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #6b7280;">Status:</span>
                  <span style="font-weight: 500; text-transform: capitalize;">${order.paymentStatus || 'Pending'}</span>
                </div>
                ${order.paymentId ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #6b7280;">Transaction ID:</span>
                  <span style="font-family: monospace;">${order.paymentId}</span>
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
