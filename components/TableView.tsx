'use client';
import { fmt, r2 } from '@/lib/trading';

const pc = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#64748b';

export default function TableView({ title, data, cols, labels }: { title: string; data: any[]; cols: string[]; labels: string[] }) {
  if (!data.length) return <div style={{ color: '#64748b' }}>No data.</div>;

  return (
    <div style={{ background: '#12161e', border: '1px solid #1c2230', borderRadius: 7, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c2230', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr>{labels.map(l => <th key={l} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #1c2230' }}>{l}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(28,34,48,0.03)' }}>
                {cols.map(c => {
                  const v = row[c];
                  const isPnl = c.includes('pnl') || c.includes('Pnl');
                  const isComm = c.includes('comm') || c.includes('Comm');
                  const color = isPnl ? pc(v) : isComm ? '#64748b' : '#e2e8f0';
                  const prefix = isPnl && typeof v === 'number' ? (c.includes('GBP') || c.includes('gbp') ? '£' : '$') : isComm ? (c.includes('GBP') || c.includes('gbp') ? '£' : '$') : '';
                  const display = typeof v === 'number' ? `${prefix}${fmt(v)}` : v;
                  return <td key={c} style={{ padding: '7px 12px', color, fontWeight: isPnl ? 600 : 400 }}>{display}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
