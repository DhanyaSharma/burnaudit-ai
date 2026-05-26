# ARCHITECTURE.md

## System Diagram


---

## Data Flow

**Step 1 — User input**
User fills the form: tools, plans, seats, monthly spend, team size, use case. State is persisted to `localStorage` on every change so reloads don't wipe the form.

**Step 2 — Audit engine (instant, client-side)**
`runAudit(stack, teamSize, useCase)` in `lib/audit-engine.ts` runs synchronously in the browser. No network call. Applies 4 rule categories in order: overspend detection, seat count vs team size, annual billing optimization, redundant tool detection + alternative suggestions. Returns an array of `AuditRecommendation` objects with savings amounts and reasoning strings.

**Step 3 — AI summary (async, server-side)**
`POST /api/summary` sends the recommendations, team size, and use case to Gemini 2.0 Flash. Returns a ~100-word personalized paragraph. Falls back to a templated string if the API fails.

**Step 4 — Save to Supabase (async, server-side)**
`POST /api/save-audit` inserts the full audit (stack, recommendations, summary, savings totals, lead fields) into Supabase. Rate limited at 5 requests/IP/minute. Honeypot field rejects bots. Returns the UUID of the inserted row.

**Step 5 — Email (async, non-blocking)**
If an email address was captured, Resend sends a transactional confirmation with the savings numbers and a link to the shareable audit URL. High-savings audits get a Credex outreach note.

**Step 6 — Shareable URL**
`/audit/[id]` is a Next.js server component. It fetches the audit by ID from Supabase, explicitly excluding PII fields (email, company_name, role) from the SELECT query. `generateMetadata()` builds Open Graph and Twitter Card tags dynamically. `/api/og` returns an SVG image with the savings numbers for link previews.

---

## Why This Stack

**Next.js 16 (App Router)**
Server components make the shareable audit page fast and SEO-friendly — data is fetched server-side, OG tags are correct on first load, no client-side loading spinners for the public URL. API routes handle backend logic without a separate server.

**TypeScript**
Strongly typed audit engine rules catch pricing data mismatches at compile time. `AuditRecommendation` and `UserToolInput` types ensure the form, engine, and database stay in sync.

**Supabase**
Postgres with a REST API and Row Level Security. Free tier handles the expected audit volume. RLS ensures the public SELECT on `/audit/[id]` can never accidentally return email or company data even if the query changes.

**Tailwind CSS**
Utility-first styling with no build step or CSS files to maintain. Dark theme achieved with opacity modifiers (`bg-white/[0.04]`) rather than a separate color palette.

**Gemini 2.0 Flash**
1,500 free requests/day. Fast enough (under 3 seconds) to feel responsive. The fallback templated summary means the product works even when the API is down.

**Vercel**
Zero-config Next.js deployment. Edge network for the OG image route. Automatic preview deployments on every push.
