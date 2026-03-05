'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Trade, rowToTrade, tradeToRow, parseCSV, cleanRows, normalizeExec, fifoMatch, parseMarketCSV, computeStats, fmt, r2, fH } from '@/lib/trading';
import DashboardView from '@/components/DashboardView';
import TradesView from '@/components/TradesView';
import TableView from '@/components/TableView';
import AuditLog from '@/components/AuditLog';
import ChatView from '@/components/ChatView';

interface AuditEntry { id: number; time: string; type: string; status: string; detail: string; }
interface TagDef { id: number; name: string; color: string; is_preset: boolean; }

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tagDefs, setTagDefs] = useState<TagDef[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [chat, setChat] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState('');
  const [acctFilter, setAcctFilter] = useState('ALL');
  const [period, setPeriod] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'unknown'>('unknown');
  const tradeRef = useRef<HTMLInputElement>(null);
  const mktRef = useRef<HTMLInputElement>(null);

  const addLog = useCallback((type: string, status: string, detail: string) => {
    const entry = { id: Date.now(), time: new Date().toISOString(), type, status, detail };
    setAuditLog(prev => [entry, ...prev].slice(0, 500));
    if (user) {
      supabase.from('audit_log').insert([{ time: entry.time, type, status, detail, user_id: user.id }]).then();
    }
    return entry;
  }, [user, supabase]);

  useEffect(() => {
    (async () => {
      try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { setLoading(false); window.location.href = '/login'; return; }
      setUser(u);

      try {
        const [dbTrades, tags, tagLinks, notes, chatRows, logRows] = await Promise.all([
          supabase.from('trades').select('*').eq('user_id', u.id).order('close_time', { ascending: false }).limit(10000),
          supabase.from('tag_definitions').select('*').or(`user_id.eq.${u.id},user_id.is.null`).order('is_preset', { ascending: false }),
          supabase.from('trade_tags').select('trade_id,tag_id,tag_definitions(name)').eq('user_id', u.id),
          supabase.from('trade_notes').select('*').eq('user_id', u.id),
          supabase.from('chat_history').select('*').eq('user_id', u.id).order('created_at', { ascending: true }).limit(50),
          supabase.from('audit_log').select('*').eq('user_id', u.id).order('time', { ascending: false }).limit(500),
        ]);

        const tagMap: Record<string, string[]> = {};
        const noteMap: Record<string, string> = {};
        (tagLinks.data || []).forEach((tl: any) => {
          if (!tagMap[tl.trade_id]) tagMap[tl.trade_id] = [];
          tagMap[tl.trade_id].push(tl.tag_definitions?.name || `tag-${tl.tag_id}`);
        });
        (notes.data || []).forEach((n: any) => { noteMap[n.trade_id] = n.notes; });

        const mapped = (dbTrades.data || []).map((r: any) => {
          r._tags = tagMap[r.id] || [];
          r._notes = noteMap[r.id] || '';
          return rowToTrade(r);
        });

        setTrades(mapped);
        setTagDefs(tags.data || []);
        setChat((chatRows.data || []).map((r: any) => ({ role: r.role, text: r.text })));
        setAuditLog((logRows.data || []).map((r: any) => ({ id: r.id, time: r.time, type: r.type, status: r.status, detail: r.detail })));
        setDbStatus('connected');
      } catch (err: any) {
        setMsg(`\u2717 DB error: ${err.message}`);
        setDbStatus('error');
      }
      setLoading(false);
      } catch (err) {
        console.error('[dashboard] fatal error:', err);
        setLoading(false);
        window.location.href = '/login';
      }
    })();
  }, [supabase]);

  const filtered = useMemo(() => {
    let f = trades;
    if (acctFilter !== 'ALL') f = f.filter(t => (t.accountAlias || t.accountId) === acctFilter);
    if (period !== 'all') {
      const now = new Date(); let cut: Date | undefined;
      if (period === 'today') cut = new Date(now.toISOString().slice(0, 10));
      else if (period === '7d') { cut = new Date(now); cut.setDate(cut.getDate() - 7); }
      else if (period === '30d') { cut = new Date(now); cut.setDate(cut.getDate() - 30); }
      else if (period === '90d') { cut = new Date(now); cut.setDate(cut.getDate() - 90); }
      if (cut) f = f.filter(t => new Date(t.closeDate) >= cut!);
    }
    return f;
  }, [trades, acctFilter, period]);

  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const accounts = useMemo(() => [...new Set(trades.map(t => t.accountAlias || t.accountId))], [trades]);

  const handleTradeImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    setImporting(true); setMsg('Parsing CSV...');
    addLog('TRADE_IMPORT', 'pending', `File: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    try {
      const text = await file.text();
      const rows = cleanRows(parseCSV(text));
      const execs = rows.map(normalizeExec);
      const newTrades = fifoMatch(execs);
      const existingIds = new Set(trades.map(t => t.id));
      const fresh = newTrades.filter(t => !existingIds.has(t.id));
      addLog('TRADE_IMPORT', 'pending', `${fresh.length} new, ${newTrades.length - fresh.length} duplicates`);

      if (fresh.length) {
        for (let i = 0; i < fresh.length; i += 500) {
          const chunk = fresh.slice(i, i + 500).map(t => tradeToRow(t, user.id));
          const { error } = await supabase.from('trades').upsert(chunk, { onConflict: 'id' });
          if (error) throw error;
          setMsg(`Saving... ${Math.min(i + 500, fresh.length)}/${fresh.length}`);
        }
        setTrades(prev => [...prev, ...fresh.map(t => ({ ...t, tags: [], notes: '' }))].sort((a, b) => a.openTime.localeCompare(b.openTime)));
      }
      const { count } = await supabase.from('trades').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      addLog('TRADE_IMPORT', 'success', `\u2713 ${fresh.length} new trades. DB total: ${count}`);
      setMsg(`\u2713 ${fresh.length} new trades saved. DB total: ${count}`);
    } catch (err: any) {
      setMsg(`\u2717 ${err.message}`); addLog('TRADE_IMPORT', 'error', err.message);
    }
    setImporting(false); if (tradeRef.current) tradeRef.current.value = '';
  }, [trades, user, addLog, supabase]);

  const handleMarketImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !user) return;
    setImporting(true); setMsg('Parsing market data...');
    const name = file.name.replace(/\.csv$/i, '');
    const parts = name.split(/[_\-\s]+/);
    const symbol = (parts[0] || 'UNKNOWN').toUpperCase();
    const tf = parts.find(p => /\d+min/i.test(p)) || '1min';
    addLog('MARKET_IMPORT', 'pending', `File: ${file.name} \u2192 ${symbol} ${tf}`);

    try {
      const candles = parseMarketCSV(await file.text(), symbol, tf);
      if (!candles.length) { setMsg('\u2717 No valid candles found'); addLog('MARKET_IMPORT', 'error', '0 candles parsed'); setImporting(false); return; }
      addLog('MARKET_IMPORT', 'pending', `${candles.length} candles: ${candles[0].time.slice(0, 10)} to ${candles[candles.length - 1].time.slice(0, 10)}`);

      for (let i = 0; i < candles.length; i += 500) {
        const chunk = candles.slice(i, i + 500).map(c => ({ ...c, user_id: user.id }));
        const { error } = await supabase.from('market_data').upsert(chunk, { onConflict: 'user_id,symbol,timeframe,time' });
        if (error) throw error;
        setMsg(`Merging... ${Math.min(i + 500, candles.length)}/${candles.length}`);
      }
      const { count } = await supabase.from('market_data').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('symbol', symbol).eq('timeframe', tf);
      addLog('MARKET_IMPORT', 'success', `\u2713 ${candles.length} ${symbol} ${tf} candles merged. DB total: ${count}`);
      setMsg(`\u2713 ${candles.length} ${symbol} ${tf} candles merged. DB: ${count} total.`);
    } catch (err: any) {
      setMsg(`\u2717 ${err.message}`); addLog('MARKET_IMPORT', 'error', err.message);
    }
    setImporting(false); if (mktRef.current) mktRef.current.value = '';
  }, [user, addLog, supabase]);

  const toggleTag = useCallback(async (tradeId: string, tagId: number, tagName: string) => {
    if (!user) return;
    const trade = trades.find(t => t.id === tradeId); if (!trade) return;
    const has = trade.tags?.includes(tagName);
    try {
      if (has) {
        await supabase.from('trade_tags').delete().eq('trade_id', tradeId).eq('tag_id', tagId).eq('user_id', user.id);
        setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, tags: t.tags.filter(n => n !== tagName) } : t));
        addLog('TAG', 'success', `Removed "${tagName}" from ${trade.symbol}`);
      } else {
        await supabase.from('trade_tags').insert([{ trade_id: tradeId, tag_id: tagId, user_id: user.id }]);
        setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, tags: [...(t.tags || []), tagName] } : t));
        addLog('TAG', 'success', `Added "${tagName}" to ${trade.symbol}`);
      }
    } catch (err: any) { setMsg(`\u2717 Tag error: ${err.message}`); }
  }, [trades, user, addLog, supabase]);

  const saveNotes = useCallback(async (tradeId: string, text: string) => {
    if (!user) return;
    try {
      await supabase.from('trade_notes').upsert([{ trade_id: tradeId, notes: text, user_id: user.id, updated_at: new Date().toISOString() }], { onConflict: 'trade_id' });
      setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, notes: text } : t));
      addLog('NOTES', 'success', `Saved notes (${text.length} chars)`);
    } catch (err: any) { setMsg(`\u2717 ${err.message}`); }
  }, [user, addLog, supabase]);

  const addCustomTag = useCallback(async (name: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('tag_definitions').insert([{ name, color: '#eab308', is_preset: false, user_id: user.id }]).select();
      if (error) throw error;
      if (data) setTagDefs(prev => [...prev, ...data]);
      addLog('CUSTOM_TAG', 'success', `Created tag: "${name}"`);
    } catch (err: any) { setMsg(`\u2717 ${err.message}`); }
  }, [user, addLog, supabase]);

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || chatLoading || !user) return;
    const q = chatInput.trim(); setChatInput('');
    const newChat = [...chat, { role: 'user', text: q }];
    setChat(newChat); setChatLoading(true);
    await supabase.from('chat_history').insert([{ role: 'user', text: q, user_id: user.id }]);

    try {
      const sample = filtered.slice(-60).map(t => ({ sym: t.symbol, dir: t.direction, pnl: t.netPnl, date: t.closeDate, hold: t.holdMinutes, tags: t.tags }));
      const sys = `You are an expert trading coach. Trader uses IBKR, trades US futures/stocks. Base currency GBP. Be concise, specific, actionable. Bold key figures with **.\nSTATS: ${JSON.stringify(stats)}\nTAG PERF: ${JSON.stringify(stats?.byTag || {})}\nRECENT: ${JSON.stringify(sample)}`;
      const messages = [...chat.slice(-10).map(m => ({ role: m.role, content: m.text })), { role: 'user', content: q }];
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: sys, messages }),
      });
      const data = await res.json();
      const answer = data.content?.map((c: any) => c.text || '').join('\n') || 'No response.';
      const updated = [...newChat, { role: 'assistant', text: answer }];
      setChat(updated);
      await supabase.from('chat_history').insert([{ role: 'assistant', text: answer, user_id: user.id }]);
    } catch (err: any) {
      setChat([...newChat, { role: 'assistant', text: `Error: ${err.message}` }]);
    }
    setChatLoading(false);
    addLog('CHAT', 'success', `Q: "${q.slice(0, 50)}..."`);
  }, [chatInput, chatLoading, user, chat, filtered, stats, addLog, supabase]);

  const checkDb = useCallback(async () => {
    if (!user) return;
    addLog('HEALTH_CHECK', 'pending', 'Checking database...');
    try {
      const [tc, mc] = await Promise.all([
        supabase.from('trades').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('market_data').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      addLog('HEALTH_CHECK', 'success', `DB OK: ${tc.count} trades, ${mc.count} market candles`);
      setMsg(`\u2713 DB healthy: ${tc.count} trades, ${mc.count} candles`);
      setDbStatus('connected');
    } catch (err: any) {
      addLog('HEALTH_CHECK', 'error', err.message);
      setMsg(`\u2717 ${err.message}`); setDbStatus('error');
    }
  }, [user, addLog, supabase]);

  const clearAll = useCallback(async () => {
    if (!user || !confirm('Are you sure you want to delete ALL your data? This cannot be undone.')) return;
    addLog('CLEAR', 'pending', 'Clearing all data...');
    try {
      await Promise.all([
        supabase.from('trade_tags').delete().eq('user_id', user.id),
        supabase.from('trade_notes').delete().eq('user_id', user.id),
        supabase.from('trades').delete().eq('user_id', user.id),
        supabase.from('market_data').delete().eq('user_id', user.id),
        supabase.from('chat_history').delete().eq('user_id', user.id),
        supabase.from('audit_log').delete().eq('user_id', user.id),
      ]);
      setTrades([]); setChat([]); setAuditLog([]); setMsg('\u2713 All data cleared.');
      addLog('CLEAR', 'success', 'All data cleared.');
    } catch (err: any) { setMsg(`\u2717 ${err.message}`); }
  }, [user, addLog, supabase]);

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = '/login'; };

  const dailyCols = ['account', 'date', 'trades', 'pnlUSD', 'pnlGBP', 'commUSD', 'commGBP'];
  const dailyLabels = ['Account', 'Date', 'Trades', 'P&L ($)', 'P&L (\u00a3)', 'Comm ($)', 'Comm (\u00a3)'];
  const weeklyCols = ['account', 'weekStart', 'trades', 'pnlUSD', 'pnlGBP', 'commUSD', 'commGBP'];
  const weeklyLabels = ['Account', 'Week Start', 'Trades', 'P&L ($)', 'P&L (\u00a3)', 'Comm ($)', 'Comm (\u00a3)'];

  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoadingTimeout(true), 15000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}>
      <div className="text-center">
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', margin: '0 auto 16px', animation: 'pulse-glow 1.5s ease-in-out infinite', boxShadow: '0 0 12px rgba(234,179,8,0.4)' }} />
        <span className="text-sm tracking-widest" style={{ color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3 }}>CONNECTING</span>
        {loadingTimeout && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <span className="text-xs" style={{ color: '#ef4444' }}>Connection is taking too long.</span>
            <div className="flex gap-3">
              <button onClick={() => window.location.reload()} className="text-xs px-4 py-2 rounded" style={{ background: '#eab308', color: '#09090b', border: 'none', cursor: 'pointer', fontWeight: 600, borderRadius: 6 }}>Retry</button>
              <button onClick={() => { window.location.href = '/login'; }} className="text-xs px-4 py-2 rounded" style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', borderRadius: 6 }}>Sign Out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = ['dashboard', 'daily', 'weekly', 'trades', 'insights', 'audit'];
  const dotColor = dbStatus === 'connected' ? '#22c55e' : dbStatus === 'error' ? '#ef4444' : '#eab308';
  const msgColor = msg.startsWith('\u2717') ? '#ef4444' : '#22c55e';

  return (
    <div className="min-h-screen" style={{ background: '#09090b', fontFamily: "'DM Sans', sans-serif", color: '#fafafa' }}>
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid #1e1e22', padding: '14px 24px' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#eab308' }}>PNL VAULT</span>
          <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'var(--font-mono)' }}>{trades.length}t</span>
        </div>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontSize: 11, padding: '5px 14px', borderRadius: 5, fontWeight: tab === t ? 600 : 400,
              background: tab === t ? (t === 'audit' ? 'rgba(234,179,8,0.15)' : '#eab308') : 'transparent',
              color: tab === t ? (t === 'audit' ? '#eab308' : '#09090b') : '#71717a',
              border: `1px solid ${tab === t ? '#eab308' : '#1e1e22'}`,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              letterSpacing: 0.5,
            }}>{t.toUpperCase()}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <select value={acctFilter} onChange={e => setAcctFilter(e.target.value)} style={{
            fontSize: 11, padding: '5px 10px', borderRadius: 5,
            background: '#0f0f11', color: '#a1a1aa', border: '1px solid #1e1e22', fontFamily: 'var(--font-mono)',
          }}>
            <option value="ALL">All Accounts</option>
            {accounts.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{
            fontSize: 11, padding: '5px 10px', borderRadius: 5,
            background: '#0f0f11', color: '#a1a1aa', border: '1px solid #1e1e22', fontFamily: 'var(--font-mono)',
          }}>
            {[['all', 'All Time'], ['today', 'Today'], ['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="flex items-center gap-2" style={{ borderLeft: '1px solid #1e1e22', paddingLeft: 14 }}>
            <span style={{ fontSize: 11, color: '#52525b' }}>{user?.email}</span>
            <button onClick={signOut} style={{
              fontSize: 10, padding: '4px 10px', borderRadius: 5,
              background: 'transparent', color: '#71717a', border: '1px solid #1e1e22', cursor: 'pointer',
              transition: 'all 0.15s',
            }}>Sign Out</button>
          </div>
        </div>
      </div>

      {/* IMPORT BAR */}
      <div className="flex items-center gap-2 flex-wrap" style={{ padding: '10px 24px', borderBottom: '1px solid #1e1e22' }}>
        <input ref={tradeRef} type="file" accept=".csv" onChange={handleTradeImport} className="hidden" />
        <input ref={mktRef} type="file" accept=".csv" onChange={handleMarketImport} className="hidden" />
        <button onClick={() => tradeRef.current?.click()} disabled={importing} style={{
          fontSize: 10, fontWeight: 600, padding: '5px 14px', borderRadius: 5, cursor: importing ? 'not-allowed' : 'pointer',
          background: '#eab308', color: '#09090b', border: 'none', opacity: importing ? 0.5 : 1, letterSpacing: 0.5,
        }}>IMPORT TRADES</button>
        <button onClick={() => mktRef.current?.click()} disabled={importing} style={{
          fontSize: 10, fontWeight: 600, padding: '5px 14px', borderRadius: 5, cursor: importing ? 'not-allowed' : 'pointer',
          background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.25)', opacity: importing ? 0.5 : 1, letterSpacing: 0.5,
        }}>IMPORT MARKET DATA</button>
        <button onClick={checkDb} style={{
          fontSize: 10, fontWeight: 600, padding: '5px 14px', borderRadius: 5, cursor: 'pointer',
          background: 'transparent', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)',
        }}>CHECK DB</button>
        <button onClick={clearAll} style={{
          fontSize: 10, fontWeight: 600, padding: '5px 14px', borderRadius: 5, cursor: 'pointer',
          background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
        }}>CLEAR ALL</button>
        {msg && <span style={{ fontSize: 11, color: msgColor, fontFamily: 'var(--font-mono)', maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg}</span>}
      </div>

      {/* CONTENT */}
      <div style={{ padding: '18px 24px' }}>
        {tab === 'audit' ? <AuditLog log={auditLog} onClear={async () => { if (user) { await supabase.from('audit_log').delete().eq('user_id', user.id); setAuditLog([]); } }} /> :
         !trades.length && tab !== 'audit' ? (
          <div className="text-center py-20" style={{ color: '#52525b' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(234,179,8,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>V</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#fafafa' }}>No trades yet</h2>
            <p style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.7, color: '#71717a' }}>Import your IBKR Flex Query CSV to get started. Your data is private and encrypted.</p>
          </div>
        ) : <>
          {tab === 'dashboard' && <DashboardView stats={stats} />}
          {tab === 'daily' && <TableView title="Daily Breakdown" data={stats?.daily || []} cols={dailyCols} labels={dailyLabels} />}
          {tab === 'weekly' && <TableView title="Weekly Breakdown" data={stats?.weekly || []} cols={weeklyCols} labels={weeklyLabels} />}
          {tab === 'trades' && <TradesView trades={filtered} tagDefs={tagDefs} onToggleTag={toggleTag} onSaveNotes={saveNotes} onAddTag={addCustomTag} selected={selectedTrade} onSelect={setSelectedTrade} />}
          {tab === 'insights' && <ChatView messages={chat} input={chatInput} loading={chatLoading} onInput={setChatInput} onSend={sendChat} stats={stats} />}
        </>}
      </div>
    </div>
  );
}
