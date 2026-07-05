---
name: Timetable module
description: Implementation notes and gotchas for the EduGov Connect timetable feature
---

## Status
Fully implemented (Teacher CRUD, Headmaster full management, Student read-only).

## Schema changes applied
- Added `roomNumber String @default("")` to Timetable model.
- Added `@@unique([teacherId, day, period])` (alongside existing `@@unique([className, section, day, period])`).
- Applied via `prisma db push --accept-data-loss` (not `migrate dev` — Replit environment is non-interactive).

**Why:** `prisma migrate dev` requires interactive TTY; always use `db push` in this environment.

## Security pattern: student scoping must hard-fail
In the GET handler for STUDENT role, if `prisma.student.findUnique` returns null, the code must return 403 immediately — never fall through with an empty `where` filter, which would expose all timetable records.

**How to apply:** Any route that scopes by the authenticated user's related record (student, teacher) must treat a missing record as a hard failure, not a soft one.

## Conflict validation
Two separate application-level checks before write:
1. Teacher already has an entry at this `(teacherId, day, period)` — 409 with teacher name + conflicting class.
2. Class+section already has a subject at this `(className, section, day, period)` — 409 with class + conflicting subject.
These mirror the two Prisma unique constraints as a belt-and-suspenders approach (Prisma P2002 caught in catch as fallback).

## Files changed
- `server/prisma/schema.prisma` — Timetable model
- `server/src/routes/timetable.ts` — full rewrite (GET/POST/PUT/DELETE)
- `src/pages/teacher/TTimetable.tsx` — full rewrite (CRUD + weekly grid)
- `src/pages/headmaster/HMTimetable.tsx` — new file (by-teacher/by-class tabs)
- `src/pages/headmaster/HeadmasterLayout.tsx` — added Calendar nav item
- `src/App.tsx` — added HMTimetable route
- `src/pages/student/STimetable.tsx` — minor: shows roomNumber in day view
