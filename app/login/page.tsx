'use client';

import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0d12' }}>
      <div className="w-full max-w-md p-8">
        {/* Logo / Title */}
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

        {/* Card */}
        <div className="rounded-xl p-8" style={{ background: '#12161e', border: '1px solid #1c2230' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>Sign In</h2>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            Sign in with your Google account to access your trading journal.
            Your data is private and isolated — only you can see your trades.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-medium text-sm transition-all hover:brightness-110 cursor-pointer"
            style={{
              background: '#fff',
              color: '#1f2937',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
          Your trades, market data, and insights are encrypted and private.
        </p>
      </div>
    </div>
  );
}
