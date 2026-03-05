'use client';

interface AuditEntry { id: number; time: string; type: string; status: string; detail: string; }

const typeColors: Record<string, string> = {
  TRADE_IMPORT: '#eab308', MARKET_IMPORT: '#a78bfa', TAG: '#06b6d4', NOTES: '#10b981',
  CUSTOM_TAG: '#8b5cf6', CHAT: '#71717a', CLEAR: '#ef4444', DB_CONNECT: '#22c55e', HEALTH_CHECK: '#f59e0b',
};
const statusIcons: Record<string, string> = { pending: '\u23f3', success: '\u2713', error: '\u2717' };
const statusColors: Record<string, string> = { pending: '#eab308', success: '#22c55e', error: '#ef4444' };

export default function AuditLog({ log, onClear }: { log: AuditEntry[]; onClear: () => void }) {
  return (
    <div style={{ background: '#0f0f11', border: '1px solid #1e1e22', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '13px 18px', borderBottom: '1px solid #1e1e22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1.2 }}>Audit Log</span>
          <span style={{ fontSize: 11, color: '#52525b', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>({log.length})</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#52525b' }}>Persisted to Supabase</span>
          <button onClick={onClear} style={{
            fontSize: 10, padding: '5px 12px', background: 'transparent', color: '#71717a',
            border: '1px solid #1e1e22', borderRadius: 5, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s',
          }}>Clear</button>
        </div>
      </div>

      {log.length === 0 ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', color: '#52525b', fontSize: 12 }}>
          No operations logged yet. Import trades or market data to see activity here.
        </div>
      ) : (
        <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {log.map(entry => (
            <div key={entry.id} style={{
              padding: '10px 18px', borderBottom: '1px solid #1e1e22',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{ minWidth: 62, fontSize: 10, color: '#52525b', fontFamily: 'var(--font-mono)', paddingTop: 2 }}>
                {new Date(entry.time).toLocaleTimeString('en-GB')}
              </div>
              <div style={{ minWidth: 16, fontSize: 13, color: statusColors[entry.status] || '#71717a', paddingTop: 1 }}>
                {statusIcons[entry.status] || '?'}
              </div>
              <div style={{ minWidth: 110 }}>
                <span style={{
                  fontSize: 9, padding: '3px 8px', borderRadius: 4, fontWeight: 600,
                  background: `${typeColors[entry.type] || '#71717a'}15`,
                  color: typeColors[entry.type] || '#71717a',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {entry.type}
                </span>
              </div>
              <div style={{ flex: 1, fontSize: 11, color: entry.status === 'error' ? '#ef4444' : '#a1a1aa', lineHeight: 1.6 }}>
                {entry.detail}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
