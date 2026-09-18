import React from 'react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <button
      className="exact-toggle"
      id="theme"
      type="button"
      aria-label="Switch color mode"
      onClick={onToggle}
    >
      <div
        style={{
          position: 'relative',
          width: '84px',
          height: '44px',
          borderRadius: '9999px',
          background: isDark
            ? 'linear-gradient(135deg, #08162e 0%, #162c52 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.22)',
          boxShadow: isDark
            ? 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.25)'
            : 'inset 0 2px 4px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(59, 130, 246, 0.3)',
          overflow: 'hidden',
          transition: 'background 0.35s ease, box-shadow 0.35s ease',
          cursor: 'pointer',
        }}
      >
        {/* Background decorations: Clouds (Day) & Stars (Night) */}
        {!isDark ? (
          <div
            style={{
              position: 'absolute',
              right: '8px',
              top: '7px',
              width: '32px',
              height: '30px',
              opacity: 0.9,
              pointerEvents: 'none',
              transition: 'opacity 0.3s ease',
            }}
          >
            {/* Cloud shape */}
            <svg viewBox="0 0 64 64" fill="white" style={{ width: '100%', height: '100%' }}>
              <path
                d="M44 38H18a10 10 0 0 1-2-19.8A14 14 0 0 1 42 16a12 12 0 0 1 2 22z"
                opacity="0.9"
              />
              <path
                d="M52 44H28a8 8 0 0 1-1.6-15.8A11 11 0 0 1 48 26a9 9 0 0 1 4 18z"
                opacity="0.6"
              />
            </svg>
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              left: '10px',
              top: '6px',
              width: '30px',
              height: '32px',
              pointerEvents: 'none',
            }}
          >
            {/* Star 1 */}
            <span
              style={{
                position: 'absolute',
                top: '5px',
                left: '6px',
                width: '3.5px',
                height: '3.5px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 4px #ffffff',
                display: 'block',
              }}
            />
            {/* Star 2 */}
            <span
              style={{
                position: 'absolute',
                top: '18px',
                left: '16px',
                width: '2.5px',
                height: '2.5px',
                borderRadius: '50%',
                backgroundColor: '#93c5fd',
                boxShadow: '0 0 3px #93c5fd',
                display: 'block',
              }}
            />
            {/* Star 3 (4-point sparkle) */}
            <svg
              viewBox="0 0 24 24"
              fill="#ffffff"
              style={{
                position: 'absolute',
                top: '6px',
                left: '18px',
                width: '8px',
                height: '8px',
                opacity: 0.95,
              }}
            >
              <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
            </svg>
          </div>
        )}

        {/* Sliding Knob (Sun / Moon) */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: isDark ? '44px' : '4px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: isDark
              ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)'
              : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            boxShadow: isDark
              ? '0 2px 6px rgba(0, 0, 0, 0.4), inset -2px -2px 4px rgba(100, 116, 139, 0.3)'
              : '0 2px 8px rgba(245, 158, 11, 0.5), inset 1px 1px 2px rgba(255, 255, 255, 0.6)',
            transition: 'left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease, box-shadow 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isDark ? (
            /* Moon craters */
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <span
                style={{
                  position: 'absolute',
                  top: '7px',
                  left: '14px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#94a3b8',
                  opacity: 0.45,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '17px',
                  left: '9px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#94a3b8',
                  opacity: 0.4,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '21px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#94a3b8',
                  opacity: 0.35,
                }}
              />
            </div>
          ) : (
            /* Sun inner shine */
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#fef08a',
                opacity: 0.7,
                filter: 'blur(1px)',
              }}
            />
          )}
        </div>
      </div>
    </button>
  );
};
