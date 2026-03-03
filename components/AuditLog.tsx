'use client';

interface AuditEntry { id: number; time: string; type: string; status: string; detail: string; }

const typeColors: Record<string, string> = {
  TRADE_IMPORT: '#3b82f6', MARKET_IMPORT: '#a78bfa', TAG: '#06b6d4', NOTES: '#10b981',
  CUSTOM_TAG: '#8b5cf6', CHAT: '#64748b', CLEAR: '#ef4444', DB_CONNECT: '#22c55e', HEALTH_CHECK: '#f59e0b',
};
const statusIcons: Record<string, string> = { pending: '⏳', success: '✓', error: '✗' };
const statusColors: Record<string, string> = { pending: '#f59e0b', success: '#22c55e', error: '#ef4444' };

export default function AuditLog({ log, onClear }: { log: AuditEntry[]; onClear: () => void }) {
  return (
    <div style={{ background: '#12161e', border: '1px solid #1c2230', borderRadius: 7, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c2230', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Audit Log</span>
          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>({log.length} entries)</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: '#64748b' }}>Persisted to Supabase. Survives page reloads.</span>
          <button onClick={onClear} style={{ fontSize: 10, padding: '4px 10px', background: 'transparent', color: '#64748b', border: '1px solid #1c2230', borderRadius: 4, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>CLEAR LOG</button>
        </div>
      </div>

      {log.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
          No operations logged yet. Import trades or market data to see activity here.
        </div>
      ) : (
        <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {log.map(entry => (
            <div key={entry.id} style={{ padding: '8px 16px', borderBottom: '1px solid rgba(28,34,48,0.03)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 60, fontSize: 9, color: '#64748b', fontFamily: 'var(--font-mono)', paddingTop: 2 }}>
                {new Date(entry.time).toLocaleTimeString('en-GB')}
              </div>
              <div style={{ minWidth: 16, fontSize: 12, color: statusColors[entry.status] || '#64748b', paddingTop: 1 }}>
                {statusIcons[entry.status] || '?'}
              </div>
              <div style={{ minWidth: 100 }}>
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3,
                  background: `${typeColors[entry.type] || '#64748b'}18`,
                  color: typeColors[entry.type] || '#64748b', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {entry.type}
                </span>
              </div>
              <div style={{ flex: 1, fontSize: 11, color: entry.status === 'error' ? '#ef4444' : '#e2e8f0', lineHeight: 1.5 }}>
                {entry.detail}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
