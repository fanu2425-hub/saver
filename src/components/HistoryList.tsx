import React from 'react';
import { MoneyEntry } from '../types.ts';

interface HistoryListProps {
  entries: MoneyEntry[];
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
}

const formatMoney = (n: number) => `QAR ${n.toFixed(2)}`;

export const HistoryList: React.FC<HistoryListProps> = ({
  entries,
  onAddEntry,
  onRemoveEntry,
}) => {
  return (
    <div id="history-container">
      <div className="line">
        <h2>Money history</h2>
        <button className="text-button" id="add" type="button" onClick={onAddEntry}>
          + Add entry
        </button>
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
                <div className={`amount ${e.type === 'restock' ? 'bad' : 'good'}`}>
                  {e.type === 'restock' ? '−' : '+'}
                  {formatMoney(e.amount)}
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
