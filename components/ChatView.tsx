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
  // Simple bold parsing for **text**
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return `<strong style="color:#f0f0f0">${part.slice(2, -2)}</strong>`;
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#e2e8f0' }}>AI Trading Insights</div>
            <div style={{ fontSize: 11, color: '#64748b', maxWidth: 400, margin: '0 auto', lineHeight: 1.6, marginBottom: 16 }}>
              Ask Claude about your trading patterns, performance by setup, risk management, or anything about your journal data.
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => { onInput(s); }}
                  style={{ padding: '7px 12px', fontSize: 10, background: '#12161e', color: '#64748b', border: '1px solid #1c2230', borderRadius: 16, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            padding: '10px 14px', borderRadius: 8, maxWidth: '85%', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#3b82f6' : '#12161e',
            border: m.role === 'user' ? 'none' : '1px solid #1c2230',
          }} dangerouslySetInnerHTML={m.role === 'assistant' ? { __html: formatAI(m.text) } : undefined}>
            {m.role === 'user' ? m.text : undefined}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 8, background: '#12161e', border: '1px solid #1c2230', fontSize: 11, color: '#64748b' }}>
            Thinking...
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid #1c2230', paddingTop: 10, display: 'flex', gap: 6 }}>
        <input value={input} onChange={e => onInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()}
          placeholder="Ask about your trading..." style={{
            flex: 1, padding: '9px 12px', fontSize: 12, background: '#12161e', color: '#e2e8f0',
            border: '1px solid #1c2230', borderRadius: 6, fontFamily: "'DM Sans', sans-serif", outline: 'none',
          }} />
        <button onClick={onSend} disabled={loading} style={{
          padding: '9px 16px', fontSize: 12, fontWeight: 600, background: '#3b82f6', color: '#fff',
          border: 'none', borderRadius: 6, cursor: 'pointer', opacity: loading ? 0.5 : 1,
        }}>Send</button>
      </div>
    </div>
  );
}
