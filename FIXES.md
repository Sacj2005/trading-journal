# Low-Hanging Fixes Backlog

Prioritised by impact and effort. Pick items per sprint.

---

## Sprint 1 — Security & Broken Functionality

### [S1-1] Claude API call missing auth header (BROKEN)
- **File:** `app/dashboard/page.tsx:227-229`
- **Issue:** `fetch('https://api.anthropic.com/v1/messages')` has no `x-api-key` or `anthropic-version` header. Also calls Claude directly from the browser — API key would be exposed client-side.
- **Fix:** Move to a server-side API route (`app/api/chat/route.ts`). Pass trade context from client, call Claude server-side with the key from env.
- **Effort:** Medium

### [S1-2] forgot-password uses `admin.listUsers()` — fetches ALL users
- **File:** `app/api/auth/forgot-password/route.ts:24,55`
- **Issue:** `listUsers()` returns paginated results (default 50). Will break once user count exceeds page size, and is inefficient.
- **Fix:** Use `serviceSupabase.auth.admin.getUserByEmail(email)` or query `auth.users` table with `.eq('email', email).maybeSingle()`.
- **Effort:** Low

### [S1-3] `dangerouslySetInnerHTML` in ChatView (XSS risk)
- **File:** `components/ChatView.tsx:57`
- **Issue:** AI responses rendered via `dangerouslySetInnerHTML`. If Claude's response contains HTML/script tags, they execute.
- **Fix:** Use a safe markdown renderer (e.g. `react-markdown`) or sanitize with DOMPurify before injecting.
- **Effort:** Low

---

## Sprint 2 — Data Integrity & Robustness

### [S2-1] FIFO import missing dedup
- **File:** `app/dashboard/page.tsx:120`
- **Issue:** `fifoMatch(execs)` can produce duplicate trade IDs. The dropped charts commit had a fix: `[...new Map(fifoMatch(execs).map(t => [t.id, t])).values()]`.
- **Fix:** Add the Map dedup one-liner after `fifoMatch()`.
- **Effort:** Low

### [S2-2] `clearAll` deletes in parallel with FK dependencies
- **File:** `app/dashboard/page.tsx:266-272`
- **Issue:** `trade_tags` and `trade_notes` reference `trades`. Deleting all in parallel may fail if FK constraints are enforced. Delete child tables first.
- **Fix:** Sequential delete: tags/notes first, then trades, then market_data/chat/audit.
- **Effort:** Low

### [S2-3] Audit log `addLog` fire-and-forget with no error handling
- **File:** `app/dashboard/page.tsx:38`
- **Issue:** `.then()` with no `.catch()`. Silently fails if DB insert errors.
- **Fix:** Add `.catch(() => {})` or log the error.
- **Effort:** Low

---

## Sprint 3 — UX Polish

### [S3-1] No feedback when sign-in fails due to unconfirmed email
- **File:** `app/login/page.tsx`
- **Issue:** Supabase returns "Email not confirmed" but user doesn't know to check email. No resend option.
- **Fix:** Detect this specific error, show a helpful message with a resend-confirmation button.
- **Effort:** Medium

### [S3-2] Loading screen has no spinner animation
- **File:** `app/dashboard/page.tsx:294-309`
- **Issue:** Just static text "CONNECTING TO DATABASE..." — looks like it might be frozen.
- **Fix:** Add a simple CSS pulse/spin animation.
- **Effort:** Low

### [S3-3] `msg` status bar never auto-clears
- **File:** `app/dashboard/page.tsx:25,358`
- **Issue:** Import success/error messages persist until the next action. Stale messages are confusing.
- **Fix:** Auto-clear `msg` after 5-8 seconds with a `useEffect` + `setTimeout`.
- **Effort:** Low

---

## Sprint 4 — Charts & Features

### [S4-1] Re-add Charts tab
- **Commit ref:** `cf71058` (ChartView.tsx + recharts dep)
- **Issue:** Charts were dropped during rollback. The component itself was fine.
- **Fix:** Cherry-pick the ChartView component and recharts dependency. Add 'charts' back to the tabs array.
- **Effort:** Low

### [S4-2] Chat history limited to 50 messages, no pagination
- **File:** `app/dashboard/page.tsx:57`
- **Issue:** `.limit(50)` on chat_history. Old messages are lost from view.
- **Fix:** Add "Load more" button or virtual scroll.
- **Effort:** Medium

### [S4-3] No username display in header (shows email only)
- **File:** `app/dashboard/page.tsx:344`
- **Issue:** Header shows `user?.email` but user_profiles has a `username` field.
- **Fix:** Fetch username from user_profiles on mount, display it.
- **Effort:** Low

---

## Icebox (nice-to-have, no rush)

- **Type safety:** Dashboard uses `any` extensively. Add proper TypeScript interfaces.
- **Responsive:** Header wraps awkwardly on mobile. Needs hamburger menu or collapsible tabs.
- **Session refresh:** No `onAuthStateChange` listener on dashboard. Session expiry shows stale UI.
- **Rate limiting:** API routes (`/api/auth/*`) have no rate limiting. Vulnerable to brute-force.
- **Password strength meter:** Sign-up only checks length >= 8. Add visual strength indicator.
