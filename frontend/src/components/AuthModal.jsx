import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', promptMessage = null, onSuccess }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  
  // Keep mode in sync when initialMode changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid Gmail / Email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your password.');
        return;
      }

      setLoading(true);
      try {
        await signup(name, email, password, confirmPassword);
        setSuccessMsg('Account created successfully! Welcome to SehatSure.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 800);
      } catch (err) {
        setError(err.message || 'Signup failed.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      setLoading(true);
      try {
        await login(email, password);
        setSuccessMsg('Logged in successfully!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 600);
      } catch (err) {
        setError(err.message || 'Login failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="feature-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '28px',
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--color-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: 'var(--shadow-soft)'
            }}
          >
            <UserIcon size={24} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 6px' }}>
            {mode === 'signup' ? 'Create Your Account' : 'Welcome to SehatSure'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {mode === 'signup'
              ? 'Sign up to save policies and bookmark network hospitals'
              : 'Sign in to access your saved policies and hospitals'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--color-neutral-bg, #f1f5f9)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 14px',
              border: 'none',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
            onClick={() => switchMode('login')}
          >
            Log In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 14px',
              border: 'none',
              background: mode === 'signup' ? '#ffffff' : 'transparent',
              color: mode === 'signup' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: mode === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {promptMessage && !error && !successMsg && (
          <div
            style={{
              background: 'var(--color-teal-light, #F0FDFA)',
              border: '1px solid var(--color-teal-border, #CCFBF1)',
              color: 'var(--color-primary, #0F766E)',
              padding: '11px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, color: 'var(--color-primary, #0F766E)' }} />
            <span>{promptMessage}</span>
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <div className="field">
              <label className="field-label" style={{ fontSize: '12px', fontWeight: 600 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '38px', fontSize: '13px' }}
                  required
                />
              </div>
            </div>
          )}

          <div className="field">
            <label className="field-label" style={{ fontSize: '12px', fontWeight: 600 }}>
              {mode === 'signup' ? 'Gmail / Email Address' : 'Email Address'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="email"
                className="field-input"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '38px', fontSize: '13px' }}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" style={{ fontSize: '12px', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="password"
                className="field-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '38px', fontSize: '13px' }}
                required
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="field">
              <label className="field-label" style={{ fontSize: '12px', fontWeight: 600 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="password"
                  className="field-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '38px', fontSize: '13px' }}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="pill-btn pill-btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              fontSize: '14px',
              fontWeight: 700,
              marginTop: '6px',
              borderRadius: 'var(--radius-md, 10px)'
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'signup'
              ? 'Create Account'
              : 'Log In'}
          </button>
        </form>

        {/* Footer switch */}
        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Log In
              </button>
            </>
          ) : (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
