'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { SECURITY_QUESTIONS } from '@/lib/auth-constants';

const inputStyle: React.CSSProperties = {
  background: '#09090b',
  color: '#fafafa',
  border: '1px solid #1e1e22',
  borderRadius: 6,
  padding: '11px 14px',
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#71717a',
  marginBottom: 6,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 500,
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
      if (!userId) { setError('Sign-up failed.'); return; }

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
      setSuEmail(''); setSuPassword(''); setSuConfirm(''); setSuUsername('');
      setSuQuestion(SECURITY_QUESTIONS[0]); setSuAnswer('');
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
        padding: '9px 0',
        fontSize: 13,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: tab === t ? 600 : 400,
        color: tab === t ? '#fafafa' : '#52525b',
        background: tab === t ? '#1e1e22' : 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}>
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', boxShadow: '0 0 16px rgba(234,179,8,0.4)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: '#eab308', fontFamily: "'DM Sans', sans-serif" }}>
              PNL VAULT
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#52525b' }}>
            Professional Trading Analytics
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-8" style={{ background: '#0f0f11', border: '1px solid #1e1e22' }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', background: '#09090b', borderRadius: 8, padding: 3, marginBottom: 24, border: '1px solid #1e1e22' }}>
            {tabBtn('signin', 'Sign In')}
            {tabBtn('signup', 'Sign Up')}
          </div>

          {signedUpSuccess && tab === 'signin' && (
            <div style={{
              marginBottom: 16, padding: '10px 14px',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 6, fontSize: 13, color: '#86efac', fontFamily: "'DM Sans', sans-serif",
            }}>
              Account created successfully! Please sign in below.
            </div>
          )}

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium text-sm cursor-pointer"
            style={{
              background: '#fafafa', color: '#09090b', fontFamily: "'DM Sans', sans-serif",
              border: 'none', borderRadius: 8, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#1e1e22' }} />
            <span style={{ fontSize: 11, color: '#52525b', fontFamily: "'DM Sans', sans-serif" }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#1e1e22' }} />
          </div>

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Email or Username</label>
                <input type="text" required value={siIdentifier} onChange={e => setSiIdentifier(e.target.value)}
                  style={inputStyle} placeholder="you@example.com" autoComplete="username"
                  onFocus={e => (e.target.style.borderColor = '#eab308')}
                  onBlur={e => (e.target.style.borderColor = '#1e1e22')} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input type="password" required value={siPassword} onChange={e => setSiPassword(e.target.value)}
                  style={inputStyle} placeholder="Your password" autoComplete="current-password"
                  onFocus={e => (e.target.style.borderColor = '#eab308')}
                  onBlur={e => (e.target.style.borderColor = '#1e1e22')} />
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <a href="/forgot-password" style={{ fontSize: 12, color: '#eab308', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                    Forgot password?
                  </a>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                background: '#eab308', color: '#09090b', border: 'none', borderRadius: 6,
                padding: '12px 0', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4,
                transition: 'opacity 0.15s',
              }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Email', type: 'email', value: suEmail, set: setSuEmail, ph: 'you@example.com', ac: 'email' },
                { label: 'Username', type: 'text', value: suUsername, set: setSuUsername, ph: 'Your display name', ac: 'username' },
                { label: 'Password', type: 'password', value: suPassword, set: setSuPassword, ph: 'Min. 8 characters', ac: 'new-password' },
                { label: 'Confirm Password', type: 'password', value: suConfirm, set: setSuConfirm, ph: 'Confirm password', ac: 'new-password' },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type} required value={f.value} onChange={e => f.set(e.target.value)}
                    style={inputStyle} placeholder={f.ph} autoComplete={f.ac}
                    onFocus={e => (e.target.style.borderColor = '#eab308')}
                    onBlur={e => (e.target.style.borderColor = '#1e1e22')} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Security Question</label>
                <select value={suQuestion} onChange={e => setSuQuestion(e.target.value as typeof suQuestion)}
                  style={{ ...inputStyle, appearance: 'none' as React.CSSProperties['appearance'] }}>
                  {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Security Answer</label>
                <input type="text" required value={suAnswer} onChange={e => setSuAnswer(e.target.value)}
                  style={inputStyle} placeholder="Your answer" autoComplete="off"
                  onFocus={e => (e.target.style.borderColor = '#eab308')}
                  onBlur={e => (e.target.style.borderColor = '#1e1e22')} />
              </div>
              <button type="submit" disabled={loading} style={{
                background: '#eab308', color: '#09090b', border: 'none', borderRadius: 6,
                padding: '12px 0', fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4,
                transition: 'opacity 0.15s',
              }}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {error && (
            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 6, fontSize: 13, color: '#fca5a5', fontFamily: "'DM Sans', sans-serif",
            }}>
              {error}
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#27272a' }}>
          Your trades, market data, and insights are encrypted and private.
        </p>
      </div>
    </div>
  );
}
