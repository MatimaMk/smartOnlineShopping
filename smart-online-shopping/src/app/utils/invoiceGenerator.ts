import { Order, Product } from "@/app/types";
import { formatPrice } from "./currency";

/**
 * Generates an HTML invoice for an order
 */
export function generateInvoiceHTML(
  order: Order,
  products: Product[],
  customerName: string,
  customerEmail: string
): string {
  const orderDate = new Date(order.date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const orderItems = order.items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return "";

      const itemTotal = product.price * item.quantity;
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #E8EAED;">${product.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E8EAED; text-align: center;">${item.size}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E8EAED; text-align: center;">${item.color}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E8EAED; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E8EAED; text-align: right;">${formatPrice(product.price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E8EAED; text-align: right; font-weight: 600;">${formatPrice(itemTotal)}</td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${order.id.slice(0, 8)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #2D3436;
      background: #F8F9FA;
      padding: 40px 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }
    .invoice-header {
      background: linear-gradient(135deg, #FF6B9D 0%, #C44569 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .invoice-header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    .invoice-header p {
      font-size: 1.1rem;
      opacity: 0.95;
    }
    .invoice-body {
      padding: 40px;
    }
    .invoice-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #E8EAED;
    }
    .info-section h3 {
      color: #FF6B9D;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .info-section p {
      margin: 5px 0;
      color: #636E72;
    }
    .info-section .highlight {
      color: #2D3436;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: linear-gradient(135deg, #FFF5F7 0%, #F8F9FA 100%);
    }
    thead th {
      padding: 15px 12px;
      text-align: left;
      font-weight: 600;
      color: #2D3436;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    tbody tr:hover {
      background: #FFF5F7;
    }
    .totals {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: 20px;
      background: linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%);
      border-radius: 12px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      width: 300px;
      padding: 10px 0;
    }
    .total-row.grand-total {
      border-top: 2px solid #FF6B9D;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 1.5rem;
      font-weight: 700;
      color: #FF6B9D;
    }
    .invoice-footer {
      background: #F8F9FA;
      padding: 30px 40px;
      text-align: center;
      color: #636E72;
      font-size: 0.9rem;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-completed {
      background: #00D9A3;
      color: white;
    }
    .status-pending {
      background: #FFB74D;
      color: white;
    }
    .thank-you {
      margin-top: 20px;
      font-size: 1.2rem;
      color: #FF6B9D;
      font-weight: 600;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .invoice-container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <h1>✨ Invoice</h1>
      <p>Smart Online Shopping - Your Style, Elevated</p>
    </div>

    <!-- Body -->
    <div class="invoice-body">
      <!-- Invoice Info -->
      <div class="invoice-info">
        <div class="info-section">
          <h3>Invoice Details</h3>
          <p><span class="highlight">Invoice #:</span> ${order.id.slice(0, 8).toUpperCase()}</p>
          <p><span class="highlight">Date:</span> ${orderDate}</p>
          <p><span class="highlight">Status:</span> <span class="status-badge status-${order.status}">${order.status}</span></p>
          <p><span class="highlight">Payment Method:</span> ${order.paymentMethod}</p>
        </div>

        <div class="info-section">
          <h3>Customer Information</h3>
          <p class="highlight">${customerName}</p>
          <p>${customerEmail}</p>
          <p style="margin-top: 10px;"><span class="highlight">Shipping Address:</span></p>
          <p style="white-space: pre-line;">${order.shippingAddress}</p>
        </div>
      </div>

      <!-- Order Items -->
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Size</th>
            <th style="text-align: center;">Color</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${orderItems}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatPrice(order.totalAmount)}</span>
        </div>
        <div class="total-row">
          <span>Shipping:</span>
          <span>FREE</span>
        </div>
        <div class="total-row grand-total">
          <span>Grand Total:</span>
          <span>${formatPrice(order.totalAmount)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <p class="thank-you">Thank you for shopping with us! 💖</p>
      <p style="margin-top: 15px;">
        For any questions about this invoice, please contact us at<br>
        <strong>support@smartshopping.co.za</strong> or call <strong>+27 11 123 4567</strong>
      </p>
      <p style="margin-top: 20px; font-size: 0.8rem; color: #95A5A6;">
        Smart Online Shopping (Pty) Ltd | Registration: 2024/123456/07<br>
        123 Fashion Street, Johannesburg, 2000, South Africa
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Downloads the invoice as a PDF (using browser print)
 */
export function downloadInvoiceAsPDF(
  order: Order,
  products: Product[],
  customerName: string,
  customerEmail: string
): void {
  const invoiceHTML = generateInvoiceHTML(order, products, customerName, customerEmail);

  // Create a new window with the invoice
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
}

/**
 * Opens invoice in new tab for viewing
 */
export function viewInvoice(
  order: Order,
  products: Product[],
  customerName: string,
  customerEmail: string
): void {
  const invoiceHTML = generateInvoiceHTML(order, products, customerName, customerEmail);

  const viewWindow = window.open("", "_blank");
  if (viewWindow) {
    viewWindow.document.write(invoiceHTML);
    viewWindow.document.close();
  }
}
