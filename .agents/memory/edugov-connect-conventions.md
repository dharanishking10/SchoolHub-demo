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
