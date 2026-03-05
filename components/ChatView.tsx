'use client';

interface Props {
  messages: { role: string; text: string }[];
  input: string;
  loading: boolean;
  onInput: (v: string) => void;
  onSend: () => void;
  stats: any;
}

function formatAI(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return `<strong style="color:#fafafa">${part.slice(2, -2)}</strong>`;
    }
    return part;
  }).join('');
}

const suggestions = [
  "How am I performing? Be honest.",
  "What patterns do you see in my losing trades?",
  "Break down my performance by setup tag.",
  "Which times of day should I avoid?",
  "Give me a weekly review with actionable advice.",
];

export default function ChatView({ messages, input, loading, onInput, onSend, stats }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 190px)', maxHeight: 700 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: '#eab308', textTransform: 'uppercase', letterSpacing: 1.5 }}>AI Trading Insights</div>
            <div style={{ fontSize: 12, color: '#71717a', maxWidth: 420, margin: '0 auto', lineHeight: 1.7, marginBottom: 20 }}>
              Ask about your trading patterns, performance by setup, risk management, or anything about your journal data.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => { onInput(s); }}
                  style={{
                    padding: '8px 14px', fontSize: 11, background: '#0f0f11', color: '#a1a1aa',
                    border: '1px solid #1e1e22', borderRadius: 20, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#eab308'; e.currentTarget.style.color = '#eab308'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e22'; e.currentTarget.style.color = '#a1a1aa'; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            padding: '12px 16px', borderRadius: 10, maxWidth: '85%', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap',
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#eab308' : '#0f0f11',
            color: m.role === 'user' ? '#09090b' : '#a1a1aa',
            border: m.role === 'user' ? 'none' : '1px solid #1e1e22',
            fontWeight: m.role === 'user' ? 500 : 400,
          }} dangerouslySetInnerHTML={m.role === 'assistant' ? { __html: formatAI(m.text) } : undefined}>
            {m.role === 'user' ? m.text : undefined}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start', padding: '12px 16px', borderRadius: 10,
            background: '#0f0f11', border: '1px solid #1e1e22', fontSize: 11, color: '#71717a',
          }}>
            <span style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }}>Thinking...</span>
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid #1e1e22', paddingTop: 12, display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => onInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()}
          placeholder="Ask about your trading..." style={{
            flex: 1, padding: '11px 14px', fontSize: 12, background: '#0f0f11', color: '#fafafa',
            border: '1px solid #1e1e22', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", outline: 'none',
          }} />
        <button onClick={onSend} disabled={loading} style={{
          padding: '11px 20px', fontSize: 12, fontWeight: 600, background: '#eab308', color: '#09090b',
          border: 'none', borderRadius: 8, cursor: 'pointer', opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s',
        }}>Send</button>
      </div>
    </div>
  );
}
