---
name: Examination & Marks module
description: Parallel Exam/Subject/Mark system built alongside the legacy Marks model — key decisions for future extension
---

## Status
Fully implemented: Headmaster (Exam/Subject CRUD, publish/unpublish, analysis dashboard, Excel export), Teacher (cascading marks entry with publish lock), Student (published-only results view, PDF report card download).

## Coexistence with legacy `Marks` model
A simple legacy `Marks` model/route (string subject/examName, no exam lifecycle) already existed and must stay untouched. The new system uses separate `Exam`, `Subject`, `Mark` models (capital, singular) with proper FKs and a DRAFT/PUBLISHED lifecycle. Both systems run in parallel — do not merge them without explicit instruction.

**Why:** legacy pages/routes actively used elsewhere; a bolt-on rewrite risked breaking working functionality that wasn't in scope.

## Publish lifecycle is the core invariant
- Exam has `status: DRAFT | PUBLISHED`.
- Publishing requires at least one Mark to exist for that exam (blocks empty publishes).
- Once PUBLISHED: teachers get 403 on create/update/delete for that exam's marks; only Headmaster can unpublish to make them editable again. Students can only ever see PUBLISHED exam results.
- Publish triggers `notifyAllOfRole('STUDENT', ...)`.

**How to apply:** any new marks-related endpoint must check `exam.status` before allowing a TEACHER write, and must filter `exam.status = PUBLISHED` for STUDENT reads.

## Ownership pattern reused as-is
Marks entry for TEACHER role is gated by `student.createdByTeacherId === teacherId`, identical to the existing `marks.ts`/`students.ts` convention. Seed data does not populate `createdByTeacherId`, so teacher-scoped testing requires creating a student via that teacher first, or testing via HEADMASTER (which bypasses ownership).
