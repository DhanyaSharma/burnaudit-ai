# TESTS.md

## How to Run

```bash
npm run test
```

Uses Vitest. All tests are in `lib/audit-engine.test.ts`.

---

## Test List

| # | File | Test Name | What It Covers |
|---|------|-----------|----------------|
| 1 | lib/audit-engine.test.ts | detects overspend vs expected plan cost | Rule 1A — user paying more than planPrice × seats flags the difference |
| 2 | lib/audit-engine.test.ts | flags idle seats vs team size | Rule 1B — seats purchased > teamSize triggers seat reduction recommendation |
| 3 | lib/audit-engine.test.ts | flags team plan for 2 or fewer seats | Rule 1C — Team/Business plan for ≤2 users recommends downgrade to individual plan |
| 4 | lib/audit-engine.test.ts | detects Copilot redundancy with Cursor | Rule 3 — GitHub Copilot flagged as 100% duplicate when Cursor is in the stack |
| 5 | lib/audit-engine.test.ts | returns zero savings for efficient stack | Baseline — Claude Pro at correct price with correct seats returns $0 savings and low severity |
| 6 | lib/audit-engine.test.ts | recommends annual billing when available | Rule 2 — monthly billing on a plan with annual option triggers medium severity recommendation |
| 7 | lib/audit-engine.test.ts | suggests use-case alternative tool | Rule 3B — coding team on Gemini gets Cursor Pro suggested as alternative |

---

## Notes

- Tests use hardcoded mock `UserToolInput` objects that match the exact TypeScript type shape
- Each test calls `runAudit()` directly and asserts on the returned `AuditRecommendation` array
- Tests run in under 1 second — no network calls, no database, pure function
- CI runs these on every push to main via `.github/workflows/ci.yml`