'use client';
import { fmt, r2 } from '@/lib/trading';

const pc = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#71717a';

export default function TableView({ title, data, cols, labels }: { title: string; data: any[]; cols: string[]; labels: string[] }) {
  if (!data.length) return <div style={{ color: '#71717a', padding: 20, textAlign: 'center' }}>No data.</div>;

  return (
    <div style={{ background: '#0f0f11', border: '1px solid #1e1e22', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '13px 18px', borderBottom: '1px solid #1e1e22', fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1.2 }}>{title}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr>{labels.map(l => (
              <th key={l} style={{
                padding: '10px 14px', textAlign: 'left', color: '#71717a', fontWeight: 500, fontSize: 9,
                textTransform: 'uppercase', letterSpacing: 1.2, borderBottom: '1px solid #1e1e22',
                background: '#0a0a0c',
              }}>{l}</th>
            ))}</tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1e1e22' }}>
                {cols.map(c => {
                  const v = row[c];
                  const isPnl = c.includes('pnl') || c.includes('Pnl');
                  const isComm = c.includes('comm') || c.includes('Comm');
                  const color = isPnl ? pc(v) : isComm ? '#71717a' : '#a1a1aa';
                  const prefix = isPnl && typeof v === 'number' ? (c.includes('GBP') || c.includes('gbp') ? '\u00a3' : '$') : isComm ? (c.includes('GBP') || c.includes('gbp') ? '\u00a3' : '$') : '';
                  const display = typeof v === 'number' ? `${prefix}${fmt(v)}` : v;
                  return <td key={c} style={{ padding: '8px 14px', color, fontWeight: isPnl ? 600 : 400 }}>{display}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
