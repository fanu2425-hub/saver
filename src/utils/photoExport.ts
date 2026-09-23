import { MoneyEntry } from '../types.ts';

/**
 * Formats date into readable string: e.g. "23 Sep 2026, 14:30"
 */
function formatDate(timestamp?: number): string {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Truncates text with ellipsis if it exceeds max width.
 */
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated ? truncated + '...' : '';
}

/**
 * Draws a rounded rectangle path.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Renders transactions to a high-resolution image (photo) and triggers download as PNG.
 */
export function exportEntriesToPhoto(
  entries: MoneyEntry[],
  filenamePrefix = 'money-pocket-history'
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!entries || entries.length === 0) {
      resolve(false);
      return;
    }

    try {
      const scale = 2; // 2x Retina resolution
      const width = 960;
      const rowHeight = 44;
      const headerHeight = 160;
      const statsHeight = 110;
      const tableHeaderHeight = 44;
      const footerHeight = 80;
      const padding = 36;

      const totalHeight =
        headerHeight + statsHeight + tableHeaderHeight + entries.length * rowHeight + footerHeight;

      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = totalHeight * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(false);
        return;
      }

      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = '#0b192e'; // Deep elegant navy
      ctx.fillRect(0, 0, width, totalHeight);

      // Card Container
      ctx.fillStyle = '#112240';
      roundRect(ctx, padding / 2, padding / 2, width - padding, totalHeight - padding, 20);
      ctx.fill();

      // Top decorative line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // App Title Badge
      let currentY = padding + 15;
      ctx.fillStyle = '#2563eb';
      roundRect(ctx, padding, currentY, 130, 28, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MONEY POCKET', padding + 65, currentY + 18);

      // Main Heading
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Financial History & Statement', padding, currentY + 62);

      // Date and Entry Count
      const nowStr = new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(
        `Generated on ${nowStr} · Total ${entries.length} Transaction${
          entries.length === 1 ? '' : 's'
        }`,
        padding,
        currentY + 86
      );

      // Summary Stats
      currentY += 105;
      const totalIn = entries
        .filter((e) => e.type !== 'restock')
        .reduce((sum, e) => sum + e.amount, 0);
      const totalOut = entries
        .filter((e) => e.type === 'restock')
        .reduce((sum, e) => sum + e.amount, 0);
      const profit = totalIn - totalOut;

      const cardWidth = (width - padding * 2 - 20) / 3;

      // Stat 1: Total Money In
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      roundRect(ctx, padding, currentY, cardWidth, 80, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#6ee7b7';
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('TOTAL MONEY IN', padding + 16, currentY + 28);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`+QAR ${totalIn.toFixed(2)}`, padding + 16, currentY + 58);

      // Stat 2: Total Money Out
      const card2X = padding + cardWidth + 10;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      roundRect(ctx, card2X, currentY, cardWidth, 80, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('TOTAL MONEY OUT', card2X + 16, currentY + 28);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`-QAR ${totalOut.toFixed(2)}`, card2X + 16, currentY + 58);

      // Stat 3: Net Profit
      const card3X = padding + (cardWidth + 10) * 2;
      const isProfitable = profit >= 0;
      ctx.fillStyle = isProfitable ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)';
      roundRect(ctx, card3X, currentY, cardWidth, 80, 12);
      ctx.fill();
      ctx.strokeStyle = isProfitable ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      ctx.stroke();

      ctx.fillStyle = isProfitable ? '#93c5fd' : '#fca5a5';
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('NET PROFIT / BALANCE', card3X + 16, currentY + 28);
      ctx.fillStyle = isProfitable ? '#38bdf8' : '#ef4444';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(
        `${profit >= 0 ? '+' : '-'}QAR ${Math.abs(profit).toFixed(2)}`,
        card3X + 16,
        currentY + 58
      );

      // Table Header
      currentY += 105;
      ctx.fillStyle = '#1e3a8a';
      roundRect(ctx, padding, currentY, width - padding * 2, tableHeaderHeight, 8);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';

      const colDateX = padding + 16;
      const colTypeX = padding + 155;
      const colItemX = padding + 265;
      const colCustomerX = padding + 520;
      const colQtyX = padding + 690;
      const colAmountX = width - padding - 16;

      ctx.fillText('DATE & TIME', colDateX, currentY + 26);
      ctx.fillText('TYPE', colTypeX, currentY + 26);
      ctx.fillText('ITEM / NOTE', colItemX, currentY + 26);
      ctx.fillText('CUSTOMER', colCustomerX, currentY + 26);
      ctx.fillText('QTY', colQtyX, currentY + 26);
      ctx.textAlign = 'right';
      ctx.fillText('AMOUNT (QAR)', colAmountX, currentY + 26);

      // Table Rows
      currentY += tableHeaderHeight;

      entries.forEach((entry, idx) => {
        const isRestock = entry.type === 'restock';
        const rowY = currentY + idx * rowHeight;

        // Alternating row background
        if (idx % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fillRect(padding, rowY, width - padding * 2, rowHeight);
        }

        // Row bottom divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.moveTo(padding, rowY + rowHeight);
        ctx.lineTo(width - padding, rowY + rowHeight);
        ctx.stroke();

        // Date
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(formatDate(entry.createdAt), colDateX, rowY + 26);

        // Type Badge
        const badgeBg = isRestock ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)';
        const badgeText = isRestock ? '#f87171' : '#34d399';
        const label = isRestock ? 'RESTOCK' : entry.type === 'sale' ? 'SALE' : 'INCOME';

        ctx.fillStyle = badgeBg;
        roundRect(ctx, colTypeX, rowY + 11, 75, 22, 6);
        ctx.fill();

        ctx.fillStyle = badgeText;
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, colTypeX + 37, rowY + 26);

        // Item / Note
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const noteText = truncateText(ctx, entry.note || '—', 230);
        ctx.fillText(noteText, colItemX, rowY + 26);

        // Customer
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const custText = truncateText(ctx, entry.customer || '—', 150);
        ctx.fillText(custText, colCustomerX, rowY + 26);

        // Qty
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(entry.qty ? `${entry.qty}` : '—', colQtyX, rowY + 26);

        // Amount
        ctx.textAlign = 'right';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        if (isRestock) {
          ctx.fillStyle = '#f87171';
          ctx.fillText(`-QAR ${entry.amount.toFixed(2)}`, colAmountX, rowY + 26);
        } else {
          ctx.fillStyle = '#34d399';
          ctx.fillText(`+QAR ${entry.amount.toFixed(2)}`, colAmountX, rowY + 26);
        }
      });

      // Footer
      const footerY = currentY + entries.length * rowHeight + 25;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(
        'Money Pocket • Financial Statement & Transaction Report • Verified Record',
        width / 2,
        footerY
      );

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

        link.setAttribute('href', url);
        link.setAttribute('download', `${filenamePrefix}-${dateStr}.png`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve(true);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to export photo:', err);
      resolve(false);
    }
  });
}
