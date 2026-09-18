import React from 'react';

interface StockCardProps {
  stock: number;
  onSetStock: () => void;
  onReset: () => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onSetStock, onReset }) => {
  return (
    <aside className="card" id="stock-card">
      <h2>Stock available</h2>
      <div className="stock" id="stock">{stock}</div>
      <p className="muted">items ready to sell</p>
      <button className="text-button" id="setStock" type="button" onClick={onSetStock}>
        Set stock amount
      </button>
      <p style={{ margin: '8px 0 0' }}>
        <button className="text-button" id="reset" type="button" onClick={onReset}>
          Start fresh week
        </button>
      </p>
    </aside>
  );
};
