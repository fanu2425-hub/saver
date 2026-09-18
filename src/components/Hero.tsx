import React from 'react';
import { ThemeToggle } from './ThemeToggle.tsx';
import { User, signOut, auth } from '../firebase.ts';

interface HeroProps {
  profit: number;
  isDark: boolean;
  user: User | null;
  syncing: boolean;
  onToggleTheme: () => void;
  onOpenAuth: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  profit,
  isDark,
  user,
  syncing,
  onToggleTheme,
  onOpenAuth,
}) => {
  return (
    <section className="hero" id="hero-section">
      {/* Top right action bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
      >
        {user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(6, 25, 48, 0.65)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              fontSize: '0.8rem',
              color: '#ffffff',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: syncing ? '#fbbf24' : '#10b981',
                boxShadow: syncing ? '0 0 6px #fbbf24' : '0 0 6px #10b981',
                display: 'inline-block',
              }}
              title={syncing ? 'Syncing...' : 'Real-time multi-device sync active'}
            />
            <span
              style={{
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 600,
              }}
              title={user.email || 'User'}
            >
              {user.displayName || user.email?.split('@')[0]}
            </span>
            <button
              type="button"
              onClick={() => signOut(auth)}
              style={{
                border: 0,
                background: 'none',
                color: '#93c5fd',
                padding: '2px 4px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 700,
                transition: 'opacity 0.15s',
              }}
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(6, 25, 48, 0.65)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.15s',
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>☁️</span>
            <span>Sign in to sync</span>
          </button>
        )}

        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>

      <div className="eyebrow" id="hero-eyebrow" style={{ marginTop: '14px' }}>
        Small business money tracker
      </div>
      <h1 id="hero-title">Money Pocket</h1>
      <p id="hero-description">Record sales, customers, stock, and QAR profit.</p>

      <div className="balance" id="balance">
        {profit.toFixed(2)} <small>QAR</small>
      </div>
      <div className="sub" id="hero-subtitle">Profit so far</div>
    </section>
  );
};
