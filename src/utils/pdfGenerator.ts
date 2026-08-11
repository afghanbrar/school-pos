import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction, SchoolSettings } from '../types';

export const generateInvoicePDF = (transaction: Transaction, settings: SchoolSettings) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = settings.currency_symbol || 'PKR';
  const primaryColor = [22, 101, 52];
  const darkTextColor = [30, 41, 59];
  const lightBgColor = [241, 245, 249];

  // 1. Header Banner Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Attempt adding Logo Image to PDF Header Banner if available
  let titleX = 14;
  if (settings.logo_url) {
    try {
      doc.addImage(settings.logo_url, 'PNG', 12, 6, 24, 24);
      titleX = 40;
    } catch {
      // Fallback if image format not directly supported by jsPDF addImage
      titleX = 14;
    }
  }

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(settings.name.toUpperCase(), titleX, 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text(settings.tagline, titleX, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${settings.address} | Tel: ${settings.phone} | Email: ${settings.email}`, titleX, 28);

  // 2. Receipt Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(145, 8, 50, 20, 2, 2, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TAX INVOICE', 170, 16, { align: 'center' });
  doc.setFontSize(9);
  doc.text(transaction.invoice_number, 170, 23, { align: 'center' });

  // 3. Invoice & Buyer Information Block
  let currentY = 44;

  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.roundedRect(14, currentY, 182, 34, 2, 2, 'F');

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILLED TO / BUYER DETAILS:', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (transaction.buyer_type === 'student') {
    doc.text(`Student Name: ${transaction.buyer_name}`, 18, currentY + 14);
    doc.text(`Roll Number:  ${transaction.student_roll_no || 'N/A'}`, 18, currentY + 20);
    doc.text(`Class / Grade: ${transaction.student_class || 'N/A'}`, 18, currentY + 26);
  } else {
    doc.text(`School / Org:   ${transaction.buyer_name}`, 18, currentY + 14);
    doc.text(`Buyer Type:    Bulk External Purchase`, 18, currentY + 20);
    doc.text(`Notes / Ref:   ${transaction.notes || 'N/A'}`, 18, currentY + 26);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION DETAILS:', 115, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.text(`Date & Time:  ${new Date(transaction.created_at).toLocaleString()}`, 115, currentY + 14);
  doc.text(`Payment Type: ${transaction.payment_method.toUpperCase().replace('_', ' ')}`, 115, currentY + 20);
  doc.text(`Cashier Staff: ${transaction.staff_name || 'Staff Member'}`, 115, currentY + 26);

  currentY += 40;

  // 4. Line Items Table
  const tableRows = transaction.items.map((item, index) => [
    (index + 1).toString(),
    item.product_name,
    `${item.size || 'Std'} / ${item.color || 'N/A'}`,
    item.quantity.toString(),
    `${currency} ${item.unit_price.toLocaleString()}`,
    `${currency} ${item.total_price.toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Item Name & Description', 'Size / Variant', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 72 },
      2: { cellWidth: 35 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error - autoTable attaches lastAutoTable property to doc
  currentY = doc.lastAutoTable.finalY + 8;

  const summaryBoxWidth = 85;
  const summaryBoxX = 111;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryBoxX, currentY, summaryBoxWidth, 42, 2, 2, 'FD');

  let textY = currentY + 8;
  doc.setFontSize(9);

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryBoxX + 6, textY);
  doc.text(`${currency} ${transaction.total_amount.toLocaleString()}`, summaryBoxX + summaryBoxWidth - 6, textY, { align: 'right' });

  textY += 6;
  doc.text('Discount:', summaryBoxX + 6, textY);
  doc.text(`- ${currency} ${transaction.discount.toLocaleString()}`, summaryBoxX + summaryBoxWidth - 6, textY, { align: 'right' });

  textY += 3;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryBoxX + 4, textY, summaryBoxX + summaryBoxWidth - 4, textY);

  textY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Grand Total:', summaryBoxX + 6, textY);
  doc.text(`${currency} ${(transaction.total_amount - transaction.discount).toLocaleString()}`, summaryBoxX + summaryBoxWidth - 6, textY, { align: 'right' });

  textY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Amount Received:', summaryBoxX + 6, textY);
  doc.text(`${currency} ${transaction.paid_amount.toLocaleString()}`, summaryBoxX + summaryBoxWidth - 6, textY, { align: 'right' });

  textY += 7;
  doc.setFont('helvetica', 'bold');
  if (transaction.pending_amount > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text('PENDING DUES:', summaryBoxX + 6, textY);
    doc.text(`${currency} ${transaction.pending_amount.toLocaleString()}`, summaryBoxX + summaryBoxWidth - 6, textY, { align: 'right' });
  } else {
    doc.setTextColor(22, 163, 74);
    doc.text('PAYMENT STATUS:', summaryBoxX + 6, textY);
    doc.text('PAID IN FULL', summaryBoxX + summaryBoxWidth - 6, textY, { align: 'right' });
  }

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Terms & Conditions:', 14, currentY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('1. Returns/Exchanges permitted within 7 days with original invoice.', 14, currentY + 14);
  doc.text('2. Textbooks once marked or written on cannot be returned.', 14, currentY + 19);
  doc.text('3. For pending dues, please clear balance within 14 business days.', 14, currentY + 24);

  doc.line(14, currentY + 38, 65, currentY + 38);
  doc.setFontSize(8);
  doc.text('Authorized Cashier Signature', 14, currentY + 42);

  // Mandatory Footer Branding Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Developed by Ai Mobiles & Technology 0311-7260898', 105, 287, { align: 'center' });

  const filename = `${transaction.invoice_number}_${transaction.buyer_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
};
