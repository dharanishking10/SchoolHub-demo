---
name: EduGov Connect conventions
description: Durable conventions for notifications/audit/export/security in the EduGov Connect (Stage 9) codebase
---

## Export Center is CSV-only
No PDF/Excel libraries (jspdf/xlsx) are installed. All `/api/export/*` routes stream CSV.
**Why:** scope was time-boxed and CSV covers the "export data" requirement without adding new deps.
**How to apply:** if the user asks for real PDF/Excel output, install `jspdf`/`xlsx` and add new endpoints rather than changing the CSV ones (other pages depend on the CSV content-type).

## Activity log hook pattern
`server/src/utils/activityLog.ts` exposes `notify`, `notifyAllOfRole`, `notifyClass`, `audit`. Any route that creates/updates a user-facing record (attendance, homework, marks, leave, announcements, teacher/student CRUD) should call the relevant `notify*` and `audit` functions inline after the Prisma write succeeds.
**Why:** keeps Notification/AuditLog population centralized and consistent instead of ad hoc per-route logic.
**How to apply:** when adding a new mutating route, check this file first and reuse the helpers rather than writing new notification/audit logic.

## Session security implemented client-side
No refresh-token/rotating-session backend exists. JWTs are 8h (`server/src/middleware/auth.ts`). Auto-logout is enforced purely in `src/contexts/AuthContext.tsx`: it decodes the JWT `exp` client-side to schedule logout at expiry, and separately tracks user activity (mousedown/keydown/scroll/touch/mousemove) with a 20-minute idle timeout.
**Why:** no backend session store existed; simplest hardening without a bigger refresh-token redesign.
**How to apply:** if extending auth, keep the idle-timeout and expiry-timeout logic in AuthContext so all three role dashboards inherit it automatically via context.

## Teachers can only edit today's attendance
`POST /api/attendance` rejects (403) when `req.user.role === 'TEACHER'` and the submitted `date` isn't today; Headmasters are unrestricted. Frontend (`TAttendance.tsx`) also disables the mark buttons in this case rather than relying solely on the backend error.
**Why:** explicit product requirement to prevent teachers from retroactively altering records; Headmaster is the escalation path for corrections.

## Brand identity is Tamil Nadu Government, not US
The canonical brand text is "Government of Tamil Nadu / Department of School Education" (see `LandingPage.tsx`, layout headers). Some older top-level page files had drifted to "U.S. Department of Education" copy.
**Why:** those pages (`Dashboard.tsx`, `StudentDashboard.tsx`, `HeadmasterDashboard.tsx`, `TeacherDashboard.tsx`) were unused/unrouted legacy leftovers with stale placeholder copy; `LoginPage.tsx` also had the same drift despite being live. All four unused files were deleted and `LoginPage.tsx` was corrected.
**How to apply:** if any new page shows US-government copy or a differing brand line, treat it as drift — align to the Tamil Nadu Government wording and check whether the file is even routed in `App.tsx` before fixing (it may be dead code to delete instead).

## In-app confirm/alert pattern for exam module
`Examinations.tsx` uses local `confirmAction`/`pageError` state + an inline modal instead of native `confirm()`/`alert()`, to match the app's polished UI. Other older pages (e.g. `TAnnouncements.tsx`, `Announcements.tsx`) still use native `confirm()`.
**Why:** native dialogs look out of place against the government-portal styling; kept scoped to files touched during Stage 14 polish rather than a full app-wide sweep.
**How to apply:** if asked to polish another page, replace native `confirm()/alert()` with the same local-state + modal pattern for consistency, rather than introducing a new toast library.
