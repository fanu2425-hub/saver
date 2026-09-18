import React, { useState, useEffect, useRef } from 'react';

interface StockModalProps {
  isOpen: boolean;
  currentStock: number;
  onClose: () => void;
  onSaveStock: (newStock: number) => void;
}

export const StockModal: React.FC<StockModalProps> = ({
  isOpen,
  currentStock,
  onClose,
  onSaveStock,
}) => {
  const [val, setVal] = useState<string>(currentStock.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setVal(currentStock.toString());
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentStock]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      onSaveStock(num);
      onClose();
    }
  };

  return (
    <div
      className={`modal ${isOpen ? 'open' : ''}`}
      id="stock-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <form className="form" onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <div className="form-head">
          <h2>Set stock amount</h2>
          <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <label htmlFor="stock-input">
            How many items are available?
            <input
              ref={inputRef}
              id="stock-input"
              type="number"
              min="0"
              step="1"
              required
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          <button
            type="button"
            className="action"
            onClick={onClose}
            style={{ textAlign: 'center', padding: '14px', borderRadius: '11px', margin: 0 }}
          >
            Cancel
          </button>
          <button className="save" type="submit" style={{ marginTop: 0, height: '100%' }}>
            Save stock
          </button>
        </div>
      </form>
    </div>
  );
};
