'use client';
import { useState } from 'react';
import { Trade, fmt, r2 } from '@/lib/trading';

const pc = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#71717a';

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
        <div style={{ background: '#0f0f11', border: '1px solid #1e1e22', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr>
                  {['Symbol', 'Dir', 'Qty', 'Open', 'Close', 'Date', 'P&L ($)', 'P&L (\u00a3)', 'Comm', 'Hold', 'Tags'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: 'left', color: '#71717a', fontWeight: 500, fontSize: 9,
                      textTransform: 'uppercase', letterSpacing: 1.2, borderBottom: '1px solid #1e1e22',
                      background: '#0a0a0c',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(t => (
                  <tr key={t.id} onClick={() => selectTrade(t)} style={{
                    cursor: 'pointer',
                    background: selected?.id === t.id ? 'rgba(234,179,8,0.06)' : 'transparent',
                    borderBottom: '1px solid #1e1e22',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => { if (selected?.id !== t.id) (e.currentTarget as HTMLElement).style.background = 'rgba(250,250,250,0.02)'; }}
                    onMouseLeave={e => { if (selected?.id !== t.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fafafa' }}>{t.symbol}</td>
                    <td style={{ padding: '8px 12px', color: t.direction === 'LONG' ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{t.direction}</td>
                    <td style={{ padding: '8px 12px', color: '#a1a1aa' }}>{t.quantity}</td>
                    <td style={{ padding: '8px 12px', color: '#a1a1aa' }}>{r2(t.avgOpen)}</td>
                    <td style={{ padding: '8px 12px', color: '#a1a1aa' }}>{r2(t.avgClose)}</td>
                    <td style={{ padding: '8px 12px', color: '#71717a' }}>{t.closeDate}</td>
                    <td style={{ padding: '8px 12px', color: pc(t.netPnl), fontWeight: 600 }}>{t.netPnl > 0 ? '+' : ''}{fmt(t.netPnl)}</td>
                    <td style={{ padding: '8px 12px', color: pc(t.netPnlGBP) }}>{t.netPnlGBP > 0 ? '+' : ''}{fmt(t.netPnlGBP)}</td>
                    <td style={{ padding: '8px 12px', color: '#71717a' }}>{fmt(t.commission)}</td>
                    <td style={{ padding: '8px 12px', color: '#71717a' }}>{t.holdMinutes}m</td>
                    <td style={{ padding: '8px 12px' }}>
                      {(t.tags || []).map(tag => (
                        <span key={tag} style={{
                          fontSize: 9, padding: '2px 7px', borderRadius: 4,
                          background: 'rgba(234,179,8,0.1)', color: '#eab308',
                          marginRight: 4, fontWeight: 500,
                        }}>{tag}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e22', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{
                fontSize: 11, padding: '5px 12px', background: 'transparent', color: page === 0 ? '#52525b' : '#a1a1aa',
                border: '1px solid #1e1e22', borderRadius: 5, cursor: page === 0 ? 'default' : 'pointer', transition: 'all 0.15s',
              }}>Prev</button>
              <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'var(--font-mono)' }}>{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} style={{
                fontSize: 11, padding: '5px 12px', background: 'transparent', color: page >= totalPages - 1 ? '#52525b' : '#a1a1aa',
                border: '1px solid #1e1e22', borderRadius: 5, cursor: page >= totalPages - 1 ? 'default' : 'pointer', transition: 'all 0.15s',
              }}>Next</button>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div style={{
          width: 280, background: '#0f0f11', border: '1px solid #1e1e22', borderRadius: 8,
          padding: 18, flexShrink: 0, position: 'sticky', top: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#fafafa' }}>
            {selected.symbol}{' '}
            <span style={{ color: selected.direction === 'LONG' ? '#22c55e' : '#ef4444' }}>{selected.direction}</span>
          </div>
          <div style={{ fontSize: 11, color: '#71717a', marginBottom: 14 }}>
            {selected.closeDate} \u00b7 <span style={{ color: pc(selected.netPnl), fontWeight: 600 }}>${fmt(selected.netPnl)}</span>
          </div>

          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, fontWeight: 500 }}>Setup Tags</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
            {tagDefs.map(td => {
              const active = selected.tags?.includes(td.name);
              return (
                <button key={td.id} onClick={() => onToggleTag(selected.id, td.id, td.name)}
                  style={{
                    fontSize: 11, padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                    background: active ? 'rgba(234,179,8,0.15)' : 'transparent',
                    color: active ? '#eab308' : '#71717a',
                    border: `1px solid ${active ? 'rgba(234,179,8,0.3)' : '#1e1e22'}`,
                  }}>
                  {td.name}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
            <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="New tag..."
              style={{
                flex: 1, padding: '6px 10px', fontSize: 11, background: '#09090b', color: '#fafafa',
                border: '1px solid #1e1e22', borderRadius: 5, fontFamily: "'DM Sans', sans-serif", outline: 'none',
              }} />
            <button onClick={() => { if (newTag.trim()) { onAddTag(newTag.trim()); setNewTag(''); } }}
              style={{
                fontSize: 11, padding: '5px 12px', background: '#eab308', color: '#09090b',
                border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600,
              }}>+</button>
          </div>

          <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, fontWeight: 500 }}>Notes</div>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
            style={{
              width: '100%', padding: 10, fontSize: 11, background: '#09090b', color: '#fafafa',
              border: '1px solid #1e1e22', borderRadius: 5, fontFamily: "'DM Sans', sans-serif",
              resize: 'vertical', boxSizing: 'border-box', outline: 'none',
            }} />
          <button onClick={() => onSaveNotes(selected.id, noteText)}
            style={{
              marginTop: 8, width: '100%', fontSize: 11, padding: '7px 0', fontWeight: 600,
              background: '#eab308', color: '#09090b', border: 'none', borderRadius: 5, cursor: 'pointer',
            }}>Save Notes</button>
        </div>
      )}
    </div>
  );
}
