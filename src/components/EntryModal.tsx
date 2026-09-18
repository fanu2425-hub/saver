import React, { useState, useEffect, useRef } from 'react';
import { EntryType, MoneyEntry } from '../types.ts';

interface EntryModalProps {
  isOpen: boolean;
  initialType: EntryType;
  stock: number;
  onClose: () => void;
  onSave: (entry: MoneyEntry) => void;
  onAlert: (msg: string) => void;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  initialType,
  stock,
  onClose,
  onSave,
  onAlert,
}) => {
  const [type, setType] = useState<EntryType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [customer, setCustomer] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [note, setNote] = useState<string>('');

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setAmount('');
      setCustomer('');
      setQty(1);
      setNote('');
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const isOther = type === 'other';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const numQty = isOther ? 1 : qty;
    const cleanNote = note.trim();
    const cleanCustomer = customer.trim();

    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return;
    }
    if (!cleanNote) {
      return;
    }
    if (!isOther && (!numQty || numQty < 1)) {
      return;
    }
    if (type === 'sale' && !cleanCustomer) {
      return;
    }

    if (type === 'sale' && numQty > stock) {
      onAlert(`Only ${stock} items are available. Add stock first.`);
      return;
    }

    onSave({
      type,
      amount: numAmount,
      qty: numQty,
      note: cleanNote,
      customer: cleanCustomer,
    });
    onClose();
  };

  return (
    <div
      className={`modal ${isOpen ? 'open' : ''}`}
      id="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <form className="form" id="form" onSubmit={handleSubmit}>
        <div className="form-head">
          <h2>Add entry</h2>
          <button
            type="button"
            className="close"
            id="close"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="fields">
          <label>
            Type
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as EntryType)}
            >
              <option value="sale">Sold items</option>
              <option value="restock">Restocked</option>
              <option value="other">Other money in</option>
            </select>
          </label>

          <label>
            Amount (QAR)
            <input
              ref={amountInputRef}
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="5.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label
            id="customerField"
            style={{ display: isOther ? 'none' : 'block' }}
          >
            Customer name
            <input
              id="customer"
              maxLength={35}
              placeholder="Example: Ahmed"
              required={type === 'sale'}
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </label>

          <label
            id="qtyField"
            style={{ display: isOther ? 'none' : 'block' }}
          >
            How many items?
            <input
              id="qty"
              type="number"
              min="1"
              step="1"
              required={!isOther}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
            />
          </label>

          <label className="wide">
            What was it?
            <input
              id="note"
              maxLength={50}
              required
              placeholder="Example: Topps cards"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        <button className="save" type="submit">
          Save entry
        </button>
      </form>
    </div>
  );
};
