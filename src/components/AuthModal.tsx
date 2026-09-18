import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  auth,
  googleProvider,
} from '../firebase.ts';

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

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily dismissed popup
        setError(null);
      } else if (err.code === 'auth/popup-blocked') {
        setError(
          'The login popup was blocked by your browser or the iframe preview. Please allow popups or open the app in a new tab.'
        );
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(
          'This domain is not in Firebase Authorized Domains. In Firebase Console (Authentication > Settings > Authorized domains), add your current domain.'
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
          'Email/Password login is disabled in this Firebase project. Please use "Continue with Google" above, or enable "Email/Password" in Firebase Console (Authentication > Sign-in method).';
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = isSignUp
          ? 'Could not create account. Please verify email and password.'
          : 'Invalid email or password. If you have not created an account yet, click "Create one" below.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to "Sign in" below.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment and try again.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network connection failed. Please check your internet connection.';
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
      <div className="form" style={{ maxWidth: 450 }}>
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
          Connect your account to access your live sales, stock, and profit across your phone, tablet, and PC.
        </p>

        {error && (
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
            Recommended • Instant sign-in without passwords
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
