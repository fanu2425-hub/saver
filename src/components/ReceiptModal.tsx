import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { MoneyEntry } from '../types.ts';

interface ReceiptModalProps {
  isOpen: boolean;
  entry: MoneyEntry | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, entry, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const createdAt = entry?.createdAt || Date.now();
  const dateFormatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(createdAt));

  // Generate a receipt ID based on timestamp and customer
  const receiptNumber = entry
    ? `REC-${new Date(createdAt).getFullYear()}-${Math.abs(
        (entry.createdAt || Date.now()) % 100000
      )
        .toString()
        .padStart(5, '0')}`
    : 'REC-00000';

  // Construct working verification URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const verificationUrl = entry
    ? `${origin}${pathname}?receipt=${encodeURIComponent(receiptNumber)}&amt=${
        entry.amount
      }&qty=${entry.qty}&cust=${encodeURIComponent(
        entry.customer || 'Customer'
      )}&item=${encodeURIComponent(entry.note || 'Item')}&date=${createdAt}`
    : origin;

  useEffect(() => {
    if (isOpen && entry) {
      // Generate scannable QR Code
      QRCode.toDataURL(verificationUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0e1e38',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate QR code', err);
        });
    } else {
      setQrDataUrl('');
    }
  }, [isOpen, entry, verificationUrl]);

  if (!isOpen || !entry) return null;

  const unitPrice = entry.qty > 0 ? (entry.amount / entry.qty).toFixed(2) : entry.amount.toFixed(2);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(verificationUrl);
      } else {
        const input = document.createElement('input');
        input.value = verificationUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal open receipt-modal-wrapper"
      id="receipt-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="form receipt-card-container"
        id="receipt-card-container"
        style={{
          maxWidth: 440,
          padding: 0,
          background: 'transparent',
          boxShadow: 'none',
        }}
      >
        {/* Actual Printable Receipt Paper */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="receipt-paper"
          style={{
            background: 'var(--card)',
            borderRadius: '20px',
            border: '1.5px solid var(--line)',
            padding: '24px 22px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
            color: 'var(--ink)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <button
              type="button"
              className="close no-print"
              id="close-receipt-btn"
              aria-label="Close receipt"
              onClick={onClose}
              style={{
                position: 'absolute',
                right: -6,
                top: -6,
                zIndex: 2,
              }}
            >
              ×
            </button>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(21, 151, 102, 0.12)',
                color: 'var(--good)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}
            >
              <span>✓</span>
              <span>PAID RECEIPT</span>
            </div>

            <h2
              id="receipt-store-name"
              style={{
                margin: 0,
                fontSize: '1.35rem',
                fontWeight: 850,
                letterSpacing: '-0.02em',
              }}
            >
              Money Pocket
            </h2>
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--muted)',
                marginTop: '2px',
                fontWeight: 500,
              }}
            >
              Sales Receipt &amp; Verification
            </div>
          </div>

          {/* Receipt Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              margin: '18px 0 14px',
              padding: '12px 14px',
              background: 'var(--soft)',
              borderRadius: '12px',
              fontSize: '0.8rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.74rem' }}>
                Receipt No:
              </span>
              <strong style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                {receiptNumber}
              </strong>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.74rem' }}>
                Date &amp; Time:
              </span>
              <span>{dateFormatted}</span>
            </div>

            <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--line)', paddingTop: '6px' }}>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.74rem' }}>
                Customer:
              </span>
              <strong style={{ fontSize: '0.88rem' }}>{entry.customer || 'Direct Customer'}</strong>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ margin: '14px 0 18px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--muted)',
                fontWeight: 700,
                paddingBottom: '6px',
                borderBottom: '1.5px solid var(--line)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <span>Item &amp; Qty</span>
              <span>Total</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: '1px dashed var(--line)',
              }}
            >
              <div>
                <div style={{ fontWeight: 750, fontSize: '0.94rem' }}>{entry.note}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                  {entry.qty} × QAR {unitPrice}
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.96rem' }}>
                QAR {entry.amount.toFixed(2)}
              </div>
            </div>

            {/* Total Paid */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '12px 0 4px',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>Total Paid:</span>
              <span
                id="receipt-total-amount"
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  color: 'var(--good)',
                  letterSpacing: '-0.03em',
                }}
              >
                {entry.amount.toFixed(2)} <small style={{ fontSize: '0.6em' }}>QAR</small>
              </span>
            </div>
          </div>

          {/* Working QR Code Section */}
          <div
            id="receipt-qr-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              borderRadius: '14px',
              background: 'var(--soft)',
              textAlign: 'center',
              border: '1px solid var(--line)',
            }}
          >
            {qrDataUrl ? (
              <img
                id="receipt-qr-image"
                src={qrDataUrl}
                alt={`QR Code for Receipt ${receiptNumber}`}
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  padding: '6px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--card)',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                }}
              >
                Generating QR...
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--ink)',
              }}
            >
              <span>📱</span>
              <span>Scan with phone camera to verify</span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--muted)',
                marginTop: '2px',
                maxWidth: '240px',
              }}
            >
              Instant digital copy with verified payment record
            </div>
          </div>

          {/* Action buttons (hidden on print) */}
          <div
            className="no-print"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginTop: '18px',
            }}
          >
            <button
              type="button"
              id="copy-receipt-link-btn"
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '11px',
                borderRadius: '11px',
                border: '1px solid var(--line)',
                background: copied ? 'var(--good)' : 'var(--card)',
                color: copied ? '#ffffff' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{copied ? '✓' : '🔗'}</span>
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              id="print-receipt-btn"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '11px',
                borderRadius: '11px',
                border: '0',
                background: 'var(--blue)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              <span>🖨️</span>
              <span>Print / PDF</span>
            </button>
          </div>

          <div
            className="no-print"
            style={{
              textAlign: 'center',
              marginTop: '12px',
            }}
          >
            <button
              type="button"
              id="done-receipt-btn"
              onClick={onClose}
              className="text-button"
              style={{ fontSize: '0.84rem' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
