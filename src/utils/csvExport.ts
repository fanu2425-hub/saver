import { MoneyEntry } from '../types.ts';

/**
 * Escapes a cell value for standard RFC 4180 CSV format.
 */
function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) {
    return '""';
  }
  const str = String(val);
  // If the cell contains quotes, commas, or newlines, quote it and escape quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Formats a timestamp into YYYY-MM-DD HH:mm:ss.
 */
function formatDateTime(timestamp?: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Exports all given transaction history entries to a formatted CSV file and triggers a browser download.
 */
export function exportEntriesToCsv(entries: MoneyEntry[], filenamePrefix = 'money-pocket-transactions'): boolean {
  if (!entries || entries.length === 0) {
    return false;
  }

  const headers = [
    'Date & Time',
    'Type',
    'Description / Item',
    'Customer',
    'Quantity',
    'Unit Price (QAR)',
    'Amount (QAR)',
    'Net Cashflow (QAR)',
    'Timestamp (ms)'
  ];

  const rows = entries.map((entry) => {
    const isExpense = entry.type === 'restock';
    const typeLabel =
      entry.type === 'sale'
        ? 'Sale'
        : entry.type === 'restock'
        ? 'Restock (Expense)'
        : 'Other Income';

    const unitPrice =
      entry.qty > 0 ? (entry.amount / entry.qty).toFixed(2) : entry.amount.toFixed(2);
    const netCashflow = isExpense
      ? (-Math.abs(entry.amount)).toFixed(2)
      : Math.abs(entry.amount).toFixed(2);

    return [
      escapeCsvCell(formatDateTime(entry.createdAt)),
      escapeCsvCell(typeLabel),
      escapeCsvCell(entry.note || ''),
      escapeCsvCell(entry.customer || ''),
      escapeCsvCell(entry.qty ?? 0),
      escapeCsvCell(unitPrice),
      escapeCsvCell(entry.amount.toFixed(2)),
      escapeCsvCell(netCashflow),
      escapeCsvCell(entry.createdAt || '')
    ].join(',');
  });

  // Calculate summary totals row for external reporting
  const totalIn = entries
    .filter((e) => e.type !== 'restock')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = entries
    .filter((e) => e.type === 'restock')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const netTotal = totalIn - totalOut;

  const emptySummaryRow = ['""', '""', '""', '""', '""', '""', '""', '""', '""'].join(',');
  const summaryRow = [
    escapeCsvCell('TOTAL SUMMARY'),
    escapeCsvCell(`${entries.length} Transactions`),
    escapeCsvCell(`Total In: QAR ${totalIn.toFixed(2)} | Total Out: QAR ${totalOut.toFixed(2)}`),
    escapeCsvCell(''),
    escapeCsvCell(''),
    escapeCsvCell('Net Balance:'),
    escapeCsvCell(`QAR ${netTotal.toFixed(2)}`),
    escapeCsvCell(netTotal.toFixed(2)),
    escapeCsvCell('')
  ].join(',');

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel / Sheets compatibility
    [headers.join(','), ...rows, emptySummaryRow, summaryRow].join('\r\n');

  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}-${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return false;
  }
}
