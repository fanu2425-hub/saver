import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal open"
      id="alert-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="form" style={{ maxWidth: 400 }}>
        <div className="form-head">
          <h2>Notice</h2>
          <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p style={{ marginTop: 16, marginBottom: 20, color: 'var(--ink)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {message}
        </p>

        <button
          type="button"
          className="save"
          onClick={onClose}
          style={{ marginTop: 0 }}
        >
          Understood
        </button>
      </div>
    </div>
  );
};
