'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { SECURITY_QUESTIONS } from '@/lib/auth-constants';

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

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function LoginPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedUpSuccess, setSignedUpSuccess] = useState(false);

  const [siIdentifier, setSiIdentifier] = useState('');
  const [siPassword, setSiPassword] = useState('');

  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suUsername, setSuUsername] = useState('');
  const [suQuestion, setSuQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [suAnswer, setSuAnswer] = useState('');

  const supabase = createClient();

  const switchTab = (t: 'signin' | 'signup') => {
    setTab(t);
    setError('');
    if (t !== 'signup') setSignedUpSuccess(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let email = siIdentifier.trim();

      if (!email.includes('@')) {
        const res = await fetch('/api/auth/lookup-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'No account found for that username.'); return; }
        email = data.email;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password: siPassword });
      if (error) { setError(error.message); return; }
      window.location.href = '/dashboard';
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!suUsername.trim()) { setError('Username is required.'); return; }
    if (suPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (suPassword !== suConfirm) { setError('Passwords do not match.'); return; }
    if (!suAnswer.trim()) { setError('Security answer is required.'); return; }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: suEmail,
        password: suPassword,
        options: { data: { username: suUsername } },
      });
      if (signUpError) { setError(signUpError.message); return; }

      const userId = data.user?.id;
      if (!userId) { setError('Sign-up failed — no user ID returned.'); return; }

      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId,
          username: suUsername,
          security_question: suQuestion,
          security_answer: suAnswer,
        }),
      });
      const profileData = await res.json();
      if (!profileData.success) { setError(profileData.error || 'Failed to save profile.'); return; }

      await supabase.auth.signOut();

      setSuEmail('');
      setSuPassword('');
      setSuConfirm('');
      setSuUsername('');
      setSuQuestion(SECURITY_QUESTIONS[0]);
      setSuAnswer('');

      setSignedUpSuccess(true);
      setTab('signin');
    } finally {
      setLoading(false);
    }
  };

  const tabBtn = (t: 'signin' | 'signup', label: string) => (
    <button
      onClick={() => switchTab(t)}
      style={{
        flex: 1,
        padding: '8px 0',
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: tab === t ? 600 : 400,
        color: tab === t ? '#e2e8f0' : '#64748b',
        background: tab === t ? '#1c2230' : 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  const divider = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#1c2230' }} />
      <span style={{ fontSize: 12, color: '#475569', fontFamily: "'DM Sans', sans-serif" }}>or</span>
      <div style={{ flex: 1, height: 1, background: '#1c2230' }} />
    </div>
  );

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
          <p className="text-sm" style={{ color: '#64748b' }}>
            IBKR Trade Analytics · Supabase Powered
          </p>
        </div>

        <div className="rounded-xl p-8" style={{ background: '#12161e', border: '1px solid #1c2230' }}>
          <div style={{ display: 'flex', background: '#0a0d12', borderRadius: 8, padding: 3, marginBottom: 24, border: '1px solid #1c2230' }}>
            {tabBtn('signin', 'Sign In')}
            {tabBtn('signup', 'Sign Up')}
          </div>

          {signedUpSuccess && tab === 'signin' && (
            <div style={{
              marginBottom: 16,
              padding: '10px 12px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 6,
              fontSize: 13,
              color: '#86efac',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Account created successfully! Please sign in below.
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium text-sm transition-all hover:brightness-110 cursor-pointer"
            style={{ background: '#fff', color: '#1f2937', fontFamily: "'DM Sans', sans-serif" }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {divider}

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Email or Username</label>
                <input
                  type="text"
                  required
                  value={siIdentifier}
                  onChange={e => setSiIdentifier(e.target.value)}
                  style={inputStyle}
                  placeholder="you@example.com or your username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  required
                  value={siPassword}
                  onChange={e => setSiPassword(e.target.value)}
                  style={inputStyle}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <a href="/forgot-password" style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                    Forgot password?
                  </a>
                </div>
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
                  marginTop: 4,
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={suEmail}
                  onChange={e => setSuEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  required
                  value={suUsername}
                  onChange={e => setSuUsername(e.target.value)}
                  style={inputStyle}
                  placeholder="Your display name"
                  autoComplete="username"
                />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  required
                  value={suPassword}
                  onChange={e => setSuPassword(e.target.value)}
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
                  value={suConfirm}
                  onChange={e => setSuConfirm(e.target.value)}
                  style={inputStyle}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label style={labelStyle}>Security Question</label>
                <select
                  value={suQuestion}
                  onChange={e => setSuQuestion(e.target.value as typeof suQuestion)}
                  style={{ ...inputStyle, appearance: 'none' as React.CSSProperties['appearance'] }}
                >
                  {SECURITY_QUESTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Security Answer</label>
                <input
                  type="text"
                  required
                  value={suAnswer}
                  onChange={e => setSuAnswer(e.target.value)}
                  style={inputStyle}
                  placeholder="Your answer"
                  autoComplete="off"
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
                  marginTop: 4,
                }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

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
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
          Your trades, market data, and insights are encrypted and private.
        </p>
      </div>
    </div>
  );
}
