'use client';

import { useState } from 'react';

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

type Step = 1 | 2 | 3;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const [googleMessage, setGoogleMessage] = useState('');

  const handleGetQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_question', email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      if (data.google_oauth) {
        setIsGoogleAccount(true);
        setGoogleMessage(data.message);
        setStep(2);
        return;
      }

      setSecurityQuestion(data.security_question);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_answer', email, answer }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      setStep(3);
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
          <p className="text-sm" style={{ color: '#64748b' }}>Password Recovery</p>
        </div>

        <div className="rounded-xl p-8" style={{ background: '#12161e', border: '1px solid #1c2230' }}>
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
                Forgot Password
              </h2>
              <p className="text-sm mb-6" style={{ color: '#64748b', fontFamily: "'DM Sans', sans-serif" }}>
                Enter your email address and we&apos;ll ask your security question.
              </p>
              <form onSubmit={handleGetQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                    placeholder="you@example.com"
                    autoComplete="email"
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
                  {loading ? 'Looking up...' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {step === 2 && isGoogleAccount && (
            <>
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
                Google Account Detected
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                {googleMessage}
              </p>
              <a
                href="/login"
                style={{
                  display: 'block',
                  marginTop: 20,
                  textAlign: 'center',
                  color: '#3b82f6',
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  textDecoration: 'none',
                }}
              >
                Back to Sign In
              </a>
            </>
          )}

          {step === 2 && !isGoogleAccount && (
            <>
              <h2 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
                Security Question
              </h2>
              <p className="text-sm mb-6" style={{ color: '#64748b', fontFamily: "'DM Sans', sans-serif" }}>
                Answer your security question to receive a reset link.
              </p>
              <form onSubmit={handleVerifyAnswer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Question</label>
                  <p style={{
                    padding: '10px 12px',
                    background: '#0a0d12',
                    border: '1px solid #1c2230',
                    borderRadius: 6,
                    fontSize: 14,
                    color: '#e2e8f0',
                    fontFamily: "'DM Sans', sans-serif",
                    margin: 0,
                  }}>
                    {securityQuestion}
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>Your Answer</label>
                  <input
                    type="text"
                    required
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    style={inputStyle}
                    placeholder="Enter your answer"
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
                  }}
                >
                  {loading ? 'Verifying...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>Check your email</div>
              <p style={{ color: '#94a3b8', fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, marginBottom: 20 }}>
                We&apos;ve sent a reset link to <span style={{ color: '#e2e8f0' }}>{email}</span>.
                Click the link in your email to set a new password.
              </p>
              <a
                href="/login"
                style={{
                  color: '#3b82f6',
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  textDecoration: 'none',
                }}
              >
                Back to Sign In
              </a>
            </div>
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

        {step !== 3 && (
          <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
            <a href="/login" style={{ color: '#475569', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
              Back to Sign In
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
