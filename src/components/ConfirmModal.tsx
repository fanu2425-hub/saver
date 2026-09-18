import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal open"
      id="confirm-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="form" style={{ maxWidth: 420 }}>
        <div className="form-head">
          <h2>Start fresh week</h2>
          <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <p style={{ marginTop: 16, marginBottom: 20, color: 'var(--ink)', fontSize: '0.95rem' }}>
          {message}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            type="button"
            className="action"
            onClick={onCancel}
            style={{ textAlign: 'center', padding: '14px', borderRadius: '11px', margin: 0 }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="save"
            onClick={onConfirm}
            style={{
              marginTop: 0,
              height: '100%',
              backgroundColor: 'var(--bad)',
            }}
          >
            Reset all
          </button>
        </div>
      </div>
    </div>
  );
};
