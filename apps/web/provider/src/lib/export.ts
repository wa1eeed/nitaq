'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (row: T) => string | number;
}

export interface ExportHeaderInfo {
  /** Brand title at top of the PDF, e.g. "نقلة لوجيستك". */
  brand: string;
  /** Sub-title — usually the company name. */
  subtitle?: string;
  /** Report title — e.g. "كشف الحساب". */
  reportTitle: string;
}

export interface ExportFooterInfo {
  openingBalance?: number;
  closingBalance?: number;
  totalCredit?: number;
  totalDebit?: number;
}

const SAR = (n: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n) + ' SAR';

/**
 * Export tabular data to a PDF.
 *
 * Note: jsPDF doesn't bundle Arabic-shaping fonts out of the box, so headings
 * are written in English with the Arabic equivalent in parentheses where it
 * makes sense. Data cells render fine for Latin/digits content (the most
 * common case for financial statements).
 */
export function exportPDF<T>({
  filename, header, footer, columns, rows,
}: {
  filename: string;
  header: ExportHeaderInfo;
  footer?: ExportFooterInfo;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(header.brand, 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(header.reportTitle, 14, 25);

  if (header.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(header.subtitle, 14, 31);
    doc.setTextColor(0);
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, 270, 18, { align: 'right' });
  doc.setTextColor(0);

  // Table
  autoTable(doc, {
    head: [columns.map((c) => c.label)],
    body: rows.map((r) =>
      columns.map((c) => (c.format ? c.format(r) : ((r as any)[c.key] ?? '—')).toString()),
    ),
    startY: 38,
    theme: 'striped',
    headStyles: { fillColor: [10, 61, 58], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 247, 246] },
  });

  // Footer summary
  if (footer) {
    const finalY = (doc as any).lastAutoTable?.finalY ?? 100;
    doc.setFontSize(10);
    let y = finalY + 10;
    if (footer.openingBalance !== undefined) {
      doc.text(`Opening balance: ${SAR(footer.openingBalance)}`, 14, y); y += 6;
    }
    if (footer.totalCredit !== undefined) {
      doc.setTextColor(5, 150, 105);
      doc.text(`Total credit: + ${SAR(footer.totalCredit)}`, 14, y); y += 6;
    }
    if (footer.totalDebit !== undefined) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Total debit: - ${SAR(footer.totalDebit)}`, 14, y); y += 6;
    }
    doc.setTextColor(0);
    if (footer.closingBalance !== undefined) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Closing balance: ${SAR(footer.closingBalance)}`, 14, y);
    }
  }

  doc.save(filename);
}

export function exportXLSX<T>({
  filename, sheetName = 'Sheet1', columns, rows,
}: {
  filename: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}) {
  const data = rows.map((r) => {
    const obj: Record<string, any> = {};
    for (const c of columns) {
      obj[c.label] = c.format ? c.format(r) : (r as any)[c.key];
    }
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  // Column widths — approximate
  ws['!cols'] = columns.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
