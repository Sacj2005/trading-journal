'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const inputStyle: React.CSSProperties = {
  background: '#0a0d12',
  color: '#e2e8f0',
  border: '1px solid #1c2230',
  borderRadius: 6,
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: '#94a3b8',
  marginBottom: 6,
  fontFamily: "'DM Sans', sans-serif",
};

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    const timer = setTimeout(() => {
      setInvalid(prev => {
        if (!ready) return true;
        return prev;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => { window.location.href = '/dashboard'; }, 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0d12' }}>
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ background: '#3b82f6', boxShadow: '0 0 12px #3b82f6' }} />
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
              TRADING JOURNAL
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#64748b' }}>Set New Password</p>
        </div>

        <div className="rounded-xl p-8" style={{ background: '#12161e', border: '1px solid #1c2230' }}>
          {!ready && !invalid && (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
              Verifying reset link...
            </div>
          )}

          {invalid && !ready && (
            <>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
                Invalid or Expired Link
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, marginBottom: 20 }}>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <a
                href="/forgot-password"
                style={{
                  display: 'inline-block',
                  color: '#3b82f6',
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  textDecoration: 'none',
                }}
              >
                Request new reset link
              </a>
            </>
          )}

          {ready && !success && (
            <>
              <h2 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
                Set New Password
              </h2>
              <p className="text-sm mb-6" style={{ color: '#64748b', fontFamily: "'DM Sans', sans-serif" }}>
                Choose a new password for your account.
              </p>
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={inputStyle}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    style={inputStyle}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '11px 0',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>

              {error && (
                <div style={{
                  marginTop: 16,
                  padding: '10px 12px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#fca5a5',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {error}
                </div>
              )}
            </>
          )}

          {success && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#22c55e', fontFamily: "'DM Sans', sans-serif" }}>
                Password Updated!
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                Redirecting to your dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
