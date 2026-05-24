# DEVLOG.md — BurnAudit AI

## Day 1 — 2026-05-21
**Hours worked:** 2
**What I did:** Set up the Next.js project from scratch. Created the pricing data file with real costs for each AI tool. Built the main audit form where users can add tools, pick plans, and enter how much they spend. Made the form save its state to localStorage so refreshing the page doesn't wipe everything.
**What I learned:** The audit math should never go through an AI model — hardcoded rules are more reliable and predictable. Also learned that reading localStorage has to happen inside a useEffect hook, otherwise Next.js throws hydration errors because the server and client render different things.
**Blockers / what I'm stuck on:** None. Everything worked as expected.
**Plan for tomorrow:** Write tests for the audit engine and set up GitHub Actions CI.

---

## Day 2 — 2026-05-22
**Hours worked:** 4
**What I did:** Wrote 5 unit tests for the audit engine using Vitest. Got the GitHub Actions CI pipeline working so tests run automatically on every push. Integrated the Gemini API to generate a short AI summary paragraph after each audit. Added a fallback summary that shows if the API fails or is down.
**What I learned:** When writing tests, your fake data has to match the exact shape of your real types — missing even one field breaks TypeScript. GitHub Actions needs `node-version` spelled exactly right or the workflow silently fails. Also switched from `npm ci` to `npm install` in CI because the lockfile was causing issues during development.
**Blockers / what I'm stuck on:** None by end of day. Fixed all the test and CI issues.
**Plan for tomorrow:** Build the shareable audit URL page and connect Supabase to save audit results.

---

## Day 3 — 2026-05-23
**Hours worked:** 5
**What I did:** Spent most of the day debugging why Supabase wasn't saving anything. Turned out every line in `.env.local` was commented out with `#` — so the app had no database URL and was silently sending requests to the Supabase homepage instead of my project. Fixed that, then also fixed the Supabase Row Level Security policies which were blocking inserts. Built out the `/audit/[id]` page that loads a saved audit and displays it publicly. Fixed a Next.js 16 issue where `params.id` has to be awaited before you can use it. Replaced all `console.error` calls with `console.warn` to stop Next.js dev tools from showing red error overlays for non-crash issues. Redesigned the homepage and audit form to look more professional.
**What I learned:** Commented-out env variables fail silently in the worst possible way — the app starts fine but makes requests to completely wrong URLs. Next.js dev tools intercept `console.error` and show a red crash overlay even if the app is still running fine; `console.warn` skips that. In Next.js 16, dynamic route params are a Promise and need `await` before you can access them.
**Blockers / what I'm stuck on:** Gemini API hit the free tier daily limit (20 requests/day for gemini-2.5-flash). Switching to gemini-2.0-flash which has a higher quota. Shareable URL feature is built but needs Supabase RLS policies applied to work end to end.
**Plan for tomorrow:** add email capture field.


## Day 4 — 2026-05-23
**Hours worked:** 2
**What I did:** Worked on MVP
**Plan for tomorrow:** work on 4th and 5th Mvp and add email capture field.