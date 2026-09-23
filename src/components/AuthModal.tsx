import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  auth,
  googleProvider,
} from '../firebase.ts';
import appletConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentDomain, setCurrentDomain] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.hostname);
    }
  }, []);

  if (!isOpen) return null;

  const projectId = appletConfig.projectId || 'gen-lang-client-0227825405';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
  const firebaseProvidersUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;

  const copyDomainToClipboard = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentDomain);
      } else {
        const input = document.createElement('input');
        input.value = currentDomain;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsUnauthorizedDomain(false);
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // Dismissed by user
        setError(null);
      } else if (err.code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
      } else if (err.code === 'auth/popup-blocked') {
        setError(
          'Login popup was blocked by your browser. Please allow popups or open the app directly.'
        );
      } else {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setIsUnauthorizedDomain(false);
    setLoading(true);

    try {
      if (isSignUp) {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      let msg = err.message || 'Authentication failed. Please check your credentials.';

      if (
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('PASSWORD_LOGIN_DISABLED') ||
        err.message?.includes('operation-not-allowed')
      ) {
        msg =
          'Email/Password login is currently disabled in your Firebase project. You can either sign in with Google, or enable "Email/Password" in Firebase Console (Authentication > Sign-in method).';
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = isSignUp
          ? 'Could not create account with these credentials.'
          : 'Invalid email or password. If you have not created an account yet, switch to "Create one" below.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to "Sign in" below.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment and try again.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network connection error. Please check your internet connection.';
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal open"
      id="auth-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="form" style={{ maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="form-head">
          <h2>Sign in for multi-device sync</h2>
          <button
            type="button"
            className="close"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p style={{ margin: '8px 0 16px', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Access your sales, stock, and QAR profit across all your phones, tablets, and computers.
        </p>

        {/* Actionable Banner for Unauthorized Domain */}
        {isUnauthorizedDomain && (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.15rem' }}>🔒</span>
              <strong style={{ color: '#ef4444', fontSize: '0.92rem' }}>
                Authorize your Netlify domain in Firebase
              </strong>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--ink)', margin: '0 0 12px', lineHeight: 1.45 }}>
              Firebase blocks Google sign-in on new deployment domains until you whitelist them once. It only takes 30 seconds:
            </p>

            {/* Current domain badge with copy button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'var(--card)',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                marginBottom: '12px',
                gap: '8px',
              }}
            >
              <code
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--blue)',
                  wordBreak: 'break-all',
                  fontWeight: 600,
                }}
              >
                {currentDomain || 'bestsavingstrackerever.netlify.app'}
              </code>
              <button
                type="button"
                onClick={copyDomainToClipboard}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  background: copied ? 'var(--good)' : 'var(--bg)',
                  color: copied ? '#ffffff' : 'var(--ink)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy Domain'}
              </button>
            </div>

            {/* 1-2-3 Guide */}
            <ol
              style={{
                margin: '0 0 14px 18px',
                padding: 0,
                fontSize: '0.8rem',
                color: 'var(--muted)',
                lineHeight: 1.5,
              }}
            >
              <li>Click the button below to open Firebase Authentication settings.</li>
              <li>
                Scroll down to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.
              </li>
              <li>
                Paste <code style={{ color: 'var(--ink)' }}>{currentDomain || 'netlify.app'}</code> and click <strong>Add</strong>.
              </li>
            </ol>

            {/* Direct console action button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href={firebaseSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '9px',
                  background: '#ea4335',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                Open Firebase Authorized Domains Settings ↗
              </a>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9px',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Done adding? Click here to try Google Sign-In again
              </button>
            </div>
          </div>
        )}

        {/* Standard Error Notice */}
        {error && !isUnauthorizedDomain && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '11px',
              background: 'rgba(220, 80, 85, 0.12)',
              color: 'var(--bad)',
              fontSize: '0.86rem',
              lineHeight: 1.45,
              marginBottom: 16,
              border: '1px solid rgba(220, 80, 85, 0.3)',
            }}
          >
            {error}
            {error.includes('Email/Password login is currently disabled') && (
              <div style={{ marginTop: '10px' }}>
                <a
                  href={firebaseProvidersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'var(--blue)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                  }}
                >
                  Enable Email/Password in Firebase Console ↗
                </a>
              </div>
            )}
          </div>
        )}

        {/* Primary Recommended Option: Google Sign-In */}
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              border: '1.5px solid var(--blue)',
              background: 'var(--card)',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: 750,
              fontSize: '0.96rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(40, 125, 240, 0.12)',
              transition: 'transform 0.1s ease, box-shadow 0.15s ease',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Continue with Google
          </button>
          <div
            style={{
              textAlign: 'center',
              fontSize: '0.76rem',
              color: 'var(--muted)',
              marginTop: '6px',
            }}
          >
            Recommended • Instant sign-in across all devices
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '18px 0',
            color: 'var(--muted)',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
          <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            or with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        <form onSubmit={handleEmailAuth}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            Email address
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </label>

          <label style={{ display: 'block', marginBottom: 16 }}>
            Password
            <input
              type="password"
              required
              placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </label>

          <button
            className="save"
            type="submit"
            disabled={loading}
            style={{ marginTop: 0, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in with email'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setIsUnauthorizedDomain(false);
            }}
            style={{ fontSize: '0.88rem' }}
          >
            {isSignUp
              ? 'Already have an account? Sign in with email'
              : "Don't have an email account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
