'use client';
import { fmt, r2, fH } from '@/lib/trading';

const pc = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#64748b';
const M = ({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) => (
  <div style={{ background: '#12161e', border: '1px solid #1c2230', borderRadius: 7, padding: '14px 16px', flex: '1 1 170px', minWidth: 150 }}>
    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color || '#e2e8f0' }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function DashboardView({ stats }: { stats: any }) {
  if (!stats) return <div style={{ color: '#64748b' }}>No data for this filter.</div>;
  const s = stats;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <M label="Net P&L (USD)" value={`$${fmt(s.totalPnl)}`} color={pc(s.totalPnl)} />
        <M label="Net P&L (GBP)" value={`£${fmt(s.totalPnlGBP)}`} color={pc(s.totalPnlGBP)} />
        <M label="Trades" value={s.totalTrades} sub={`${s.winners}W / ${s.losers}L`} />
        <M label="Win Rate" value={`${s.winRate}%`} color={s.winRate >= 50 ? '#22c55e' : '#f59e0b'} />
        <M label="Profit Factor" value={fmt(s.profitFactor)} color={s.profitFactor >= 1.5 ? '#22c55e' : s.profitFactor >= 1 ? '#f59e0b' : '#ef4444'} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <M label="Expectancy" value={`$${fmt(s.expectancy)}`} color={pc(s.expectancy)} />
        <M label="Avg Win" value={`$${fmt(s.avgWin)}`} color="#22c55e" />
        <M label="Avg Loss" value={`$${fmt(s.avgLoss)}`} color="#ef4444" />
        <M label="Commission" value={`$${fmt(s.totalComm)}`} sub={`£${fmt(s.totalCommGBP)}`} />
        <M label="Avg Hold" value={`${s.avgHold}m`} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <M label="Largest Win" value={`$${fmt(s.largestWin)}`} color="#22c55e" />
        <M label="Largest Loss" value={`$${fmt(s.largestLoss)}`} color="#ef4444" />
        {s.bestSymbol && <M label="Best Symbol" value={s.bestSymbol.name} color="#22c55e" sub={`$${fmt(s.bestSymbol.pnl)} · ${s.bestSymbol.count}t`} />}
        {s.worstSymbol && s.worstSymbol.name !== s.bestSymbol?.name && <M label="Worst Symbol" value={s.worstSymbol.name} color="#ef4444" sub={`$${fmt(s.worstSymbol.pnl)} · ${s.worstSymbol.count}t`} />}
        {s.bestHour && <M label="Best Hour" value={fH(s.bestHour.hour)} color="#22c55e" sub={`$${fmt(s.bestHour.pnl)} · ${s.bestHour.wr}%WR`} />}
      </div>

      {/* Tag performance */}
      {Object.keys(s.byTag || {}).length > 0 && (
        <div style={{ background: '#12161e', border: '1px solid #1c2230', borderRadius: 7, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c2230', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>P&L by Setup Tag</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 14 }}>
            {Object.entries(s.byTag).sort((a: any, b: any) => b[1].pnl - a[1].pnl).map(([tag, d]: any) => (
              <div key={tag} style={{ padding: '6px 12px', borderRadius: 5, fontFamily: 'var(--font-mono)', fontSize: 11, background: d.pnl > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${d.pnl > 0 ? 'rgba(34,197,94,0.09)' : 'rgba(239,68,68,0.09)'}` }}>
                <span style={{ fontWeight: 600 }}>{tag}</span>
                <span style={{ color: pc(d.pnl), marginLeft: 6 }}>${fmt(r2(d.pnl))}</span>
                <span style={{ color: '#64748b', marginLeft: 4, fontSize: 9 }}>{d.count}t · {r2(d.wins / d.count * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Symbol chips */}
      <div style={{ background: '#12161e', border: '1px solid #1c2230', borderRadius: 7, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c2230', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>P&L by Symbol</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 14 }}>
          {Object.entries(s.bySymbol).sort((a: any, b: any) => b[1].pnl - a[1].pnl).map(([sym, d]: any) => (
            <div key={sym} style={{ padding: '6px 12px', borderRadius: 5, fontFamily: 'var(--font-mono)', fontSize: 11, background: d.pnl > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${d.pnl > 0 ? 'rgba(34,197,94,0.09)' : 'rgba(239,68,68,0.09)'}` }}>
              <span style={{ fontWeight: 600 }}>{sym}</span>
              <span style={{ color: pc(d.pnl), marginLeft: 6 }}>${fmt(r2(d.pnl))}</span>
              <span style={{ color: '#64748b', marginLeft: 4, fontSize: 9 }}>{d.count}t · {r2(d.wins / d.count * 100)}%WR</span>
            </div>
          ))}
        </div>
      </div>

      {/* P&L by Hour */}
      {Object.keys(s.byHour || {}).length > 0 && (
        <div style={{ background: '#12161e', border: '1px solid #1c2230', borderRadius: 7, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c2230', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>P&L by Hour (UTC)</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end', padding: 14 }}>
            {Array.from({ length: 24 }, (_, h) => {
              const d = s.byHour[h];
              if (!d) return null;
              const max = Math.max(...Object.values(s.byHour).map((v: any) => Math.abs(v.pnl)));
              const height = Math.max(4, Math.abs(d.pnl) / (max || 1) * 60);
              return (
                <div key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 28 }}>
                  <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: pc(d.pnl), marginBottom: 1 }}>{d.pnl > 0 ? '+' : ''}{r2(d.pnl)}</div>
                  <div style={{ width: 16, height, borderRadius: 2, background: d.pnl > 0 ? '#22c55e' : '#ef4444', opacity: 0.6 }} />
                  <div style={{ fontSize: 8, color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{fH(h)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
