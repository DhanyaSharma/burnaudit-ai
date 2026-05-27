# DEVLOG.md — BurnAudit AI

## Day 1 — 2026-05-21
Hours worked: 2
What I did: Set up the Next.js project from scratch. Created the pricing data file with real costs for each AI tool. Built the main audit form where users can add tools, pick plans, and enter how much they spend. Made the form save its state to localStorage so refreshing the page doesn't wipe everything.
What I learned: The audit math should never go through an AI model — hardcoded rules are more reliable and predictable. Also learned that reading localStorage has to happen inside a useEffect hook, otherwise Next.js throws hydration errors because the server and client render different things.
Blockers / what I'm stuck on: None. Everything worked as expected.
Plan for tomorrow: Write tests for the audit engine and set up GitHub Actions CI.

---

## Day 2 — 2026-05-22
Hours worked: 4
What I did: Wrote 5 unit tests for the audit engine using Vitest. Got the GitHub Actions CI pipeline working so tests run automatically on every push. Integrated the Gemini API to generate a short AI summary paragraph after each audit. Added a fallback summary that shows if the API fails or is down.
What I learned: When writing tests, your fake data has to match the exact shape of your real types — missing even one field breaks TypeScript. GitHub Actions needs `node-version` spelled exactly right or the workflow silently fails. Also switched from `npm ci` to `npm install` in CI because the lockfile was causing issues during development.
Blockers / what I'm stuck on: None by end of day. Fixed all the test and CI issues.
Plan for tomorrow: Build the shareable audit URL page and connect Supabase to save audit results.

---

## Day 3 — 2026-05-23
Hours worked: 5
What I did: Spent most of the day debugging why Supabase wasn't saving anything. Turned out every line in `.env.local` was commented out with `#` — so the app had no database URL and was silently sending requests to the Supabase homepage instead of my project. Fixed that, then also fixed the Supabase Row Level Security policies which were blocking inserts. Built out the `/audit/[id]` page that loads a saved audit and displays it publicly. Fixed a Next.js 16 issue where `params.id` has to be awaited before you can use it. Replaced all `console.error` calls with `console.warn` to stop Next.js dev tools from showing red error overlays for non-crash issues. Redesigned the homepage and audit form to look more professional.
What I learned: Commented-out env variables fail silently in the worst possible way — the app starts fine but makes requests to completely wrong URLs. Next.js dev tools intercept `console.error` and show a red crash overlay even if the app is still running fine; `console.warn` skips that. In Next.js 16, dynamic route params are a Promise and need `await` before you can access them.
Blockers / what I'm stuck on: Gemini API hit the free tier daily limit (20 requests/day for gemini-2.5-flash). Thinking Switching to gemini-2.0-flash which has a higher quota. 
Plan for tomorrow: add email capture field.

## Day 4 — 2026-05-23
Hours worked: 3
What I did: Worked on MVP
Plan for tomorrow: work on 4th and 5th Mvp and add email capture field.

## Day 5 — 2026-05-24
Hours worked: 2
What I did: Worked on MVP and bonus; Completed with the project and deployed it on vercel

## Day 6 — 2026-05-26
Hours worked: 2
What I did: Deployed the full app to Vercel. Connected the GitHub repo to Vercel, configured all environment variables (GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, RESEND_API_KEY, NEXT_PUBLIC_SITE_URL), and triggered the first production build. Fixed a build error where jsPDF was being imported at the top level instead of dynamically — works fine in dev but breaks the Vercel build. Tested the live URL end to end: ran a full audit, checked the shareable link loaded correctly, downloaded the PDF, confirmed the AI summary was generating. Updated NEXT_PUBLIC_SITE_URL to the actual Vercel domain so shareable links point to the right place.
What I learned: Environment variables that work locally don't automatically transfer to Vercel — you have to add them manually in the project settings. Also learned that some npm packages that work in a Node.js dev environment don't work in Vercel's serverless edge environment and need to be imported differently.
Plan for tomorrow: Write all required markdown documentation files and submit.

## Day 7 — 2026-05-27
Hours worked: 3
What I did: Wrote all required documentation files — README, ARCHITECTURE, REFLECTION, PRICING_DATA, PROMPTS, GTM, ECONOMICS, USER_INTERVIEWS, LANDING_COPY, METRICS, TESTS, and completed the DEVLOG. Fixed PRICING_DATA.md which had accidentally been saved as an empty file. Renamed Architect.md to ARCHITECTURE.md (had the wrong filename). Added screenshots to README. Verified all 12 required files are present at the repo root. Ran the test suite one final time to confirm everything passes. Checked git log to confirm commits span at least 5 distinct calendar days. Pushed final commit and submitted.
What I learned: The documentation files take longer to write well than I expected — especially REFLECTION and ECONOMICS which require actually thinking through decisions and numbers rather than just describing what was built. The user interviews turned out to be the most useful thing I did all week. Two conversations changed actual features in the product.
Blockers / what I'm stuck on: None.
