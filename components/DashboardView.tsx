'use client';
import { fmt, r2, fH } from '@/lib/trading';

const pc = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#71717a';

const M = ({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) => (
  <div style={{
    background: '#0f0f11',
    border: '1px solid #1e1e22',
    borderRadius: 8,
    padding: '16px 18px',
    flex: '1 1 170px',
    minWidth: 150,
    transition: 'border-color 0.2s',
  }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2a2e')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e22')}
  >
    <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color || '#fafafa', letterSpacing: '-0.02em' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function DashboardView({ stats }: { stats: any }) {
  if (!stats) return <div style={{ color: '#71717a', padding: 20, textAlign: 'center' }}>No data for this filter.</div>;
  const s = stats;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <M label="Net P&L (USD)" value={`$${fmt(s.totalPnl)}`} color={pc(s.totalPnl)} />
        <M label="Net P&L (GBP)" value={`\u00a3${fmt(s.totalPnlGBP)}`} color={pc(s.totalPnlGBP)} />
        <M label="Trades" value={s.totalTrades} sub={`${s.winners}W / ${s.losers}L`} />
        <M label="Win Rate" value={`${s.winRate}%`} color={s.winRate >= 50 ? '#22c55e' : '#eab308'} />
        <M label="Profit Factor" value={fmt(s.profitFactor)} color={s.profitFactor >= 1.5 ? '#22c55e' : s.profitFactor >= 1 ? '#eab308' : '#ef4444'} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <M label="Expectancy" value={`$${fmt(s.expectancy)}`} color={pc(s.expectancy)} />
        <M label="Avg Win" value={`$${fmt(s.avgWin)}`} color="#22c55e" />
        <M label="Avg Loss" value={`$${fmt(s.avgLoss)}`} color="#ef4444" />
        <M label="Commission" value={`$${fmt(s.totalComm)}`} sub={`\u00a3${fmt(s.totalCommGBP)}`} />
        <M label="Avg Hold" value={`${s.avgHold}m`} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <M label="Largest Win" value={`$${fmt(s.largestWin)}`} color="#22c55e" />
        <M label="Largest Loss" value={`$${fmt(s.largestLoss)}`} color="#ef4444" />
        {s.bestSymbol && <M label="Best Symbol" value={s.bestSymbol.name} color="#22c55e" sub={`$${fmt(s.bestSymbol.pnl)} \u00b7 ${s.bestSymbol.count}t`} />}
        {s.worstSymbol && s.worstSymbol.name !== s.bestSymbol?.name && <M label="Worst Symbol" value={s.worstSymbol.name} color="#ef4444" sub={`$${fmt(s.worstSymbol.pnl)} \u00b7 ${s.worstSymbol.count}t`} />}
        {s.bestHour && <M label="Best Hour" value={fH(s.bestHour.hour)} color="#22c55e" sub={`$${fmt(s.bestHour.pnl)} \u00b7 ${s.bestHour.wr}%WR`} />}
      </div>

      {Object.keys(s.byTag || {}).length > 0 && (
        <div style={{ background: '#0f0f11', border: '1px solid #1e1e22', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #1e1e22', fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1.2 }}>P&L by Setup Tag</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 16 }}>
            {Object.entries(s.byTag).sort((a: any, b: any) => b[1].pnl - a[1].pnl).map(([tag, d]: any) => (
              <div key={tag} style={{
                padding: '7px 14px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11,
                background: d.pnl > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${d.pnl > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`,
              }}>
                <span style={{ fontWeight: 600, color: '#fafafa' }}>{tag}</span>
                <span style={{ color: pc(d.pnl), marginLeft: 8 }}>${fmt(r2(d.pnl))}</span>
                <span style={{ color: '#71717a', marginLeft: 6, fontSize: 10 }}>{d.count}t \u00b7 {r2(d.wins / d.count * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: '#0f0f11', border: '1px solid #1e1e22', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid #1e1e22', fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1.2 }}>P&L by Symbol</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 16 }}>
          {Object.entries(s.bySymbol).sort((a: any, b: any) => b[1].pnl - a[1].pnl).map(([sym, d]: any) => (
            <div key={sym} style={{
              padding: '7px 14px', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11,
              background: d.pnl > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${d.pnl > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`,
            }}>
              <span style={{ fontWeight: 600, color: '#fafafa' }}>{sym}</span>
              <span style={{ color: pc(d.pnl), marginLeft: 8 }}>${fmt(r2(d.pnl))}</span>
              <span style={{ color: '#71717a', marginLeft: 6, fontSize: 10 }}>{d.count}t \u00b7 {r2(d.wins / d.count * 100)}%WR</span>
            </div>
          ))}
        </div>
      </div>

      {Object.keys(s.byHour || {}).length > 0 && (
        <div style={{ background: '#0f0f11', border: '1px solid #1e1e22', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #1e1e22', fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1.2 }}>P&L by Hour (UTC)</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end', padding: 16 }}>
            {Array.from({ length: 24 }, (_, h) => {
              const d = s.byHour[h];
              if (!d) return null;
              const max = Math.max(...Object.values(s.byHour).map((v: any) => Math.abs(v.pnl)));
              const height = Math.max(4, Math.abs(d.pnl) / (max || 1) * 60);
              return (
                <div key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
                  <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: pc(d.pnl), marginBottom: 2 }}>{d.pnl > 0 ? '+' : ''}{r2(d.pnl)}</div>
                  <div style={{ width: 18, height, borderRadius: 3, background: d.pnl > 0 ? '#22c55e' : '#ef4444', opacity: 0.7 }} />
                  <div style={{ fontSize: 8, color: '#71717a', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{fH(h)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
