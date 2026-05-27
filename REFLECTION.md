# REFLECTION.md

## 1. The hardest bug I hit this week

The hardest bug was the Supabase save silently failing for two full days. Every time I clicked "Generate Optimization Report", the audit ran fine, the AI summary loaded, but the shareable URL never appeared. No crash, no obvious error — just `Database persistence warning: Failed to save audit` in the browser overlay.

My first hypothesis was a column name mismatch. I checked the Supabase table schema against the insert payload — everything matched. My second hypothesis was a TypeScript type error causing a malformed request body. I added `console.log(body)` before the insert — the payload looked correct.

What broke the debugging loop was that `console.error` in the route was being intercepted by Next.js dev tools and displayed as a browser overlay, which made me think it was a frontend error. When I switched to `console.warn`, the full Supabase error appeared in the terminal for the first time: the response body was a full HTML page — the Supabase dashboard homepage.

That's when I realized the URL was wrong. I opened `.env.local` and found that every single line was prefixed with `#`. The entire file was commented out. The Supabase client was initializing with `undefined` as the URL, falling back to hitting `https://supabase.com`, and receiving the dashboard HTML as the "error message". After fixing the env file and running the SQL to enable RLS policies, it worked immediately.

The lesson: when an API client returns HTML instead of JSON, the URL is wrong — don't debug the code, debug the config.

---

## 2. A decision I reversed mid-week

I initially built the audit engine to call Gemini for every recommendation — the idea was to make the reasoning more natural and personalized per tool. After running a few tests, I reversed this completely.

The problems were: latency (6-8 seconds to generate 4 recommendations), inconsistency (the same inputs produced different savings numbers on different runs because the model would sometimes round differently), and cost (each audit burned through 4 API calls instead of 1).

More importantly, a finance person reading AI-generated reasoning like "Cursor may potentially offer some savings depending on your workflow" would not agree with it. Hardcoded rules that say "at 2 seats, you're paying $60/mo for admin features you don't use — downgrading saves $40/mo" are specific, verifiable, and defensible.

I moved all the math to deterministic TypeScript rules and kept Gemini only for the narrative summary paragraph where variation is acceptable and speed matters less. This is also what the assignment was testing for — knowing when not to use AI.

---

## 3. What I'd build in week 2

The most valuable thing missing from the current product is a benchmark mode: "your AI spend per developer is $X — companies your size average $Y." Right now the tool only tells users what they're overpaying relative to vendor pricing. It doesn't tell them how they compare to their peers, which is a more visceral motivator.

I'd build this by collecting anonymized spend-per-seat data from audits (already in Supabase) and computing percentile benchmarks by team size and use case. "Your coding team spends $47/developer/month on AI tools — the median for coding teams your size is $28." That number makes the problem real in a way that raw savings figures don't.

I'd also add a scheduled email: re-run the audit automatically every 30 days when vendors update pricing, and email users when their stack becomes newly inefficient. This turns a one-time tool into a recurring touchpoint and a legitimate reason for Credex to follow up.

---

## 4. How I used AI tools

I used Claude (Sonnet) as my primary development assistant throughout the week. Specific uses:

**What I used it for:** Generating boilerplate (the initial Next.js component structure, Supabase client setup, GitHub Actions CI config), debugging TypeScript errors by pasting the error and asking what's wrong, writing the jsPDF export logic (I described what I wanted the PDF to look like and it generated the layout code), and drafting the markdown documentation files.

**What I didn't trust it with:** The audit engine pricing logic. I verified every number against official vendor pricing pages myself and built the rules based on my own understanding of how the plans differ. The AI would occasionally suggest savings logic that sounded plausible but didn't hold up — for example suggesting that Claude Pro is always better than ChatGPT Plus without accounting for use case.

**One specific time the AI was wrong:** When I asked it to fix the Gemini rate limit error, it suggested switching to `gemini-1.5-flash`. I looked up the current model list and that model has been deprecated — the correct model is `gemini-2.0-flash`. The AI's training data was stale on this specific detail. I caught it by checking the Gemini API documentation directly before making the change.

---

## 5. Self-ratings

**Discipline: 6/10**
I didn't start on day 1 — lost the first day to setup and environment issues that ate more time than they should have. Commits are spread across the week but not as evenly as I'd like.

**Code quality: 7/10**
The audit engine is clean and well-commented with clear rule separation. The frontend components got messier as I added features quickly — `audit-form.tsx` is too long and should be split into smaller components. Types are used consistently throughout.

**Design sense: 7/10**
The dark minimal aesthetic is intentional and consistent. The results page is screenshot-worthy. Mobile layout needs more testing — some of the grid layouts break at narrow widths.

**Problem-solving: 8/10**
The `.env.local` bug took too long to find, but once I had the right diagnostic information I solved it quickly. Generally good at forming hypotheses and testing them systematically rather than randomly changing things.

**Entrepreneurial thinking: 6/10**
I understand the product and the Credex business model well enough to build the right features. The Credex CTA placement and the lead capture timing (after value is shown, not before) are deliberate and correct. Where I fell short is the user interviews — I only had time for one real conversation before writing this reflection, and the GTM plan is more theoretical than I'd like.