'use client';
import { useState } from 'react';
import { Trade, fmt, r2 } from '@/lib/trading';

const pc = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#64748b';

interface Props {
  trades: Trade[];
  tagDefs: { id: number; name: string; color: string; is_preset: boolean }[];
  onToggleTag: (tradeId: string, tagId: number, tagName: string) => void;
  onSaveNotes: (tradeId: string, text: string) => void;
  onAddTag: (name: string) => void;
  selected: Trade | null;
  onSelect: (t: Trade | null) => void;
}

export default function TradesView({ trades, tagDefs, onToggleTag, onSaveNotes, onAddTag, selected, onSelect }: Props) {
  const [page, setPage] = useState(0);
  const [newTag, setNewTag] = useState('');
  const [noteText, setNoteText] = useState('');
  const perPage = 50;
  const sorted = [...trades].sort((a, b) => b.closeTime.localeCompare(a.closeTime));
  const paged = sorted.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  const selectTrade = (t: Trade) => {
    onSelect(selected?.id === t.id ? null : t);
    setNoteText(t.notes || '');
  };

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ background: '#12161e', border: '1px solid #1c2230', borderRadius: 7, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr>
                  {['Symbol', 'Dir', 'Qty', 'Open', 'Close', 'Date', 'P&L ($)', 'P&L (£)', 'Comm', 'Hold', 'Tags'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: 500, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #1c2230' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(t => (
                  <tr key={t.id} onClick={() => selectTrade(t)} style={{ cursor: 'pointer', background: selected?.id === t.id ? 'rgba(59,130,246,0.08)' : 'transparent' }}
                    onMouseEnter={e => { if (selected?.id !== t.id) (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.04)'; }}
                    onMouseLeave={e => { if (selected?.id !== t.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{t.symbol}</td>
                    <td style={{ padding: '7px 10px', color: t.direction === 'LONG' ? '#22c55e' : '#ef4444' }}>{t.direction}</td>
                    <td style={{ padding: '7px 10px' }}>{t.quantity}</td>
                    <td style={{ padding: '7px 10px' }}>{r2(t.avgOpen)}</td>
                    <td style={{ padding: '7px 10px' }}>{r2(t.avgClose)}</td>
                    <td style={{ padding: '7px 10px', color: '#64748b' }}>{t.closeDate}</td>
                    <td style={{ padding: '7px 10px', color: pc(t.netPnl), fontWeight: 600 }}>{t.netPnl > 0 ? '+' : ''}{fmt(t.netPnl)}</td>
                    <td style={{ padding: '7px 10px', color: pc(t.netPnlGBP) }}>{t.netPnlGBP > 0 ? '+' : ''}{fmt(t.netPnlGBP)}</td>
                    <td style={{ padding: '7px 10px', color: '#64748b' }}>{fmt(t.commission)}</td>
                    <td style={{ padding: '7px 10px', color: '#64748b' }}>{t.holdMinutes}m</td>
                    <td style={{ padding: '7px 10px' }}>
                      {(t.tags || []).map(tag => (
                        <span key={tag} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', marginRight: 3 }}>{tag}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid #1c2230', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ fontSize: 10, padding: '3px 8px', background: '#12161e', color: '#64748b', border: '1px solid #1c2230', borderRadius: 4, cursor: 'pointer' }}>← Prev</button>
              <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'var(--font-mono)' }}>{page + 1}/{totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} style={{ fontSize: 10, padding: '3px 8px', background: '#12161e', color: '#64748b', border: '1px solid #1c2230', borderRadius: 4, cursor: 'pointer' }}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* Tag Panel */}
      {selected && (
        <div style={{ width: 280, background: '#12161e', border: '1px solid #1c2230', borderRadius: 7, padding: 16, flexShrink: 0, position: 'sticky', top: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{selected.symbol} <span style={{ color: selected.direction === 'LONG' ? '#22c55e' : '#ef4444' }}>{selected.direction}</span></div>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 12 }}>{selected.closeDate} · <span style={{ color: pc(selected.netPnl) }}>${fmt(selected.netPnl)}</span></div>

          <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Setup Tags</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {tagDefs.map(td => {
              const active = selected.tags?.includes(td.name);
              return (
                <button key={td.id} onClick={() => onToggleTag(selected.id, td.id, td.name)}
                  style={{ fontSize: 10, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    background: active ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: active ? '#3b82f6' : '#64748b',
                    border: `1px solid ${active ? '#3b82f6' : '#1c2230'}` }}>
                  {td.name}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="New tag..." style={{ flex: 1, padding: '5px 8px', fontSize: 10, background: '#0a0d12', color: '#e2e8f0', border: '1px solid #1c2230', borderRadius: 4, fontFamily: "'DM Sans', sans-serif" }} />
            <button onClick={() => { if (newTag.trim()) { onAddTag(newTag.trim()); setNewTag(''); } }}
              style={{ fontSize: 10, padding: '4px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+</button>
          </div>

          <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Notes</div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
            style={{ width: '100%', padding: 8, fontSize: 11, background: '#0a0d12', color: '#e2e8f0', border: '1px solid #1c2230', borderRadius: 4, fontFamily: "'DM Sans', sans-serif", resize: 'vertical', boxSizing: 'border-box' }} />
          <button onClick={() => onSaveNotes(selected.id, noteText)}
            style={{ marginTop: 6, width: '100%', fontSize: 10, padding: '5px 0', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save Notes</button>
        </div>
      )}
    </div>
  );
}
