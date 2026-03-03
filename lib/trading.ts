// ═══════════════════════════════════════════════════════════════════════════════
// TRADING LOGIC — parsers, FIFO matching, analytics
// ═══════════════════════════════════════════════════════════════════════════════

export const FUTURES_MULT: Record<string, number> = {
  MNQ: 2, NQ: 20, ES: 50, MES: 5, RTY: 50, M2K: 10,
  YM: 5, MYM: 0.5, CL: 1000, GC: 100, SI: 5000,
};

export const r2 = (v: number) => Math.round(v * 100) / 100;
export const fmt = (v: number) => v === Infinity ? '∞' : typeof v === 'number' ? v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v;
export const fH = (h: number) => `${String(h).padStart(2, '0')}:00`;
export const pc = (v: number) => v > 0 ? 'text-win' : v < 0 ? 'text-lose' : 'text-dim';

export interface Trade {
  id: string; accountId: string; accountAlias: string; symbol: string; assetClass: string;
  direction: string; currency: string; mult: number; fxRate: number;
  openTime: string; closeTime: string; openDate: string; closeDate: string;
  holdMinutes: number; quantity: number; avgOpen: number; avgClose: number;
  grossPnl: number; commission: number; commGBP: number; netPnl: number; netPnlGBP: number;
  putCall?: string; strike?: string; expiry?: string; exchange?: string;
  description?: string; underlying?: string;
  mae?: number | null; mfe?: number | null; captureRatio?: number | null;
  postContinuation?: number | null;
  tags: string[]; notes: string;
}

export function parseDateTime(val: string | undefined | null): Date | null {
  if (!val || val === '' || val === 'nan') return null;
  const s = String(val).trim();
  if (/^\d{8};\d{6}$/.test(s)) {
    const [d, t] = s.split(';');
    return new Date(`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}T${t.slice(0,2)}:${t.slice(2,4)}:${t.slice(4,6)}Z`);
  }
  if (/^\d{8}$/.test(s)) return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T00:00:00Z`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function parseCSV(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let hi = 0;
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    if (lines[i].includes('Symbol') && (lines[i].includes('DateTime') || lines[i].includes('TradeDate'))) { hi = i; break; }
  }
  const hdrs = lines[hi].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  for (let i = hi + 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (vals.length < hdrs.length / 2) continue;
    const row: Record<string, string> = {};
    hdrs.forEach((h, j) => { row[h] = vals[j] || ''; });
    rows.push(row);
  }
  return rows;
}

export function cleanRows(rows: Record<string, string>[]) {
  return rows.filter(r => {
    if (!/^[A-Z]{1,2}\d{5,8}$/.test((r.ClientAccountID || '').trim())) return false;
    if (!(r.Symbol || '').trim()) return false;
    if ((r.LevelOfDetail || '').trim() !== 'EXECUTION') return false;
    if ((r.TransactionType || '').trim() !== 'ExchTrade') return false;
    const sym = (r.Symbol || '').toUpperCase();
    const ac = (r.AssetClass || '').toUpperCase();
    if ((ac === 'CASH' || r.TransactionType === 'FxTrade') && /GBP\.?USD|USD\.?GBP/i.test(sym)) return false;
    return true;
  });
}

export function normalizeExec(row: Record<string, string>) {
  const am: Record<string, string> = { B: 'BUY', BOT: 'BUY', S: 'SELL', SLD: 'SELL' };
  const action = am[(row['Buy/Sell'] || '').trim().toUpperCase()] || (row['Buy/Sell'] || '').trim().toUpperCase();
  const qty = Math.abs(parseFloat(row.Quantity) || 0);
  const price = parseFloat(row.TradePrice) || 0;
  const comm = Math.abs(parseFloat(row.IBCommission) || 0);
  const dt = parseDateTime(row.DateTime || row.TradeDate);
  const fx = parseFloat(row.FXRateToBase) || 1;
  let mult = parseFloat(row.Multiplier) || 1;
  if (mult <= 0) mult = 1;
  const ac = (row.AssetClass || 'STK').trim().toUpperCase();
  if (ac === 'FUT' && mult === 1) {
    const root = (row.Symbol || '').replace(/[^A-Za-z]/g, '').toUpperCase();
    mult = FUTURES_MULT[root] || 1;
  }
  return {
    accountId: (row.ClientAccountID || '').trim(),
    accountAlias: (row.AccountAlias || '').trim() || (row.ClientAccountID || '').trim(),
    symbol: (row.Symbol || '').trim(), assetClass: ac, action,
    signedQty: action === 'BUY' ? qty : -qty,
    price, commission: comm, mult, fxRate: fx, datetime: dt,
    tradeDate: dt ? dt.toISOString().slice(0, 10) : '',
    putCall: row['Put/Call'] || '', strike: row.Strike || '',
    expiry: row.Expiry || '', exchange: row.Exchange || '',
    description: row.Description || '', underlying: row.UnderlyingSymbol || '',
    currency: (row.CurrencyPrimary || 'USD').trim(),
  };
}

export function fifoMatch(executions: ReturnType<typeof normalizeExec>[]) {
  const grouped: Record<string, typeof executions> = {};
  executions.forEach(e => { const k = `${e.accountId}|${e.symbol}`; (grouped[k] = grouped[k] || []).push(e); });
  const trades: any[] = [];

  Object.values(grouped).forEach(execs => {
    execs.sort((a: any, b: any) => (a.datetime || 0) - (b.datetime || 0));
    let lots: any[] = [], pos = 0;

    execs.forEach((ex: any) => {
      const { signedQty: sq, price: p, commission: c, mult: m, datetime: ts } = ex;
      const meta = {
        symbol: ex.symbol, accountId: ex.accountId, accountAlias: ex.accountAlias,
        assetClass: ex.assetClass, currency: ex.currency, mult: m, fxRate: ex.fxRate,
        putCall: ex.putCall, strike: ex.strike, expiry: ex.expiry, exchange: ex.exchange,
        description: ex.description, underlying: ex.underlying,
      };

      if (pos === 0) { lots = [{ qty: sq, price: p, comm: c, time: ts, ...meta }]; pos = sq; }
      else if ((pos > 0 && sq > 0) || (pos < 0 && sq < 0)) { lots.push({ qty: sq, price: p, comm: c, time: ts, ...meta }); pos += sq; }
      else {
        let rem = Math.abs(sq), cv = 0, oc = 0, ocm = 0, fq = 0;
        const ot = lots.length ? lots[0].time : ts;
        while (rem > 0 && lots.length) {
          const lot = lots[0], lq = Math.abs(lot.qty), fill = Math.min(rem, lq);
          oc += fill * lot.price * m; cv += fill * p * m; ocm += lot.comm * (fill / lq); fq += fill; rem -= fill;
          if (fill >= lq) lots.shift(); else { lots[0].qty += sq < 0 ? fill : -fill; lots[0].comm *= (1 - fill / lq); }
        }
        const dir = pos > 0 ? 'LONG' : 'SHORT';
        const gP = dir === 'LONG' ? cv - oc : oc - cv;
        const tC = ocm + Math.abs(c), nP = gP - tC;
        const fx = meta.fxRate || 1;
        const hMs = ts && ot ? (ts as any) - (ot as any) : 0;

        trades.push({
          ...meta, direction: dir,
          openTime: ot ? ot.toISOString() : '', closeTime: ts ? ts.toISOString() : '',
          openDate: ot ? ot.toISOString().slice(0, 10) : '', closeDate: ts ? ts.toISOString().slice(0, 10) : '',
          holdMinutes: Math.round(hMs / 60000 * 10) / 10, quantity: fq,
          avgOpen: fq ? Math.round(oc / (fq * m) * 1e6) / 1e6 : 0,
          avgClose: fq ? Math.round(cv / (fq * m) * 1e6) / 1e6 : 0,
          grossPnl: r2(gP), commission: r2(tC), commGBP: r2(tC * fx),
          netPnl: r2(nP), netPnlGBP: r2(nP * fx),
          id: `${meta.accountId}-${meta.symbol}-${ot ? ot.toISOString() : 'x'}-${dir}`,
        });
        pos += sq;
        if (Math.abs(pos) < 1e-9) { pos = 0; lots = []; }
      }
    });
  });

  return trades.sort((a, b) => a.openTime.localeCompare(b.openTime));
}

export function parseMarketCSV(text: string, symbol: string, timeframe: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const find = (...names: string[]) => hdrs.findIndex(h => names.some(n => h.includes(n)));
  const iT = find('time', 'date', 'datetime', 'timestamp');
  const iO = find('open'), iH = find('high'), iL = find('low'), iC = find('close'), iV = find('volume', 'vol');
  if (iT < 0 || iC < 0) return [];

  const candles: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    let raw = vals[iT] || '';
    raw = raw.replace(/\s+(US\/\w+|Europe\/\w+|Asia\/\w+|[A-Z]{2,5})$/i, '').trim();
    let ts: Date;
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (m) { const [, y, mo, d, h, mi, s] = m; ts = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`); }
    else { ts = new Date(raw); }
    if (!ts || isNaN(ts.getTime())) continue;
    candles.push({
      symbol: symbol.toUpperCase(), timeframe, time: ts.toISOString(),
      open: parseFloat(vals[iO]) || 0, high: parseFloat(vals[iH]) || 0,
      low: parseFloat(vals[iL]) || 0, close: parseFloat(vals[iC]) || 0,
      volume: parseInt(vals[iV]) || 0,
    });
  }
  return candles;
}

export function tradeToRow(t: any, userId: string) {
  return {
    id: t.id, user_id: userId, account_id: t.accountId, account_alias: t.accountAlias,
    symbol: t.symbol, asset_class: t.assetClass, direction: t.direction,
    currency: t.currency, mult: t.mult, fx_rate: t.fxRate,
    open_time: t.openTime || null, close_time: t.closeTime || null,
    open_date: t.openDate || null, close_date: t.closeDate || null,
    hold_minutes: t.holdMinutes, quantity: t.quantity,
    avg_open: t.avgOpen, avg_close: t.avgClose, gross_pnl: t.grossPnl,
    commission: t.commission, comm_gbp: t.commGBP,
    net_pnl: t.netPnl, net_pnl_gbp: t.netPnlGBP,
    put_call: t.putCall, strike: t.strike, expiry: t.expiry,
    exchange: t.exchange, description: t.description, underlying: t.underlying,
  };
}

export function rowToTrade(r: any): Trade {
  return {
    id: r.id, accountId: r.account_id, accountAlias: r.account_alias,
    symbol: r.symbol, assetClass: r.asset_class, direction: r.direction,
    currency: r.currency, mult: +r.mult, fxRate: +r.fx_rate,
    openTime: r.open_time || '', closeTime: r.close_time || '',
    openDate: r.open_date || '', closeDate: r.close_date || '',
    holdMinutes: +r.hold_minutes || 0, quantity: +r.quantity,
    avgOpen: +r.avg_open, avgClose: +r.avg_close,
    grossPnl: +r.gross_pnl, commission: +r.commission, commGBP: +r.comm_gbp,
    netPnl: +r.net_pnl, netPnlGBP: +r.net_pnl_gbp,
    putCall: r.put_call || '', strike: r.strike || '', expiry: r.expiry || '',
    exchange: r.exchange || '', description: r.description || '',
    underlying: r.underlying || '',
    tags: r._tags || [], notes: r._notes || '',
  };
}

export function computeStats(trades: Trade[]) {
  if (!trades.length) return null;
  const w = trades.filter(t => t.netPnl > 0), l = trades.filter(t => t.netPnl <= 0);
  const tP = trades.reduce((s, t) => s + t.netPnl, 0), tPG = trades.reduce((s, t) => s + t.netPnlGBP, 0);
  const tC = trades.reduce((s, t) => s + t.commission, 0), tCG = trades.reduce((s, t) => s + t.commGBP, 0);
  const wS = w.reduce((s, t) => s + t.netPnl, 0), lS = Math.abs(l.reduce((s, t) => s + t.netPnl, 0));
  const byS: any = {}, byH: any = {}, byD: any = {}, byW: any = {}, byTag: any = {};

  trades.forEach(t => {
    if (!byS[t.symbol]) byS[t.symbol] = { pnl: 0, count: 0, wins: 0 };
    byS[t.symbol].pnl += t.netPnl; byS[t.symbol].count++; if (t.netPnl > 0) byS[t.symbol].wins++;

    const h = t.openTime ? new Date(t.openTime).getUTCHours() : null;
    if (h !== null) { if (!byH[h]) byH[h] = { pnl: 0, count: 0, wins: 0 }; byH[h].pnl += t.netPnl; byH[h].count++; if (t.netPnl > 0) byH[h].wins++; }

    const d = t.closeDate || t.openDate, ac = t.accountAlias || t.accountId;
    if (d) {
      const k = `${ac}|${d}`;
      if (!byD[k]) byD[k] = { account: ac, date: d, trades: 0, pnlUSD: 0, pnlGBP: 0, commUSD: 0, commGBP: 0 };
      byD[k].trades++; byD[k].pnlUSD += t.netPnl; byD[k].pnlGBP += t.netPnlGBP; byD[k].commUSD += t.commission; byD[k].commGBP += t.commGBP;

      const dd = new Date(d), day = dd.getDay(), diff = dd.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(dd); mon.setDate(diff); const wk = mon.toISOString().slice(0, 10);
      const k2 = `${ac}|${wk}`;
      if (!byW[k2]) byW[k2] = { account: ac, weekStart: wk, trades: 0, pnlUSD: 0, pnlGBP: 0, commUSD: 0, commGBP: 0 };
      byW[k2].trades++; byW[k2].pnlUSD += t.netPnl; byW[k2].pnlGBP += t.netPnlGBP; byW[k2].commUSD += t.commission; byW[k2].commGBP += t.commGBP;
    }

    if (t.tags) t.tags.forEach(tag => {
      if (!byTag[tag]) byTag[tag] = { pnl: 0, count: 0, wins: 0 };
      byTag[tag].pnl += t.netPnl; byTag[tag].count++; if (t.netPnl > 0) byTag[tag].wins++;
    });
  });

  const sE = Object.entries(byS).sort((a: any, b: any) => b[1].pnl - a[1].pnl);
  const hE = Object.entries(byH).sort((a: any, b: any) => b[1].pnl - a[1].pnl);

  return {
    totalTrades: trades.length, winners: w.length, losers: l.length,
    winRate: trades.length ? r2(w.length / trades.length * 100) : 0,
    totalPnl: r2(tP), totalPnlGBP: r2(tPG), totalComm: r2(tC), totalCommGBP: r2(tCG),
    avgWin: w.length ? r2(wS / w.length) : 0, avgLoss: l.length ? r2(-lS / l.length) : 0,
    profitFactor: lS ? r2(wS / lS) : Infinity, expectancy: trades.length ? r2(tP / trades.length) : 0,
    largestWin: Math.max(...trades.map(t => t.netPnl)),
    largestLoss: Math.min(...trades.map(t => t.netPnl)),
    avgHold: r2(trades.reduce((s, t) => s + (t.holdMinutes || 0), 0) / trades.length),
    bestSymbol: sE[0] ? { name: (sE[0] as any)[0], pnl: r2((sE[0] as any)[1].pnl), count: (sE[0] as any)[1].count } : null,
    worstSymbol: sE.length ? { name: (sE.at(-1) as any)[0], pnl: r2((sE.at(-1) as any)[1].pnl), count: (sE.at(-1) as any)[1].count } : null,
    bestHour: hE[0] ? { hour: +(hE[0] as any)[0], pnl: r2((hE[0] as any)[1].pnl), wr: r2((hE[0] as any)[1].wins / (hE[0] as any)[1].count * 100) } : null,
    bySymbol: byS, byHour: byH, byTag,
    daily: Object.values(byD).map((d: any) => ({ ...d, pnlUSD: r2(d.pnlUSD), pnlGBP: r2(d.pnlGBP), commUSD: r2(d.commUSD), commGBP: r2(d.commGBP) })).sort((a: any, b: any) => a.date.localeCompare(b.date)),
    weekly: Object.values(byW).map((w: any) => ({ ...w, pnlUSD: r2(w.pnlUSD), pnlGBP: r2(w.pnlGBP), commUSD: r2(w.commUSD), commGBP: r2(w.commGBP) })).sort((a: any, b: any) => a.weekStart.localeCompare(b.weekStart)),
  };
}
