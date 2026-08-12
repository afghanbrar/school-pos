import type { Transaction, CashHandover, SchoolSettings } from '../types';

/**
 * Direct print utility that renders clean printable HTML into a hidden iframe
 * ensuring direct, flawless A4 / slip printing without modal backdrop artifacts or blank sheets.
 */
export function printDocument(htmlBody: string, documentTitle = 'School POS Document') {
  // Remove any existing print iframes
  const existingFrame = document.getElementById('pos-print-iframe');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'pos-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.error('Failed to create printing iframe');
    return;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${documentTitle}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        body {
          background: #ffffff;
          color: #0f172a;
          padding: 10px;
          font-size: 13px;
          line-height: 1.4;
        }
        .container {
          max-width: 780px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .logo {
          max-height: 60px;
          max-width: 140px;
          margin-bottom: 6px;
          object-fit: contain;
        }
        .school-name {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tagline {
          font-size: 11px;
          color: #475569;
          font-weight: 500;
          margin-top: 2px;
        }
        .contact-info {
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
        }
        .doc-title-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 4px 14px;
          background: #0f172a;
          color: #ffffff;
          font-weight: 800;
          font-size: 12px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }
        .meta-item {
          font-size: 12px;
        }
        .meta-item strong {
          color: #1e293b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          text-align: left;
        }
        td {
          border: 1px solid #e2e8f0;
          padding: 7px 10px;
          font-size: 12px;
          color: #1e293b;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .total-box {
          margin-left: auto;
          width: 320px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 12px;
        }
        .grand-total {
          border-top: 2px solid #0f172a;
          margin-top: 6px;
          padding-top: 6px;
          font-weight: 800;
          font-size: 14px;
          color: #0f172a;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 10px;
        }
        .sig-box {
          width: 200px;
          text-align: center;
          border-top: 1px solid #94a3b8;
          padding-top: 6px;
          font-size: 11px;
          color: #475569;
          font-weight: 600;
        }
        .branding-footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          border-top: 1px dashed #cbd5e1;
          padding-top: 8px;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${htmlBody}
        <div class="branding-footer">
          developed by ai mobiles and technology • +92 311 7260898
        </div>
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  // Trigger print once content has rendered
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
    }, 2000);
  }, 300);
}

/**
 * Print Cash Handover Voucher
 */
export function printCashHandoverVoucher(handover: CashHandover, settings: SchoolSettings) {
  const currency = settings.currency_symbol || 'PKR';
  const logoHtml = settings.logo_url 
    ? `<img src="${settings.logo_url}" class="logo" alt="Logo" />` 
    : '';

  const html = `
    <div class="header">
      ${logoHtml}
      <div class="school-name">${settings.name}</div>
      <div class="tagline">${settings.tagline || ''}</div>
      <div class="contact-info">${settings.address || ''} | Phone: ${settings.phone || ''}</div>
      <div class="doc-title-badge">CASH HANDOVER ACKNOWLEDGMENT VOUCHER</div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-item"><strong>Voucher Number:</strong> <span class="font-mono">${handover.handover_code}</span></div>
        <div class="meta-item"><strong>Staff Submitter:</strong> ${handover.staff_name}</div>
        <div class="meta-item"><strong>Handover Status:</strong> <span style="font-weight: bold; color: ${handover.status === 'approved' ? '#059669' : '#d97706'}">${handover.status.toUpperCase()}</span></div>
      </div>
      <div>
        <div class="meta-item"><strong>Submission Date:</strong> ${new Date(handover.submitted_at).toLocaleDateString()} ${new Date(handover.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="meta-item"><strong>Handover Period:</strong> ${new Date(handover.period_start).toLocaleDateString()} to ${new Date(handover.period_end).toLocaleDateString()}</div>
        <div class="meta-item"><strong>CEO Acknowledgment:</strong> ${handover.acknowledged_by || 'Pending Review'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Financial Ledger Category</th>
          <th class="text-right">Amount (${currency})</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Gross Cash Sales Revenue Collected</td>
          <td class="text-right font-mono">${currency} ${handover.gross_sales_cash.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Digital Sales Inflows (Directly Banked)</td>
          <td class="text-right font-mono">${currency} ${handover.gross_sales_digital.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="color: #dc2626;">Deducted School Operating Expenses (Cash)</td>
          <td class="text-right font-mono" style="color: #dc2626;">- ${currency} ${handover.total_expenses_deducted.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-row">
        <span>Total Gross Sales:</span>
        <span class="font-mono">${currency} ${handover.total_gross_sales.toLocaleString()}</span>
      </div>
      <div class="total-row" style="color: #dc2626;">
        <span>Staff Deducted Expenses:</span>
        <span class="font-mono">- ${currency} ${handover.total_expenses_deducted.toLocaleString()}</span>
      </div>
      <div class="total-row grand-total" style="color: #059669;">
        <span>NET PHYSICAL CASH HANDOVER:</span>
        <span class="font-mono">${currency} ${handover.net_cash_submitted.toLocaleString()}</span>
      </div>
    </div>

    ${handover.notes ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; font-size: 11px; margin-bottom: 20px;">
        <strong>Staff Submission Remarks:</strong> ${handover.notes}
      </div>
    ` : ''}

    ${handover.ceo_notes ? `
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; border-radius: 6px; font-size: 11px; margin-bottom: 20px; color: #065f46;">
        <strong>CEO Vault Audit Note:</strong> ${handover.ceo_notes} (Approved on ${new Date(handover.acknowledged_at || '').toLocaleString()})
      </div>
    ` : ''}

    <div class="signatures">
      <div class="sig-box">
        Staff Cashier Signature<br/>
        <span style="font-weight: normal; font-size: 10px;">${handover.staff_name}</span>
      </div>
      <div class="sig-box">
        CEO / Principal Signature<br/>
        <span style="font-weight: normal; font-size: 10px;">${handover.acknowledged_by || 'Chief Executive Officer'}</span>
      </div>
    </div>
  `;

  printDocument(html, `Handover_Voucher_${handover.handover_code}`);
}

/**
 * Print POS Sales Invoice Receipt
 */
export function printPosInvoiceReceipt(transaction: Transaction, settings: SchoolSettings) {
  const currency = settings.currency_symbol || 'PKR';
  const logoHtml = settings.logo_url 
    ? `<img src="${settings.logo_url}" class="logo" alt="Logo" />` 
    : '';

  const isStudent = transaction.buyer_type === 'student';

  const rows = transaction.items.map((item, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong>${item.product_name}</strong>${item.size ? ` (Size: ${item.size})` : ''}${item.color ? ` (${item.color})` : ''}</td>
      <td class="text-center font-mono">${item.quantity}</td>
      <td class="text-right font-mono">${currency} ${item.unit_price.toLocaleString()}</td>
      <td class="text-right font-mono">${currency} ${item.total_price.toLocaleString()}</td>
    </tr>
  `).join('');

  const grandTotal = transaction.total_amount - transaction.discount;

  const html = `
    <div class="header">
      ${logoHtml}
      <div class="school-name">${settings.name}</div>
      <div class="tagline">${settings.tagline || ''}</div>
      <div class="contact-info">${settings.address || ''} | Tel: ${settings.phone || ''}</div>
      <div class="doc-title-badge">SALES INVOICE & CASH RECEIPT</div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-item"><strong>Invoice No:</strong> <span class="font-mono">${transaction.invoice_number}</span></div>
        <div class="meta-item"><strong>Customer / Student:</strong> ${transaction.buyer_name}</div>
        ${isStudent ? `
          <div class="meta-item"><strong>Roll No / Class:</strong> ${transaction.student_roll_no || 'N/A'} (${transaction.student_class || 'N/A'})</div>
        ` : `
          <div class="meta-item"><strong>School Name:</strong> ${transaction.school_name || 'External'}</div>
        `}
      </div>
      <div>
        <div class="meta-item"><strong>Date:</strong> ${new Date(transaction.created_at).toLocaleDateString()} ${new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div class="meta-item"><strong>Payment Channel:</strong> <span style="text-transform: uppercase; font-weight: bold;">${transaction.payment_method.replace('_', ' ')}</span></div>
        <div class="meta-item"><strong>Cashier Staff:</strong> ${transaction.staff_name || 'Staff Terminal'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30px;" class="text-center">#</th>
          <th>Item Description</th>
          <th class="text-center" style="width: 60px;">Qty</th>
          <th class="text-right" style="width: 90px;">Price</th>
          <th class="text-right" style="width: 100px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-row">
        <span>Subtotal:</span>
        <span class="font-mono">${currency} ${transaction.total_amount.toLocaleString()}</span>
      </div>
      ${transaction.discount > 0 ? `
        <div class="total-row" style="color: #dc2626;">
          <span>Discount:</span>
          <span class="font-mono">- ${currency} ${transaction.discount.toLocaleString()}</span>
        </div>
      ` : ''}
      <div class="total-row grand-total">
        <span>Grand Total:</span>
        <span class="font-mono">${currency} ${grandTotal.toLocaleString()}</span>
      </div>
      <div class="total-row" style="color: #059669; font-weight: bold;">
        <span>Amount Paid:</span>
        <span class="font-mono">${currency} ${transaction.paid_amount.toLocaleString()}</span>
      </div>
      ${transaction.pending_amount > 0 ? `
        <div class="total-row" style="color: #dc2626; font-weight: bold; border-top: 1px dashed #cbd5e1; margin-top: 4px; padding-top: 4px;">
          <span>Pending Dues:</span>
          <span class="font-mono">${currency} ${transaction.pending_amount.toLocaleString()}</span>
        </div>
      ` : `
        <div class="total-row" style="color: #059669; font-size: 11px; font-weight: bold;">
          <span>Payment Status:</span>
          <span>PAID IN FULL</span>
        </div>
      `}
    </div>

    <div class="signatures">
      <div class="sig-box">
        Customer Signature
      </div>
      <div class="sig-box">
        Authorized Issuer Signature
      </div>
    </div>
  `;

  printDocument(html, `Invoice_${transaction.invoice_number}`);
}
