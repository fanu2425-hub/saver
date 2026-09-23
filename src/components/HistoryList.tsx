import React, { useState } from 'react';
import { MoneyEntry } from '../types.ts';
import { exportEntriesToPhoto } from '../utils/photoExport.ts';

interface HistoryListProps {
  entries: MoneyEntry[];
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
  onViewReceipt?: (entry: MoneyEntry) => void;
}

const formatMoney = (n: number) => `QAR ${n.toFixed(2)}`;

export const HistoryList: React.FC<HistoryListProps> = ({
  entries,
  onAddEntry,
  onRemoveEntry,
  onViewReceipt,
}) => {
  const [isExported, setIsExported] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPhoto = async () => {
    if (entries.length === 0 || isExporting) return;
    setIsExporting(true);
    try {
      const success = await exportEntriesToPhoto(entries);
      if (success) {
        setIsExported(true);
        setTimeout(() => setIsExported(false), 2500);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="history-container">
      <div className="line">
        <h2>Money history</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {entries.length > 0 && (
            <button
              type="button"
              id="export-photo-btn"
              onClick={handleExportPhoto}
              disabled={isExporting}
              title={`Download statement image for ${entries.length} transaction${
                entries.length === 1 ? '' : 's'
              }`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: isExported ? 'rgba(21, 151, 102, 0.12)' : 'var(--soft)',
                color: isExported ? 'var(--good)' : 'var(--ink)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: isExporting ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>
                {isExporting ? '⏳' : isExported ? '✓' : '📸'}
              </span>
              <span>
                {isExporting ? 'Saving Photo...' : isExported ? 'Photo Saved!' : 'Export Photo'}
              </span>
            </button>
          )}

          <button className="text-button" id="add" type="button" onClick={onAddEntry}>
            + Add entry
          </button>
        </div>
      </div>

      <section className="history" id="history-section">
        {entries.length === 0 ? (
          <div className="empty" id="empty">
            Your sales and costs will appear here.
          </div>
        ) : (
          <div id="list">
            {entries.map((e, i) => (
              <article className="entry" key={i} id={`entry-${i}`}>
                <span className="icon">{e.type === 'restock' ? '📦' : '💸'}</span>
                <div>
                  <div className="note">{e.note}</div>
                  <div className="info">
                    {e.type === 'sale'
                      ? `Customer: ${e.customer} · Sold ${e.qty}`
                      : e.type === 'restock'
                      ? `Added ${e.qty}`
                      : 'Money in'}
                  </div>
                </div>

                <div
                  className="entry-right-controls"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  {e.type === 'sale' && onViewReceipt && (
                    <button
                      type="button"
                      id={`receipt-badge-btn-${i}`}
                      onClick={() => onViewReceipt(e)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 9px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        background: 'var(--soft)',
                        color: 'var(--blue)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title="View QR receipt"
                    >
                      <span>🧾</span>
                      <span>Receipt</span>
                    </button>
                  )}

                  <div className={`amount ${e.type === 'restock' ? 'bad' : 'good'}`}>
                    {e.type === 'restock' ? '−' : '+'}
                    {formatMoney(e.amount)}
                  </div>
                </div>

                <button
                  className="remove"
                  data-i={i}
                  type="button"
                  aria-label="Delete entry"
                  onClick={() => onRemoveEntry(i)}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
