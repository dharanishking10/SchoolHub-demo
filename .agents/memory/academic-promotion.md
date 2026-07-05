---
name: Academic promotion
description: Implementation notes for the EduGov Connect academic year promotion feature
---

## What it does
Promotes all ACTIVE students one class upward (VI→VII … XI→XII) and marks Std XII students as GRADUATED in a single atomic transaction. Also advances the school's `academicYear` field.

## Concurrency guard pattern
Uses a Prisma interactive transaction (`$transaction(async tx => { ... })`):
1. Pre-fetch school profile **outside** the transaction to get `currentYear`.
2. Re-fetch school profile **inside** the transaction (`tx.schoolProfile.findUnique`).
3. If the re-fetched year ≠ `currentYear`, throw `ALREADY_PROMOTED` → 409.

**Why:** PostgreSQL READ_COMMITTED (Prisma default) means each statement sees committed rows at execution time. If TX1 commits before TX2's inner re-read, TX2 sees the updated year and aborts correctly. This guards against simultaneous double-clicks / concurrent API calls.

**Note:** Sequential calls (different academic years) both succeed — that is correct. The UI prevents accidental re-promotion by displaying a success screen with no Promote button.

## Class promotion order matters
Graduate XII **before** promoting XI→XII, otherwise newly promoted XII students would also be graduated in the same transaction.

## Year format
`nextAcademicYear("2026-2027")` → `"2027-2028"`. Returns the same string if unparseable; `canPromote` flag exposed in preview response; UI shows a red warning and disables the button when `canPromote === false`.

## Files
- `server/src/routes/school.ts` — GET /promotion/preview + POST /promote
- `src/pages/headmaster/AcademicPromotion.tsx` — full promotion page
- `src/pages/headmaster/HeadmasterLayout.tsx` — Promotion nav item (TrendingUp icon)
- `src/App.tsx` — /promotion route under headmaster layout
